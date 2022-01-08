from gitgame.services.chunk.chunk import Chunk
from gitgame.services.file.file import File
from gitgame.services.file.file_repository import FileRepository

from typing import List
from datetime import datetime


class Prompt:
    def __init__(
        self,
        chunk: Chunk,
        choices: List[str],
        correct_choice: str,
        guess_expiration: datetime,
        file: File,
    ):
        self.__chunk = chunk
        self.__choices = choices
        self.__correct_choice = correct_choice
        self.__guess_expiration = guess_expiration  # utc time
        self.__file = file

    def set_chunk(self, chunk: Chunk):
        self.__chunk = chunk

    def get_chunk(self) -> Chunk:
        return self.__chunk

    def get_choices(self) -> List[str]:
        return self.__choices

    def get_correct_choice(self) -> str:
        return self.__correct_choice

    def get_guess_expiration(self) -> datetime:
        return self.__guess_expiration

    def get_repo(self) -> FileRepository:
        return self.__file.get_repo()
