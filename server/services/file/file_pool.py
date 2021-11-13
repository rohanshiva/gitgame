from collections import defaultdict
from services.file.file_picker import FilePicker
from services.file.file_source import FileSource
from services.file.file import File
from typing import Dict
from abc import ABC, abstractmethod
import logging


class FilePool(ABC):
    @abstractmethod
    def can_pick(self) -> bool:
        pass

    @abstractmethod
    def add_player(self, player: str, file_source: FileSource):
        pass

    @abstractmethod
    def pick(self) -> File:
        pass


class PlayerFilePool(FilePool):
    def __init__(self, file_picker: FilePicker):
        self.file_picker = file_picker
        self.player_file_counter = defaultdict(int)
        self.player_file_source: Dict[str, FileSource] = {}

    def can_pick(self) -> bool:
        return self.file_picker.can_pick_file()

    def add_player(self, player: str, file_source: FileSource):
        file_source.setup()
        if file_source.can_get_files():
            fetched_files = file_source.get_next_files()
            self.file_picker.add_files(fetched_files)
            self.player_file_counter[player] = len(fetched_files)
            self.player_file_source[player] = file_source
        else:
            logging.error(
                "Player [%s]; unable to retrieve any files upon initial addition",
                player,
            )

    def pick(self) -> File:
        if self.can_pick():
            picked_file = self.file_picker.pick_file()
            player = picked_file.get_user()
            self.player_file_counter[player] -= 1
            if self.player_file_counter[player] == 0:
                logging.info(
                    "Player [%s] Repo [%s]; player has exhausted files from pool, trying to fetch some more",
                    player,
                    picked_file.get_repo(),
                )

                if self.player_file_source[player].can_get_files():
                    fetched_files = self.player_file_source[player].get_next_files()
                    self.file_picker.add_files(fetched_files)
                    self.player_file_counter[player] += len(fetched_files)
                    logging.info("Player [%s]; fetched more files for player", player)
                else:
                    logging.info(
                        "Player [%s]; no more files can be fetched for this player"
                    )
            return picked_file
        return None
