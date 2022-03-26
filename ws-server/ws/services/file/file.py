from pathlib import Path
from typing import List
from http import HTTPStatus
from abc import ABC, abstractmethod
import requests
import logging
from ws.services.file.file_repository import FileRepository

logger = logging.getLogger()


class File(ABC):
    @abstractmethod
    def get_author(self) -> str:
        pass

    @abstractmethod
    def get_filepath(self) -> str:
        pass

    @abstractmethod
    def get_filename(self) -> str:
        pass

    @abstractmethod
    def get_size(self) -> int:
        pass

    @abstractmethod
    def readlines(self) -> List[str]:
        pass

    @abstractmethod
    def get_repo(self) -> FileRepository:
        pass


class NetworkFile(File):
    def __init__(
        self, author: str, path: str, repo: FileRepository, download_url: str, size: int
    ):
        self.__author = author
        self.__path = path
        self.__repo = repo
        self.__download_url = download_url
        self.__size = size

    def get_author(self) -> str:
        return self.__author

    def get_filepath(self) -> str:
        return self.__path

    def get_filename(self) -> str:
        return Path(self.__path).name

    def get_repo(self) -> FileRepository:
        return self.__repo

    def get_size(self) -> int:
        return self.__size

    def readlines(self) -> List[str]:
        response = requests.get(self.__download_url)
        logger.info(
            "Author [%s] Repo [%s] Path [%s]; downloading via url: %s",
            self.__author,
            self.__repo.get_name(),
            self.__path,
            self.__download_url,
        )
        if response.status_code == HTTPStatus.OK:
            return response.text.split("\n")
        else:
            logger.error(
                "Author [%s] Repo [%s] Path [%s]; failed to download with status: %d and response %s",
                self.__author,
                self.__repo.get_name(),
                self.__path,
                response.status_code,
                response.text,
            )
            raise Exception(f"Unable to download file {self.__path}: {response.text}")
