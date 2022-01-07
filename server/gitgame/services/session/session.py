from gitgame.services.file.file_source import FileSource
from gitgame.services.file.file_pool import FilePool
from gitgame.services.chunk.chunk_fetcher import ChunkFetcher
from gitgame.services.chunk.chunk import Chunk
from gitgame.services.session.player import Player
from gitgame.services.session.prompt import Prompt
from gitgame.services.file.file import File
from typing import List, Callable, Dict
import random
import logging
import asyncio

logger = logging.getLogger()

# this class with constants is used to specify the type of message the server sends to the clients through the websockets
class ServerMessageType:
    LOBBY = "lobby"
    HOST_CHANGE = "host_change"
    OUT_OF_CHUNKS = "out_of_chunks"
    PROMPT = "prompt"
    ANSWER_REVEAL = "answer_reveal"
    PEEK = "peek"


class SessionState:
    NEWLY_CREATED = "newly_created"
    IN_LOBBY = "in_lobby"
    IN_GUESSING = "in_guessing"
    DONE_GUESSING = "done_guessing"
    OUT_OF_CHUNKS = "out_of_chunks"


class ClientEventType:
    START_GAME = "start_game"
    NEXT_ROUND = "next_round"
    GUESS = "guess"


class Session:
    def __init__(
        self,
        id: str,
        file_pool_authors: list[str],
        file_source_factory: Callable[[str], FileSource],
        file_pool: FilePool,
        chunk_fetcher_factory: Callable[[File], ChunkFetcher],
        state: str = SessionState.NEWLY_CREATED,
        peek_period: int = 10,  # time in seconds between each code peek
        guessing_time_limit: int = 30,  # time in seconds to guess
        max_prompt_choices: int = 4,
    ):
        self.__id = id
        self.__file_pool_authors = file_pool_authors
        self.__players: List[Player] = []
        self.__host: Player = None
        self.__file_source_factory = file_source_factory
        self.__file_pool = file_pool
        self.__chunk_fetcher_factory = chunk_fetcher_factory
        self.__state = state
        self.__peek_period = peek_period
        self.__guessing_time_limit = guessing_time_limit
        self.__max_prompt_choices = max_prompt_choices
        self.__chunk_fetcher = None
        self.__prompt = None
        self.__timer_task = None

    def setup(self):
        # add any of the predetermined authors' file sources
        for author in self.__file_pool_authors:
            self.__file_pool.add_author(author, self.__file_source_factory(author))

    async def connect(self, player: Player):
        # first person to join the session becomes the host
        if self.__host is None:
            self.__host = player
            self.__state = SessionState.IN_LOBBY

        self.__players.append(player)
        if player.get_username() not in self.__file_pool_authors:
            self.__file_pool_authors.append(player.get_username())
            self.__file_pool.add_author(
                player.get_username(), self.__file_source_factory(player.get_username())
            )

        await self.__broadcast_lobby()
        if self.__state == SessionState.IN_GUESSING:
            await self.__send(
                player, ServerMessageType.PROMPT, self.__get_prompt_json()
            )
        else:
            if self.__state == SessionState.DONE_GUESSING:
                await self.__send(
                    player,
                    ServerMessageType.ANSWER_REVEAL,
                    self.__get_answer_reveal_json(),
                )

    async def disconnect(self, player: Player):
        self.__players.remove(player)
        # randomly assign another player to be the host
        if player == self.__host:
            self.__host = None
            if len(self.__players) > 0:
                self.__host = random.choice(self.__players)
                await self.__broadcast_host_change()

        if len(self.__players) > 0:
            await self.__broadcast_lobby()

        if self.__state == SessionState.IN_GUESSING:
            if all(list(map(lambda player: player.has_guessed(), self.__players))):
                self.__timer_task.cancel()
                await self.__handle_answer_reveal()

    def can_pick_file(self) -> bool:
        return self.__file_pool.can_pick()

    def can_get_chunk(self) -> bool:
        return (
            not (self.__chunk_fetcher is None) and self.__chunk_fetcher.can_get_chunk()
        )

    def has_player(self, player: Player):
        return player in self.__players

    def pick_file(self):
        self.__prompt = None
        self.__chunk_fetcher = None
        while self.can_pick_file() and (not self.can_get_chunk()):
            file = self.__file_pool.pick()
            try:
                self.__chunk_fetcher = self.__chunk_fetcher_factory(file)
                self.__chunk_fetcher.pick_starting_chunk()
                self.__prompt = Prompt(
                    self.get_chunk(),
                    self.__generate_prompt_choices(file),
                    file.get_user(),
                )
            except Exception as e:
                # keep trying to pick more files to use until we are able to get chunks from a file
                logger.error("Session [%s], Failed to pick starting chunk", self.__id)

        if not self.can_get_chunk():
            logger.info("Session [%s]; no more files to pick chunks from", self.__id)
            self.__state = SessionState.OUT_OF_CHUNKS

    def can_peek_above(self) -> bool:
        return self.can_get_chunk() and self.__chunk_fetcher.can_peek_above()

    def can_peek_below(self) -> bool:
        return self.can_get_chunk() and self.__chunk_fetcher.can_peek_below()

    def peek_above(self):
        self.__chunk_fetcher.peek_above()

    def peek_below(self):
        self.__chunk_fetcher.peek_below()

    def get_chunk(self) -> Chunk:
        return self.__chunk_fetcher.get_chunk()

    def get_authors(self) -> List[str]:
        return self.__file_pool_authors

    async def __send(self, player: Player, message_type: str, message):
        await player.get_websocket().send_json(
            {"message_type": message_type, "message": message}
        )

    async def __broadcast(self, message_type: str, message):
        tasks = []
        for player in self.__players:
            tasks.append(self.__send(player, message_type, message))

        await asyncio.gather(*(tasks))

    async def __broadcast_lobby(self):
        players_json = list(map(lambda player: player.serialize(), self.__players))
        await self.__broadcast(
            ServerMessageType.LOBBY,
            {"players": players_json, "host": self.__host.serialize()},
        )

    async def __broadcast_host_change(self):
        host_json = self.__host.serialize()
        await self.__broadcast(ServerMessageType.HOST_CHANGE, host_json)

    async def __broadcast_out_of_chunks(self):
        await self.__broadcast(
            ServerMessageType.OUT_OF_CHUNKS, "We ran out of chunks for you to guess on."
        )

    async def __broadcast_prompt(self):
        await self.__broadcast(ServerMessageType.PROMPT, self.__get_prompt_json())

    async def __broadcast_answer_reveal(self):
        await self.__broadcast(
            ServerMessageType.ANSWER_REVEAL, self.__get_answer_reveal_json()
        )

    async def __broadcast_peek(self, direction: str):
        await self.__broadcast(ServerMessageType.PEEK, {"direction": direction})

    async def handle_client_event(self, player: Player, data: Dict):
        handlers = {
            ClientEventType.START_GAME: self.__handle_start_game,
            ClientEventType.NEXT_ROUND: self.__handle_next_round,
            ClientEventType.GUESS: self.__handle_guess,
        }

        if not ("event_type" in data):
            logger.error(
                "Session [%s]; recieved data from client without an event type",
                self.__id,
            )
            return

        if not (data["event_type"] in handlers):
            logger.error(
                "Session [%s]; recieved data from client with invalid event type: %s",
                self.__id,
                data["event_type"],
            )
            return

        await handlers[data["event_type"]](player, data)

    async def __handle_start_game(self, player: Player, data: Dict):
        if player == self.__host and self.__state == SessionState.IN_LOBBY:
            self.pick_file()
            if self.__state == SessionState.OUT_OF_CHUNKS:
                await self.__broadcast_out_of_chunks()
            else:
                self.__state = SessionState.IN_GUESSING
                await self.__broadcast_prompt()
                self.__timer_task = asyncio.create_task(self.__guessing_timer())

    async def __handle_next_round(self, player: Player, data: Dict):
        if player == self.__host:
            self.pick_file()
            if self.__state == SessionState.OUT_OF_CHUNKS:
                await self.__broadcast_out_of_chunks()
            else:
                self.__state = SessionState.IN_GUESSING
                for player in self.__players:
                    player.clear_guess()

                if not (self.__timer_task is None) and (
                    not self.__timer_task.cancelled()
                ):
                    self.__timer_task.cancel()

                await self.__broadcast_prompt()
                self.__timer_task = asyncio.create_task(self.__guessing_timer())

    async def __handle_guess(self, player: Player, data: Dict):
        if self.__state == SessionState.IN_GUESSING:
            guess = data["guess"]
            player.set_guess(guess)

            if all(list(map(lambda player: player.has_guessed(), self.__players))):
                self.__timer_task.cancel()
                await self.__handle_answer_reveal()
            else:
                await self.__broadcast_lobby()

    async def __handle_answer_reveal(self):
        for player in self.__players:
            if (
                player.has_guessed()
                and player.get_guess() == self.__prompt.get_correct_choice()
            ):
                player.increment_score()

        self.__state = SessionState.DONE_GUESSING
        await self.__broadcast_answer_reveal()

    def serialize(self):
        return {
            "id": self.__id,
            "players": list(map(lambda player: player.get_username(), self.__players)),
            "authors": self.__file_pool_authors,
            "host": self.__host.get_username()
            if not (self.__host is None)
            else "No host",
            "state": self.__state,
            "prompt": self.__get_prompt_json() if not (self.__prompt is None) else {},
        }

    def can_be_removed(self):
        return self.__state != SessionState.NEWLY_CREATED and len(self.__players) == 0

    def __generate_prompt_choices(self, file: File):
        potential_choices = self.__file_pool_authors[:]
        choices = [file.get_user()]

        potential_choices.remove(file.get_user())
        for _ in range(min(self.__max_prompt_choices - 1, len(potential_choices))):
            choice = random.choice(potential_choices)
            choices.append(choice)
            potential_choices.remove(choice)
        return choices

    def __get_prompt_json(self):
        return self.__prompt.serialize()

    def __get_answer_reveal_json(self):
        players_json = list(
            map(lambda player: player.serialize(with_guess=True), self.__players)
        )
        return {
            "players": players_json,
            "correct_choice": self.__prompt.get_correct_choice(),
        }

    async def __guessing_timer(self):
        elapsed_time = 0
        while elapsed_time < self.__guessing_time_limit:
            await asyncio.sleep(self.__peek_period)

            peek_directions = []
            if self.can_peek_above():
                peek_directions.append("above")
            if self.can_peek_below():
                peek_directions.append("below")

            if len(peek_directions) > 0:
                peek_dir = random.choice(peek_directions)
                if peek_dir == "above":
                    self.peek_above()
                else:
                    self.peek_below()
                await self.__broadcast_peek(peek_dir)
                self.__prompt.set_chunk(self.get_chunk())
                await self.__broadcast_prompt()

            elapsed_time += self.__peek_period

        if self.__state == SessionState.IN_GUESSING:
            await self.__handle_answer_reveal()
