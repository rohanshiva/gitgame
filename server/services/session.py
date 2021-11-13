from services.file.file_source import FileSource
from services.file.file_pool import FilePool
from services.chunk.chunk_fetcher import ChunkFetcher
from services.chunk.chunk import Chunk
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
        if self.can_pick():
            file = self.__file_pool.pick()
            self.__chunk_fetcher.set_file(file)
        else:
            logger.info("Session [%s]; no more chunks to pick")

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
