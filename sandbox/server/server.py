#!/usr/bin/env python
from argparse import ArgumentParser
import sys
from twisted.internet import reactor
from twisted.internet.protocol import ServerFactory
from txsockjs.factory import SockJSFactory
from parseltone.utils import log, parse_host_port
log.configure_handlers(log.DEFAULT_LEVEL, twisted_friendly=True)
from sandbox.server.commands import ClientCommands

# create a log target for this module
logger = log.logging.getLogger(__name__)


class Server(ServerFactory):
    """Listens for, and builds client connections.
    """
    protocol = ClientCommands
    clients = {
        'unauth': {},
        'authed': {},
    }
    host = None
    port = 8800

    def __init__(self, options):
        self.options = options

    def buildProtocol(self, client_info):
        client_connection = ServerFactory.buildProtocol(self, client_info)

        # add this new client to the dict of connected clients
        self.clients['unauth'].update({client_info: client_connection})

        # log about this new client when debug mode is enabled
        if self.options.debug:
            logger.info('Client connected from {host}:{port}.'.format(
                host = client_info.host, 
                port = client_info.port,
            ))

        return client_connection

    def listen(self, **sockjs_options):
        """Using SockJS, start listening on the address given in options.
        """
        # parse the host and port out of the string accepted for options.address
        self.host, self.port = parse_host_port(options.address, self.port)
        # wrap this factory in a txsockjs factory
        sockjs_factory = SockJSFactory(self, sockjs_options)
        # tell twisted to listen for connections
        reactor.listenTCP(self.port, sockjs_factory, interface=self.host)
        # log about our activity
        logger.info('Listening at ws://{host}:{port}'.format(
            host=self.host, 
            port=self.port,
        ))
        
    def client_disconnected(self, client_info, reason):
        # remove the client from the dict of connected clients
        for category, clients in self.clients.iteritems():
            try:
                clients.pop(client_info)
            except KeyError:
                pass
                
        # log disconnections when debug is enabled
        if self.options.debug:
            logger.info('Client from {host}:{port} has disconnected.'.format(
                host=client_info.host, 
                port=client_info.port,
            ))


if __name__ == '__main__':
    # parse the command line for options
    parser = ArgumentParser()
    parser.add_argument('-a', '--address', default='0.0.0.0:10173',
        help='Address to listen at, with port if needed. '
        '(default: %(default)s)')
    parser.add_argument('--web-api', default='http://localhost/api',
        help='URL for the web API. (default: %(default)s)')
    parser.add_argument('-d', '--debug', action='store_true',
        help='Enable debug mode.')
    options = parser.parse_args()

    # start our server, and run the asynchronous reactor loop
    server = Server(options)
    try:
        server.listen()
        reactor.run()
    except KeyboardInterrupt:
        sys.exit()
    except Exception as e:
        logger.error(str(e))
        sys.exit(1)