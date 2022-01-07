from fastapi import WebSocket
from typing import Dict


class Player:
    def __init__(self, username: str, websocket: WebSocket):
        self.__username = username
        self.__websocket = websocket
        self.__has_guessed = False
        self.__guess = None
        self.__score = 0

    def get_username(self) -> str:
        return self.__username

    def get_websocket(self) -> WebSocket:
        return self.__websocket

    def set_guess(self, guess: str):
        self.__has_guessed = True
        self.__guess = guess

    def clear_guess(self):
        self.__has_guessed = False
        self.__guess = None

    def has_guessed(self):
        return self.__has_guessed

    def get_guess(self):
        return self.__guess

    def increment_score(self):
        self.__score += 1

    def __str__(self) -> str:
        return f"{self.username}"

    def serialize(self, with_guess: bool = False) -> Dict:
        player_json = {
            "username": self.__username,
            "has_guessed": self.__has_guessed,
            "score": self.__score,
        }

        if with_guess:
            player_json["guess"] = (
                self.__guess if not (self.__guess is None) else "No guess"
            )
        return player_json

    def __eq__(self, __o: object) -> bool:
        return type(__o) == Player and self.__username == __o.get_username()
