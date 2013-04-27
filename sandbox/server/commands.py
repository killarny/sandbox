import logging
from sandbox.server.protocol import JSONCommandProtocol

# create a log target for this module
logger = logging.getLogger(__name__)


class ClientCommands(JSONCommandProtocol):
    """Contains all client commands.
    """
    def command_ping(self, callback_id):
        return 'pong'
