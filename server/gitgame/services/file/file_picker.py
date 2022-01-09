from abc import ABC, abstractmethod
from typing import List
from gitgame.services.file.file import File
import random


class FilePicker(ABC):
    @abstractmethod
    def add_files(self, files: List[File]):
        pass

    @abstractmethod
    def can_pick_file(self) -> bool:
        pass

    @abstractmethod
    def pick_file(self) -> File:
        pass


class RandomFilePicker(FilePicker):
    def __init__(self):
        self.__files = []

    def add_files(self, files: List[File]):
        for file in files:
            self.__files.append(file)

    def can_pick_file(self) -> bool:
        return len(self.__files) > 0

    def pick_file(self) -> File:
        if self.can_pick_file():
            pick_index = random.randint(0, len(self.__files) - 1)
            self.__files[-1], self.__files[pick_index] = (
                self.__files[pick_index],
                self.__files[-1],
            )
            return self.__files.pop()
        else:
            raise Exception(
                "Tried to call pick_file() when there are no files to pick."
            )
