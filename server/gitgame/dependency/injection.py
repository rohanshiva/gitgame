from config import GITHUB_ACCESS_TOKEN
from github import Github

from gitgame.services import RandomFilePicker, PlayerFilePool, FilePool, Session, FilePicker, FileSource, LazyGithubFileSource, FileRule, FileExtensionRule, ChunkFetcher, WindowChunkFetcher
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
    return FileExtensionRule(extensions)


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
