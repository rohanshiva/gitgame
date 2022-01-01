from gitgame.services.file.file_source import FileSource
from gitgame.services.file.file_pool import FilePool
from gitgame.services.chunk.chunk_fetcher import ChunkFetcher
from gitgame.services.chunk.chunk import Chunk
from gitgame.services.session.player import Player
from gitgame.services.session.player_manager import PlayerManager
from gitgame.services.file.file import File
from typing import List, Callable, Dict
import logging

from server.gitgame.services.session.player import PlayerState

logger = logging.getLogger()

# this class with constants is used to specify the type of message the server sends to the clients through the websockets
class MessageType:
    LOBBY = "lobby"

class SessionState:
    WAITING = "waiting"

class ClientEventType:
    TOGGLE_READY = "toggle_ready"

class Session:
    def __init__(
        self,
        id: str,
        authors: list[str],
        file_source_factory: Callable[[str], FileSource],
        file_pool: FilePool,
        chunk_fetcher_factory: Callable[[File], ChunkFetcher],
    ):
        self.__id = id
        self.__authors = authors
        self.__player_manager = PlayerManager()
        self.__file_source_factory = file_source_factory
        self.__file_pool = file_pool
        self.__chunk_fetcher_factory = chunk_fetcher_factory
        self.__chunk_fetcher = None
        self.__has_setup = False

    def setup(self):
        # add any of the predetermined authors' file sources
        for author in self.__authors:
            self.__file_pool.add_player(author, self.__file_source_factory(author))
        self.__has_setup = True

    def is_setup(self) -> bool:
        return self.__has_setup

    async def connect(self, player: Player):
        await player.get_websocket().accept()

        self.__player_manager.add_player(player)
        if player.get_username() not in self.__authors:
            self.__authors.append(player.get_username())
            self.__file_pool.add_player(
                player.get_username(), self.__file_source_factory(player.get_username())
            )
        self.__broadcast_lobby()

    def disconnect(self, player: Player):
        self.__player_manager.remove_player(player)
        self.__broadcast_lobby()

    def can_pick_file(self) -> bool:
        return self.__file_pool.can_pick()

    def can_get_chunk(self) -> bool:
        return (
            not (self.__chunk_fetcher is None) and self.__chunk_fetcher.can_get_chunk()
        )

    def pick_file(self):
        self.__chunk_fetcher = None
        while self.can_pick_file() and (not self.can_get_chunk()):
            file = self.__file_pool.pick()
            try:
                self.__chunk_fetcher = self.__chunk_fetcher_factory(file)
                self.__chunk_fetcher.pick_starting_chunk()
            except Exception as e:
                # keep trying to pick more files to use until we are able to get chunks from a file
                logger.error("Session [%s], Failed to pick starting chunk", self.__id)

        if not self.can_get_chunk():
            logger.info("Session [%s]; no more files to pick chunks from", self.__id)

    def can_peek(self) -> bool:
        return self.can_get_chunk() and self.__chunk_fetcher.can_peek()

    def peek_above(self):
        if self.can_peek():
            self.__chunk_fetcher.peek_above()

    def peek_below(self):
        if self.can_peek():
            self.__chunk_fetcher.peek_below()

    def get_chunk(self) -> Chunk:
        return self.__chunk_fetcher.get_chunk()

    def get_player_names(self) -> List[str]:
        return list(map(lambda player: player.get_username()), self.__player_manager.get_players())

    def get_authors(self) -> List[str]:
        return self.__authors

    async def __broadcast(self, message_type: str, message):
        for player in self.__players:
            await player.websocket.send_json({
                "msg_type": message_type,
                "message": message
            })
    
    async def __broadcast_lobby(self):
        players_json = list(map(lambda player: player.serialize(), self.__player_manager.get_players()))
        await self.__broadcast(MessageType.LOBBY, players_json)
    
    async def handle_client_event(self, player: Player, data: Dict):
        handlers = {
            ClientEventType.TOGGLE_READY: self.__handle_toggle_ready
        }
        if not ("event_type" in data):
            logger.error("Session [%s]; recieved data from client without an event type", self.__id)
            return 

        if not (data["event_type"] in handlers):
            logger.error("Session [%s]; recieved data from client with invalid event type: %s", self.__id, data["event_type"])
            return
        
        await handlers[data["event_type"]](player, data)
    
    async def __handle_toggle_ready(self, player: Player, data: Dict):
        if player.get_state() == PlayerState.NOT_READY:
            player.set_state(PlayerState.READY)
        else:
            player.get_state(PlayerState.NOT_READY)

        await self.__broadcast_lobby()



        
