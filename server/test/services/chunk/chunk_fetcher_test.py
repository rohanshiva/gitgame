from gitgame.services import WindowChunkFetcher, File, Chunk, ChunkFetcher
from unittest.mock import Mock
from typing import Callable, List

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


def get_mock_file(
    readlines_callback: Callable[[], List[str]],
    file_name="sample.py",
    file_path="./sample.py",
    user="User1",
    repo="Repo1",
) -> Mock:
    mock_file = Mock(spec=File)
    mock_file.readlines = readlines_callback
    mock_file.get_path.return_value = file_path
    mock_file.get_filename.return_value = file_name
    mock_file.get_repo.return_value = repo
    mock_file.get_user.return_value = user
    mock_file.get_size.return_value = 100  # dummy size
    return mock_file


def get_chunk_lines(chunk: Chunk) -> List[str]:
    content = chunk.get_content()
    return list(map(lambda code_line: code_line["content"], content["lines"]))


def get_disk_file_lines(file_path: str) -> List[str]:
    file_lines = []
    with open(file_path, "r") as f:
        file_lines = f.readlines()
    return file_lines


def test_fileLinesLessThanStartingChunkSize_entireFileShouldBeChunk():
    def readlines_callback() -> List[str]:
        return ["import os", "\tdir_entries = os.listdir()"]

    mock_file = get_mock_file(readlines_callback)
    chunk_fetcher = chunk_fetcher_factory(mock_file)
    chunk_fetcher.pick_starting_chunk()

    # ensure the whole file is used as the starting chunk
    assert chunk_fetcher.can_get_chunk() is True
    chunk = chunk_fetcher.get_chunk()

    expected_chunk_lines = ["import os", "\tdir_entries = os.listdir()"]
    actual_chunk_lines = get_chunk_lines(chunk)
    assert actual_chunk_lines == expected_chunk_lines


def test_fileLinesLargerThanStartingChunkSize_shouldPickMostSignificantChunk():
    test_file_path = "./test/test-data/index.js"
    test_file_lines = get_disk_file_lines(test_file_path)

    def readlines_callback() -> List[str]:
        return test_file_lines

    mock_file = get_mock_file(
        readlines_callback, file_name="index.js", file_path=test_file_path
    )
    chunk_fetcher = chunk_fetcher_factory(mock_file)
    chunk_fetcher.pick_starting_chunk()

    # ensure the whole file is used as the starting chunk
    assert chunk_fetcher.can_get_chunk() is True
    chunk = chunk_fetcher.get_chunk()

    actual_chunk_lines = get_chunk_lines(chunk)
    expected_chunk_lines = test_file_lines[4 : 4 + STARTING_CHUNK_SIZE]
    assert actual_chunk_lines == expected_chunk_lines


def test_peekOnFile_peekShouldEnlargeChunkBasedOnDirection():
    test_file_path = "./test/test-data/main.py"
    test_file_lines = get_disk_file_lines(test_file_path)

    def readlines_callback() -> List[str]:
        return test_file_lines

    mock_file = get_mock_file(
        readlines_callback, file_name="main.py", file_path=test_file_path
    )
    chunk_fetcher = chunk_fetcher_factory(mock_file)
    chunk_fetcher.pick_starting_chunk()

    assert chunk_fetcher.can_get_chunk() is True

    actual_chunk_lines = get_chunk_lines(chunk_fetcher.get_chunk())
    expected_chunk_lines = test_file_lines[7 : 7 + STARTING_CHUNK_SIZE]

    assert actual_chunk_lines == expected_chunk_lines

    assert chunk_fetcher.can_peek_above() is True
    chunk_fetcher.peek_above()
    actual_chunk_lines = get_chunk_lines(chunk_fetcher.get_chunk())

    # the chunk should now include the above lines of the starting chunk after calling chunk_fetcher.peek_above()
    expected_chunk_lines = test_file_lines[7 - PEEK_SIZE : 7 + STARTING_CHUNK_SIZE]
    assert actual_chunk_lines == expected_chunk_lines

    assert chunk_fetcher.can_peek_below() is True
    chunk_fetcher.peek_below()
    actual_chunk_lines = get_chunk_lines(chunk_fetcher.get_chunk())

    # the chunk should now include the below lines of the starting chunk after calling chunk_fetcher.peek_below()
    expected_chunk_lines = test_file_lines[
        7 - PEEK_SIZE : 7 + STARTING_CHUNK_SIZE + PEEK_SIZE
    ]
    assert actual_chunk_lines == expected_chunk_lines

    assert chunk_fetcher.can_peek_above() is True
    chunk_fetcher.peek_above()

    assert chunk_fetcher.can_peek_below() is True
    chunk_fetcher.peek_below()

    actual_chunk_lines = get_chunk_lines(chunk_fetcher.get_chunk())
    expected_chunk_lines = test_file_lines
    assert actual_chunk_lines == expected_chunk_lines
    
    assert chunk_fetcher.can_peek_above() is False
    assert chunk_fetcher.can_peek_below() is False
