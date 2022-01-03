from config import GITHUB_ACCESS_TOKEN
from github import Github

from gitgame.services import (
    File,
    RandomFilePicker,
    PlayerFilePool,
    FilePool,
    Session,
    FilePicker,
    FileSource,
    LazyGithubFileSource,
    FileRule,
    FileExtensionRule,
    ChunkFetcher,
    WindowChunkFetcher,
)
from typing import List


def get_github_instance() -> Github:
    return Github(GITHUB_ACCESS_TOKEN)


def validate_authors(authors: List[str]) -> List[str]:
    res = []
    for author in authors:
        try:
            get_github_instance().get_user(author)
        except Exception:
            res.append(author)
    return res if len(res) > 0 else None


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
        "swift",
    ]
    return FileExtensionRule(extensions)


def get_file_picker() -> FilePicker:
    return RandomFilePicker()


def get_file_pool() -> FilePool:
    return PlayerFilePool(get_file_picker())


def chunk_fetcher_factory(file: File) -> ChunkFetcher:
    return WindowChunkFetcher(file)


def file_source_factory(player: str) -> FileSource:
    return LazyGithubFileSource(get_github_instance(), get_file_rule(), player)


def session_factory(id: str, authors: List[str]) -> Session:
    return Session(
        id, authors, file_source_factory, get_file_pool(), chunk_fetcher_factory
    )
