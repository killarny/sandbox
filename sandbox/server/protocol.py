from collections import OrderedDict
import inspect
import json
import logging
from twisted.internet import defer
from twisted.protocols.basic import LineOnlyReceiver
from twisted.python import failure

# create a log target for this module
logger = logging.getLogger(__name__)


TRUE_VALUES = [True, 'True', 'true', 1, '1']
FALSE_VALUES = [False, 'False', 'false', 0, '0', 'null']
def truthy(value):
    """Return boolean indicating whether value is truthy or falsey.
    """
    if value in TRUE_VALUES:
        return True
    if value in FALSE_VALUES:
        return False
    return boolean(value)


class JSONCommandProtocol(LineOnlyReceiver):
    delimiter = '\n\n'
    func_prefix = 'command_'
    protected_commands = ['parser']
    hash = None
    
    @property
    def is_connected(self):
        try:
            return bool(self.transport)
        except AttributeError:
            return False
    
    @property
    def client_info(self):
        return self.transport.getPeer()
    
    def connectionLost(self, reason):
        LineOnlyReceiver.connectionLost(self, reason)
        # tell the factory that we had a disconnection
        self.factory.client_disconnected(self.client_info, reason)
    
    def lineReceived(self, line):
        # log input when debug is enabled
        if self.factory.options.debug:
            logger.debug('RX {host}:{port}\n{delim}\n{line}\n{delim}'.format(
                host=self.client_info.host, 
                port=self.client_info.port,
                line=line, 
                delim='-'*80,
            ))
        
        # parse the line as a json structure
        try:
            request = json.loads(line)
        except ValueError as e:
            self.write_error(str(e), 'parser', None)
            return
            
        # handle the json command
        
        # find a callback id in the request
        try:
            callback_id = request.pop('id')
        except KeyError:
            self.write_error('id is required', 'parser', None)
            return
            
        # find a command in the request
        try:
            command = request.pop('command')
        except KeyError:
            self.write_error('command is required', 'parser', None)
            return
            
        # protect some commands from being invoked directly
        if command in self.protected_commands:
            self.write_error('invalid command', command, callback_id)
            
        # map command to a method on this class
        try:
            func = getattr(self, self.func_prefix + command)
        except AttributeError:
            self.write_error('invalid command', command, callback_id)
            return

        # provide detailed errors about calls made when in debug mode
        ## FIXME: this introspection doesn't work when using decorators
        ## on the func being inspected, but since it's only for debugging,
        ## I'm postponing addressing that
        if self.factory.options.debug:
            # inspect the function to extract its arguments
            args, varargs, varkw, defaults = inspect.getargspec(func)
            # make a list of only keyword arguments (args with defaults)
            func_args = args
            func_kwargs = []
            req_kwargs = []
            opt_kwargs = []
            if defaults:
                func_args = args[:-len(defaults)]
                func_kwargs = args[len(func_args):]
                # build two lists; one for "required" kwargs, another for
                ## "optional"
                for k, v in zip(func_kwargs, defaults):
                    # optional kwargs have a default of None
                    if v is None:
                        opt_kwargs.append(k)
                    else:
                        req_kwargs.append(k)
            # list of kwargs that are missing from request
            missing_kwargs = set(req_kwargs).difference(request)
            # list of extra keys in request that aren't accepted by func
            extra_kwargs = set(request).difference(func_kwargs)

            if missing_kwargs:
                self.write_error('missing required data',
                    callback_type, callback_id,
                    missing=list(missing_kwargs))
                return
            if extra_kwargs:
                self.write_error('extra data given',
                    callback_type, callback_id,
                    extra=list(extra_kwargs))
                return

        # attempt to invoke the command
        try:
            maybeDeferred = func(callback_id, **request)
            if isinstance(maybeDeferred, defer.Deferred):
                maybeDeferred.addCallback(
                    self.write_result, command, callback_id)
                maybeDeferred.addErrback(
                    self.write_error, command, callback_id)
            else:
                self.write_result(maybeDeferred, command, callback_id)
        except Exception as e:
            if self.factory.debug:
                logger.exception(e)
            self.write_error(str(e), command, callback_id)
    
    def write_error(self, error_message, command, callback_id, **data):
        # sanitize the prefix from the command, if needed
        if command.startswith(self.func_prefix):
            command = command[len(self.func_prefix):]
        # if the error_message is a Failure instance, convert to a string
        if isinstance(error_message, failure.Failure):
            error_message = error_message.getErrorMessage()
        # construct the message
        message = OrderedDict()
        # some errors won't have a callback_id
        ## (ie, when invalid/incomplete JSON is recvd)
        if callback_id is not None:
            message.update({'id': callback_id})
        # add other message data
        message['result'] = command
        message['error'] = error_message
        # add any extra data supplied
        if data:
            message.update(data)
        self.transport.write(json.dumps(message))

    def write_result(self, result, command, callback_id, **data):
        # sanitize the prefix from the command, if needed
        if command.startswith(self.func_prefix):
            command = command[len(self.func_prefix):]
        # construct the message
        message = OrderedDict()
        message['id'] = callback_id
        message['result'] = command
        if result:
            message['data'] = result
        # add any extra data supplied
        if data:
            message.update(data)
        self.transport.write(json.dumps(message))

    def write_event(self, event_name, **data):
        # construct the message
        message = OrderedDict()
        message['event'] = event_name
        # add any extra data supplied
        if data:
            message.update(data)
        self.transport.write(json.dumps(message))
