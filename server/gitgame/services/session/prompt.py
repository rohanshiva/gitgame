from gitgame.services.chunk.chunk import Chunk
from typing import List, Dict


class Prompt:
    def __init__(self, chunk: Chunk, choices: List[str], correct_choice: str):
        self.__chunk = chunk
        self.__choices = choices
        self.__correct_choice = correct_choice

    def serialize(self) -> Dict:
        return {"chunk": self.__chunk.get_content(), "choices": self.__choices}

    def set_chunk(self, chunk: Chunk):
        self.__chunk = chunk

    def get_correct_choice(self) -> str:
        return self.__correct_choice
