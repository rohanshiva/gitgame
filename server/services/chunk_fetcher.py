
from services.chunk import Chunk
from services.file import File
from typing import  List
import random

class ChunkFetcher:

    def add_files(self, files: List[File]):
        pass

    def can_pick_chunk(self) -> bool:
        pass
    
    def pick_starting_chunk(self):
        pass

    def can_peek(self) -> bool:
        pass

    def peek_above(self):
        pass

    def peek_below(self):
        pass

    def get_chunk(self) -> Chunk:
        pass


class RandomChunkFetcher:

    def __init__(self, initial_chunk_size:int=20, peek_size:int=10, max_peeks:int=10):
        self.__files = []
        self.__initial_chunk_size = initial_chunk_size
        self.__peek_size = peek_size
        self.__max_peeks = max_peeks

        self.__current_peeks = 0
        self.__picked_file = None
        self.__chunk = None
        self.__lines = None

    def add_files(self, files: List[File]):
        for file in files:
            self.__files.append(file)

    def can_pick_chunk(self) -> bool:
        return len(self.__files) > 0
    
    def pick_starting_chunk(self):
        self.__picked_file = None
        self.__current_peeks = 0
        if self.can_pick_chunk():
            self.__picked_file = self.__pick_random_file()

            print("Picked:", self.__picked_file.get_path(), 
                "Repo:", self.__picked_file.get_repo(), "User:", self.__picked_file.get_user())
            
            lines = self.__picked_file.readlines()

            best_start_line = 0
            current_size_sum = 0
            
            for i in range(min(len(lines), self.__initial_chunk_size)):
                current_size_sum += self.__get_line_size(lines[i])
            
            optimal_size_sum = current_size_sum
            for i in range(self.__initial_chunk_size, len(lines)):
                current_size_sum -= self.__get_line_size(lines[i - self.__initial_chunk_size])
                current_size_sum += self.__get_line_size(lines[i])
                if current_size_sum >= optimal_size_sum:
                    optimal_size_sum = current_size_sum
                    best_start_line = (i - self.__initial_chunk_size) + 1

            best_end_line = best_start_line + min(len(lines), self.__initial_chunk_size)
            self.__chunk = Chunk(self.__picked_file.get_filename(), 
                                    best_start_line, best_end_line, 
                                    lines[best_start_line : best_end_line])
            self.__lines = lines
    
    def can_peek(self) -> bool:
        return not (self.__picked_file is None) and self.__current_peeks < self.__max_peeks
    
    def peek_above(self):
        if self.can_peek():
            start_line = self.__chunk.get_start_line()
            above_start_line = max(start_line - self.__peek_size, 0)
            above_contents = []
            for i in range(above_start_line, start_line):
                above_contents.append(self.__lines[i])

            self.__chunk.merge_chunk(Chunk(self.__picked_file.get_filename(),
                        above_start_line, start_line, above_contents))
            self.__current_peeks += 1
            print(f"[{self.__picked_file.get_path()}], User:{self.__picked_file.get_user()}, Remaining Peeks:{self.__current_peeks}")
    
    def peek_below(self):
        if self.can_peek():
            end_line = self.__chunk.get_end_line()
            below_end_line = min(end_line + self.__peek_size, len(self.__lines))
            below_contents = []
            for i in range(end_line, below_end_line):
                below_contents.append(self.__lines[i])
            
            self.__chunk.merge_chunk(Chunk(self.__picked_file.get_filename(),
                        end_line, below_end_line, below_contents))
            self.__current_peeks += 1
            print(f"[{self.__picked_file.get_path()}], User:{self.__picked_file.get_user()}, Remaining Peeks:{self.__current_peeks}")

    def get_chunk(self):
        return self.__chunk

    def __get_line_size(self, line : str):
        return len(line.strip())


    def __pick_random_file(self) -> File:
        pick_index = random.randint(0, len(self.__files) - 1)
        self.__files[pick_index], self.__files[-1] = self.__files[-1], self.__files[pick_index]
        return self.__files.pop()




