from config import GITHUB_ACCESS_TOKEN
from github import Github
from services.file.file_picker import RandomFilePicker
from services.file.file_pool import FilePool, PlayerFilePool
from services.session import Session
from services.file.file_picker import FilePicker
from services.file.file_source import FileSource, LazyGithubFileSource
from services.file.file_rule import FileRule, CodeFileRule
from services.chunk.chunk_fetcher import ChunkFetcher, WindowChunkFetcher
from typing import List


def get_github_instance() -> Github:
    return Github(GITHUB_ACCESS_TOKEN)


def get_file_rule() -> FileRule:
    extensions = [
        "py",
        "js",
        "ts",
        "jsx",
        "tsx",
        "go",
        "dart",
        "java",
        "cc",
        "cpp",
        "c",
    ]
    return CodeFileRule(extensions)


def get_file_picker() -> FilePicker:
    return RandomFilePicker()


def get_chunk_fetcher() -> ChunkFetcher:
    return WindowChunkFetcher()


def get_file_pool() -> FilePool:
    return PlayerFilePool(get_file_picker())


def get_file_source_factory(player: str) -> FileSource:
    return LazyGithubFileSource(get_github_instance(), get_file_rule(), player)


def get_session_factory(id: str, players: List[str]) -> Session:
    return Session(
        id, players, get_file_source_factory, get_file_pool(), get_chunk_fetcher()
    )
