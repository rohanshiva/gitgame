from gitgame.services.session.player import Player
from typing import List


class PlayerManager:
    def __init__(self):
        self.__player_map = {}

    def add_player(self, player: Player):
        self.__player_map[player.get_username()] = player

    def remove_player(self, player: Player):
        del self.__player_map[player.get_username()]

    def get_players(self) -> List[Player]:
        return list(self.__player_map.values())
