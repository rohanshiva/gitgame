from services.chunk_fetcher import ChunkFetcher
from services.file_fetcher import FileFetcher
from services.chunk import Chunk


class Session:
    def __init__(
        self,
        id: str,
        users: list[str],
        file_fetcher: FileFetcher,
        chunk_fetcher: ChunkFetcher,
    ):
        self.__id = id
        self.__users = users
        self.__file_fetcher = file_fetcher
        self.__chunk_fetcher = chunk_fetcher
        self.__has_setup = False

    def setup(self):
        files = self.__file_fetcher.get_files(self.__users)
        self.__chunk_fetcher.add_files(files)
        self.__has_setup = True

    def is_setup(self) -> bool:
        return self.__has_setup

    def can_pick(self) -> bool:
        return self.__chunk_fetcher.can_pick_chunk()

    def pick(self):
        if self.__chunk_fetcher.can_pick_chunk():
            self.__chunk_fetcher.pick_starting_chunk()
        else:
            print("No more chunks to select")

    def can_peek(self) -> bool:
        return self.__chunk_fetcher.can_peek()

    def peek_above(self):
        if self.__chunk_fetcher.can_peek():
            self.__chunk_fetcher.peek_above()

    def peek_below(self):
        if self.__chunk_fetcher.can_peek():
            self.__chunk_fetcher.peek_below()

    def get_chunk(self) -> Chunk:
        return self.__chunk_fetcher.get_chunk()
