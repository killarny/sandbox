import logging
from sandbox.server.protocol import JSONCommandProtocol

# create a log target for this module
logger = logging.getLogger(__name__)


class ClientCommands(JSONCommandProtocol):
    """Contains all client commands.
    """
    def command_ping(self, callback_id):
        return 'pong'

    def command_client_list(self, callback_id):
        """Get the client list, leaving out this client.
        """
        client_hashes = []
        for category, clients in self.factory.clients.iteritems():
            # TODO: don't show unauthed clients, when auth is implemented
            #if category is not 'authed':
            #    continue
            for peer, client_info in clients.iteritems():
                if client_info.get('connection') == self:
                    continue
                client_hashes.append(client_info.get('hash'))
        return client_hashes

    def command_chat_say(self, callback_id, message=''):
        """Say something in chat.
        """
        self.factory.broadcast_event('chat_say', {
            'author_id': self.hash,
            'message': message,
        })