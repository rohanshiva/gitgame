from gitgame.services.chunk.chunk import Chunk
from gitgame.services.file.file import File
import logging
from abc import ABC, abstractmethod

logger = logging.getLogger()


class ChunkFetcher(ABC):
    @abstractmethod
    def use_file(self, file: File):
        pass

    @abstractmethod
    def can_pick_chunk(self) -> bool:
        pass

    @abstractmethod
    def can_peek(self) -> bool:
        pass

    @abstractmethod
    def peek_above(self):
        pass

    @abstractmethod
    def peek_below(self):
        pass

    @abstractmethod
    def get_chunk(self) -> Chunk:
        pass


class WindowChunkFetcher(ChunkFetcher):
    def __init__(
        self, initial_chunk_size: int = 20, peek_size: int = 10, max_peeks: int = 10
    ):
        self.__file = None
        self.__initial_chunk_size = initial_chunk_size
        self.__peek_size = peek_size
        self.__max_peeks = max_peeks
        self.__current_peeks = 0
        self.__chunk = None
        self.__lines = None

    def use_file(self, file: File):
        self.__file = file
        self.__current_peeks = 0
        self.__pick_starting_chunk()

    def can_pick_chunk(self) -> bool:
        return not (self.__file is None)

    def __pick_starting_chunk(self):
        logger.info(
            "User [%s] Repo [%s]; trying to pick chunk in file %s",
            self.__file.get_user(),
            self.__file.get_repo(),
            self.__file.get_path(),
        )

        lines = self.__file.readlines()
        best_start_line = 0
        current_size_sum = 0

        for i in range(min(len(lines), self.__initial_chunk_size)):
            current_size_sum += self.__get_line_size(lines[i])

        optimal_size_sum = current_size_sum
        for i in range(self.__initial_chunk_size, len(lines)):
            current_size_sum -= self.__get_line_size(
                lines[i - self.__initial_chunk_size]
            )
            current_size_sum += self.__get_line_size(lines[i])
            if current_size_sum >= optimal_size_sum:
                optimal_size_sum = current_size_sum
                best_start_line = (i - self.__initial_chunk_size) + 1

        best_end_line = best_start_line + min(len(lines), self.__initial_chunk_size)
        self.__chunk = Chunk(
            self.__file.get_filename(),
            best_start_line,
            best_end_line,
            lines[best_start_line:best_end_line],
        )
        self.__lines = lines

    def can_peek(self) -> bool:
        return self.can_pick_chunk() and self.__current_peeks < self.__max_peeks

    def peek_above(self):
        if self.can_peek():
            start_line = self.__chunk.get_start_line()
            above_start_line = max(start_line - self.__peek_size, 0)
            above_contents = []
            for i in range(above_start_line, start_line):
                above_contents.append(self.__lines[i])

            self.__chunk.merge_chunk(
                Chunk(
                    self.__file.get_filename(),
                    above_start_line,
                    start_line,
                    above_contents,
                )
            )
            self.__current_peeks += 1
            logger.info(
                "User [%s] Repo [%s] File [%s]; peeked above, remaining %d peeks",
                self.__file.get_user(),
                self.__file.get_repo(),
                self.__file.get_path(),
                self.__max_peeks - self.__current_peeks,
            )

    def peek_below(self):
        if self.can_peek():
            end_line = self.__chunk.get_end_line()
            below_end_line = min(end_line + self.__peek_size, len(self.__lines))
            below_contents = []
            for i in range(end_line, below_end_line):
                below_contents.append(self.__lines[i])

            self.__chunk.merge_chunk(
                Chunk(
                    self.__file.get_filename(),
                    end_line,
                    below_end_line,
                    below_contents,
                )
            )
            self.__current_peeks += 1
            logger.info(
                "User [%s] Repo [%s] File [%s]; peeked below, remaining %d peeks",
                self.__file.get_user(),
                self.__file.get_repo(),
                self.__file.get_path(),
                self.__max_peeks - self.__current_peeks,
            )

    def get_chunk(self):
        return self.__chunk

    def __get_line_size(self, line: str):
        return len(line.strip())
