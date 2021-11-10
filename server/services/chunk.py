from __future__ import annotations
from typing import List


class Chunk:
    
    def __init__(self, start_line : int, end_line : int, content : List[str]):
        self.__start = start_line
        self.__end = end_line
        self.__content = content
    
    def get_start_line(self) -> int:
        return self.__start

    def get_end_line(self) -> int:
        return self.__end
    
    def get_content(self) -> str:
        return "\n".join(self.__content)
    
    
    # naive merging of chunks, assumes the chunks' start and end positions don't overlap
    def merge_chunk(self, chunk : Chunk):
        chunk_order = [chunk.__content, self.__content]
        if chunk.__start >= self.__end:
            chunk_order = [self.__content, chunk.__content]

        merged_contents = []
        for chunk_contents in chunk_order:
            for line in chunk_contents:
                merged_contents.append(line)
        
        self.__content = merged_contents
        self.__start = min(self.__start, chunk.__start)
        self.__end = max(self.__end, chunk.__end)


