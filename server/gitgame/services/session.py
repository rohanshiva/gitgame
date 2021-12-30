from gitgame.services.file.file_source import FileSource
from gitgame.services.file.file_pool import FilePool
from gitgame.services.chunk.chunk_fetcher import ChunkFetcher
from gitgame.services.chunk.chunk import Chunk
from gitgame.services.file.file import File
from typing import List, Callable
import logging

logger = logging.getLogger()


class Session:
    def __init__(
        self,
        id: str,
        players: list[str],
        file_source_factory: Callable[[str], FileSource],
        file_pool: FilePool,
        chunk_fetcher_factory: Callable[[File], ChunkFetcher]
    ):
        self.__id = id
        self.__players = players
        self.__file_source_factory = file_source_factory
        self.__file_pool = file_pool
        self.__chunk_fetcher_factory = chunk_fetcher_factory
        self.__chunk_fetcher = None
        self.__has_setup = False

    def setup(self):
        for player in self.__players:
            self.__file_pool.add_player(player, self.__file_source_factory(player))
        self.__has_setup = True

    def is_setup(self) -> bool:
        return self.__has_setup

    def can_pick_file(self) -> bool:
        return self.__file_pool.can_pick()
    
    def can_get_chunk(self) -> bool:
        return not (self.__chunk_fetcher is None) and self.__chunk_fetcher.can_get_chunk()

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
        if self.can_get_chunk():
            return self.__chunk_fetcher.get_chunk()
        return None

    def get_players(self) -> List[str]:
        return self.__players
