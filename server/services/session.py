from services.chunk_fetcher import ChunkFetcher
from services.file_fetcher import FileFetcher
from services.file_rule import FileRule


class Session:

    def __init__(self, users:list[str], file_fetcher: FileFetcher, chunk_fetcher: ChunkFetcher):
        self.__users = users
        self.__file_fetcher = file_fetcher
        self.__chunk_fetcher = chunk_fetcher
    
    async def setup(self):
        pass

    