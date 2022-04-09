from collections import defaultdict
from ws.services.file.file_picker import FilePicker
from ws.services.file.file_source import FileSource
from ws.services.file.file import File
from typing import Dict
from abc import ABC, abstractmethod
import logging


class FilePool(ABC):
    @abstractmethod
    def can_pick(self) -> bool:
        pass

    @abstractmethod
    def add_author(self, author: str, file_source: FileSource):
        pass

    @abstractmethod
    def pick(self) -> File:
        pass


class ReplenishingFilePool(FilePool):
    def __init__(self, file_picker: FilePicker):
        self.__file_picker = file_picker
        self.__author_file_counter = defaultdict(int)
        self.__author_file_source: Dict[str, FileSource] = {}

    def can_pick(self) -> bool:
        return self.__file_picker.can_pick_file()

    def add_author(self, author: str, file_source: FileSource):
        self.__author_file_source[author] = file_source
        self.__put_files_in_pool(author)

    def pick(self) -> File:
        picked_file = self.__file_picker.pick_file()
        author = picked_file.get_author()
        self.__author_file_counter[author] -= 1
        if self.__author_file_counter[author] == 0:
            logging.info(
                "author [%s] Repo [%s]; author has exhausted files from pool, trying to fetch some more",
                author,
                picked_file.get_repo().get_name(),
            )

            self.__put_files_in_pool(author)
        return picked_file

    def __put_files_in_pool(self, author: str):
        file_source = self.__author_file_source[author]
        if not file_source.is_setup():
            file_source.setup()

        if file_source.can_get_files():
            fetched_files = file_source.get_next_files()
            self.__file_picker.add_files(fetched_files)
            self.__author_file_counter[author] += len(fetched_files)

        if self.__author_file_counter[author] == 0:
            logging.info(
                "author [%s]; no more files can be fetched for this author", author
            )
        else:
            logging.info("author [%s]; fetched more files for author", author)
