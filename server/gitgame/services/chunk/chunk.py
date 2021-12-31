from __future__ import annotations
from typing import List


class Chunk:
    def __init__(
        self, file_name: str, start_line: int, end_line: int, content: List[str]
    ):
        self.__file_name = file_name
        self.__start = start_line
        self.__end = end_line
        self.__content = content

    def get_start_line(self) -> int:
        return self.__start

    def get_end_line(self) -> int:
        return self.__end

    def get_content(self):
        chunk_lines = []
        for i in range(len(self.__content)):
            chunk_lines.append(
                {"line_number": i + self.__start, "content": self.__content[i]}
            )

        return {"filename": self.__file_name, "lines": chunk_lines}

    # naive merging of chunks, assumes the chunks' start and end positions don't overlap
    def merge_chunk(self, chunk: Chunk):
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
