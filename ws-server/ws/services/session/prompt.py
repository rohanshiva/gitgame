from ws.services.chunk.chunk import Chunk
from ws.services.file.file import File
from ws.services.file.file_repository import FileRepository

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

    def get_file_chunk_url(self) -> str:
        chunk_start = self.__chunk.get_start_line() + 1
        chunk_end = self.__chunk.get_end_line()
        repo = self.get_repo()
        return f"https://github.com/{repo.get_name()}/blob/{repo.get_default_branch()}/{self.__file.get_filepath()}#L{chunk_start}#L{chunk_end}"
