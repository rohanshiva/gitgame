
from services.chunk import Chunk
from services.file import File
from typing import List
import random

class ChunkFetcher:

    def can_pick_chunk(self) -> bool:
        pass
    
    def pick_starting_chunk(self):
        pass

    def peek_above(self):
        pass

    def peek_below(self):
        pass

    def get_chunk(self) -> Chunk:
        pass


class RandomChunkFetcher:

    def __init__(self, files: List[File], initial_chunk_size:int, peek_size:int):
        self.__files = files
        self.__initial_chunk_size = initial_chunk_size
        self.__peek_size = peek_size
        self.__picked_file = None
        self.__chunk = None

    def can_pick_chunk(self) -> bool:
        return len(self.__files) > 0
    
    def pick_starting_chunk(self):
        pick_index = random.randint(0, len(self.__files) - 1)
        self.__picked_file = self.__files[pick_index]
        
        best_start = 0
        


