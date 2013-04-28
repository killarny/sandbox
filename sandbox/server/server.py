#!/usr/bin/env python
from argparse import ArgumentParser
import hashlib
import sys
from uuid import uuid4
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

    def buildProtocol(self, peer):
        client_connection = ServerFactory.buildProtocol(self, peer)
        
        # construct a client hash
        m = hashlib.md5()
        m.update(str(uuid4()))
        client_hash = m.hexdigest()
        
        # store hash on connection object
        client_connection.hash = client_hash

        # add this new client to the dict of connected clients
        self.clients['unauth'].update({peer: {
            'hash': client_hash,
            'connection': client_connection,
        }})

        # log about this new client when debug mode is enabled
        if self.options.debug:
            logger.info('Client connected from {host}:{port}.'.format(
                host = peer.host, 
                port = peer.port,
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
        
    def client_disconnected(self, peer, reason):
        # remove the client from the dict of connected clients
        for category, clients in self.clients.iteritems():
            try:
                client_info = clients.pop(peer)
            except KeyError:
                continue
            
            # get the hash for this client
            client_hash = client_info.get('hash')
            connection = client_info.get('connection')
                    
            # log disconnections when debug is enabled
            if self.options.debug:
                logger.info('Client from {host}:{port} has disconnected.'.format(
                    host=peer.host, 
                    port=peer.port,
                ))

            # tell the other clients that someone has disconnected
            self.broadcast_event('client_disconnected', {
                'id': client_hash, 
                'username': connection.user.username,
            })
            
    def client_authed(self, peer):
        """A client has become authorized.
        """
        if peer not in self.clients['unauth']:
            return
        client_info = self.clients['unauth'].pop(peer)
        hash = client_info.get('hash')
        connection = client_info.get('connection')
        
        # move client connection object into the authed dictionary
        self.clients['authed'].update({
            peer: client_info,
        })

        # tell the other clients that someone new has connected
        self.broadcast_event('client_connected', {
            'id': hash,
            'username': connection.user.username,
        })

    def broadcast_event(self, event_name, event_data, 
            authed_only=True, exclude=[]):
        # convert non-dict data to a dict
        if type(event_data) != dict:
            event_data = {'info': event_data}
        # write an event to each client
        for category, clients in self.clients.iteritems():
            if authed_only and category is not 'authed':
                continue
            for peer, client_info in clients.iteritems():
                if peer in exclude:
                    continue
                hash = client_info.get('hash')
                connection = client_info.get('connection')
                if not connection or not connection.is_connected:
                    continue
                connection.write_event(event_name, **event_data)


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