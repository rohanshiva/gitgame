from config import GITHUB_ACCESS_TOKEN
from github import Github

from services.file_fetcher import FileFetcher, GithubFileFetcher
from services.file_rule import FileRule, CodeFileRule
from services.chunk_fetcher import ChunkFetcher, RandomChunkFetcher


def get_github_instance() -> Github:
    return Github(GITHUB_ACCESS_TOKEN)


def get_code_file_rule() -> FileRule:
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


def get_file_fetcher() -> FileFetcher:
    return GithubFileFetcher(get_github_instance(), get_code_file_rule())


def get_chunk_fetcher() -> ChunkFetcher:
    return RandomChunkFetcher()
