from math import log
from pathlib import Path
from typing import Dict, List
from http import HTTPStatus
import requests
import logging

logger = logging.getLogger()


class File:
    def __str__(self) -> str:
        return f"{self.get_repo()} : {self.get_path()}"

    def serialize(self) -> Dict:
        return {
            "user": self.get_user(),
            "path": self.get_path(),
            "repo": self.get_repo(),
            "size": self.get_size(),
        }

    def get_user(self) -> str:
        pass

    def get_path(self) -> str:
        pass

    def get_filename(self) -> str:
        pass

    def get_repo(self) -> str:
        pass

    def get_size(self) -> int:
        pass

    def readlines(self) -> List[str]:
        pass


class NetworkFile(File):
    def __init__(self, user: str, path: str, repo: str, download_url: str, size: int):
        self.__user = user
        self.__path = path
        self.__repo = repo
        self.__download_url = download_url
        self.__size = size

    def serialize(self) -> Dict:
        serial_file = super().serialize()
        serial_file["download_url"] = self.__download_url
        return serial_file

    def get_user(self) -> str:
        return self.__user

    def get_path(self) -> str:
        return self.__path

    def get_filename(self) -> str:
        return Path(self.__path).name

    def get_repo(self) -> str:
        return self.__repo

    def get_size(self) -> int:
        return self.__size

    def readlines(self) -> List[str]:
        response = requests.get(self.__download_url)
        logging.info(
            "User [%s] Repo [%s] Path [%s]; downloading via %s",
            self.__user,
            self.__repo,
            self.__path,
            self.__download_url,
        )
        if response.status_code == HTTPStatus.OK:
            return response.text.split("\n")
        else:
            logging.error(
                "User [%s] Repo [%s] Path [%s]; failed to download with status: %d and response %s",
                self.__user,
                self.__repo,
                self.__path,
                response.status_code,
                response.text,
            )
            return []
