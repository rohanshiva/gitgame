from gitgame.services.file.file_source import FileSource
from gitgame.services.file.file_pool import FilePool
from gitgame.services.chunk.chunk_fetcher import ChunkFetcher
from gitgame.services.chunk.chunk import Chunk
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
        chunk_fetcher: ChunkFetcher,
    ):
        self.__id = id
        self.__players = players
        self.__file_source_factory = file_source_factory
        self.__file_pool = file_pool
        self.__chunk_fetcher = chunk_fetcher
        self.__has_setup = False

    def setup(self):
        for player in self.__players:
            self.__file_pool.add_player(player, self.__file_source_factory(player))
        self.__has_setup = True

    def is_setup(self) -> bool:
        return self.__has_setup

    def can_pick(self) -> bool:
        return self.__file_pool.can_pick()

    def pick(self):
        is_using_file = False
        while self.can_pick() and not is_using_file:
            file = self.__file_pool.pick()
            try:
                self.__chunk_fetcher.use_file(file)
                is_using_file = True
            except Exception as e:
                # keep trying to pick more files to use until we are able to use a file in the chunk fetcher without issues
                pass
        
        if not is_using_file:
            logger.info("Session [%s]; no more files to pick chunks from")

    def can_peek(self) -> bool:
        return self.__chunk_fetcher.can_peek()

    def peek_above(self):
        if self.can_peek():
            self.__chunk_fetcher.peek_above()

    def peek_below(self):
        if self.can_peek():
            self.__chunk_fetcher.peek_below()

    def get_chunk(self) -> Chunk:
        return self.__chunk_fetcher.get_chunk()

    def get_players(self) -> List[str]:
        return self.__players
