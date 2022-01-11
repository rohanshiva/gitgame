from gitgame.services import (
    WindowChunkFetcher,
    File,
    Chunk,
    ChunkFetcher,
)
from ...util import get_mock_file
from typing import List
import os

STARTING_CHUNK_SIZE = 10
PEEK_SIZE = 5
REMAINING_PEEKS = 4


def chunk_fetcher_factory(file: File) -> ChunkFetcher:
    return WindowChunkFetcher(
        file,
        starting_chunk_size=STARTING_CHUNK_SIZE,
        peek_size=PEEK_SIZE,
        remaining_peeks=REMAINING_PEEKS,
    )


def get_chunk_lines(chunk: Chunk) -> List[str]:
    content = chunk.get_content()
    return list(map(lambda code_line: code_line["content"], content["lines"]))


# file path will be based from ./server/test
def get_disk_file_lines(file_path: str) -> List[str]:
    file_path_from_server = os.path.realpath(
        os.path.join(os.path.dirname(__file__), "..", "..", file_path)
    )
    file_lines = []
    with open(file_path_from_server, "r") as f:
        file_lines = f.readlines()
    return file_lines


def assert_chunk_position(chunk: Chunk, expected_start: int, expected_end: int):
    assert chunk.get_start_line() == expected_start
    assert chunk.get_end_line() == expected_end


def assert_chunk_lines(chunk: Chunk, expected_lines: List[str]):
    actual_lines = get_chunk_lines(chunk)
    assert actual_lines == expected_lines


def test_fileLinesLessThanStartingChunkSize_entireFileShouldBeChunk():

    test_file_lines = ["import os", "\tdir_entries = os.listdir()"]

    def readlines_callback() -> List[str]:
        return test_file_lines

    mock_file = get_mock_file(readlines_callback=readlines_callback)
    chunk_fetcher = chunk_fetcher_factory(mock_file)
    chunk_fetcher.pick_starting_chunk()

    # ensure the whole file is used as the starting chunk
    assert chunk_fetcher.can_get_chunk() is True
    assert_chunk_lines(chunk_fetcher.get_chunk(), test_file_lines[:])


def test_fileLinesLargerThanStartingChunkSize_shouldPickMostSignificantChunk():
    test_file_path = "./test-data/index.js"
    test_file_lines = get_disk_file_lines(test_file_path)

    def readlines_callback() -> List[str]:
        return test_file_lines

    mock_file = get_mock_file(
        readlines_callback=readlines_callback,
        file_name="index.js",
        file_path=test_file_path,
    )
    chunk_fetcher = chunk_fetcher_factory(mock_file)
    chunk_fetcher.pick_starting_chunk()

    # ensure the whole file is used as the starting chunk
    assert chunk_fetcher.can_get_chunk() is True

    chunk_start, chunk_end = 4, 4 + STARTING_CHUNK_SIZE
    assert_chunk_position(chunk_fetcher.get_chunk(), chunk_start, chunk_end)
    assert_chunk_lines(
        chunk_fetcher.get_chunk(), test_file_lines[chunk_start:chunk_end]
    )


def test_peekOnFile_peekShouldEnlargeChunkBasedOnDirection():
    test_file_path = "./test-data/main.py"
    test_file_lines = get_disk_file_lines(test_file_path)

    def readlines_callback() -> List[str]:
        return test_file_lines

    mock_file = get_mock_file(
        readlines_callback=readlines_callback,
        file_name="main.py",
        file_path=test_file_path,
    )
    chunk_fetcher = chunk_fetcher_factory(mock_file)
    chunk_fetcher.pick_starting_chunk()

    assert chunk_fetcher.can_get_chunk() is True

    chunk_start, chunk_end = 7, 7 + STARTING_CHUNK_SIZE
    assert_chunk_position(chunk_fetcher.get_chunk(), chunk_start, chunk_end)
    assert_chunk_lines(
        chunk_fetcher.get_chunk(), test_file_lines[chunk_start:chunk_end]
    )

    # peek above
    assert chunk_fetcher.can_peek_above() is True
    chunk_fetcher.peek_above()
    chunk_start -= PEEK_SIZE

    assert_chunk_position(chunk_fetcher.get_chunk(), chunk_start, chunk_end)
    assert_chunk_lines(
        chunk_fetcher.get_chunk(), test_file_lines[chunk_start:chunk_end]
    )

    # peek below
    assert chunk_fetcher.can_peek_below() is True
    chunk_fetcher.peek_below()
    chunk_end += PEEK_SIZE

    assert_chunk_position(chunk_fetcher.get_chunk(), chunk_start, chunk_end)
    assert_chunk_lines(
        chunk_fetcher.get_chunk(), test_file_lines[chunk_start:chunk_end]
    )

    # no more peekable lines after a peek_above and peek_below
    assert chunk_fetcher.can_peek_above() is True
    chunk_fetcher.peek_above()

    assert chunk_fetcher.can_peek_below() is True
    chunk_fetcher.peek_below()

    assert_chunk_position(chunk_fetcher.get_chunk(), 0, len(test_file_lines))
    assert_chunk_lines(chunk_fetcher.get_chunk(), test_file_lines[:])

    assert chunk_fetcher.can_peek_above() is False
    assert chunk_fetcher.can_peek_below() is False
