from gitgame.services.chunk.chunk import Chunk
from typing import List, Dict
from datetime import datetime


class Prompt:
    def __init__(self, chunk: Chunk, choices: List[str], correct_choice: str, guess_expiration: datetime):
        self.__chunk = chunk
        self.__choices = choices
        self.__correct_choice = correct_choice
        self.__guess_expiration = guess_expiration # utc time

    def serialize(self) -> Dict:
        return {"chunk": self.__chunk.get_content(), "choices": self.__choices, 
                    "guess_expiration": str(self.__guess_expiration)}

    def set_chunk(self, chunk: Chunk):
        self.__chunk = chunk

    def get_correct_choice(self) -> str:
        return self.__correct_choice
    
    def get_guess_expiration(self) -> datetime:
        return self.__guess_expiration
