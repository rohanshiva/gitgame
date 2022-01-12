from gitgame.services import File, ReplenishingFilePool, FileSource, FilePicker
from unittest.mock import Mock
from collections import deque
from typing import List
from ...util import get_mock_file

MAX_SENDABLE_FILES = 5
TOTAL_FILE_COUNT = 10


def get_mock_file_picker() -> Mock:
    file_queue = deque([])
    mock_file_picker = Mock(spec=FilePicker)

    def add_files(files):
        for file in files:
            file_queue.append(file)

    mock_file_picker.add_files = Mock(side_effect=add_files)
    mock_file_picker.can_pick_file = lambda: len(file_queue) > 0
    mock_file_picker.pick_file = lambda: file_queue.pop()
    return mock_file_picker


def get_mock_file_source(
    file_count=TOTAL_FILE_COUNT, author="Author", max_sendable_files=MAX_SENDABLE_FILES
):
    has_setup = False

    def is_setup() -> bool:
        return has_setup

    def setup():
        nonlocal has_setup
        has_setup = True

    def get_next_files() -> List[File]:
        nonlocal file_count
        files = []
        sendable_file_count = min(file_count, max_sendable_files)
        while sendable_file_count > 0:
            files.append(get_mock_file(author=author))
            sendable_file_count -= 1
            file_count -= 1
        return files

    def can_get_files() -> bool:
        return file_count > 0

    mock_file_source = Mock(spec=FileSource)
    mock_file_source.setup = Mock(side_effect=setup)
    mock_file_source.is_setup = is_setup
    mock_file_source.get_next_files = get_next_files
    mock_file_source.can_get_files = can_get_files
    return mock_file_source


def test_whenFilesRunOut_shouldReplenishFiles():
    author = "Big T"

    mock_file_picker = get_mock_file_picker()
    mock_file_source = get_mock_file_source(author=author)
    file_pool = ReplenishingFilePool(mock_file_picker)

    file_pool.add_author(author, mock_file_source)

    assert file_pool.can_pick() is True
    for _ in range(MAX_SENDABLE_FILES):
        file_pool.pick()

    assert file_pool.can_pick() is True
    for _ in range(MAX_SENDABLE_FILES):
        file_pool.pick()

    # after sending TOTAL_FILE_COUNT # of files, should not be able to pick more files
    assert file_pool.can_pick() is False

    # file pool should refreshed files
    assert mock_file_picker.add_files.call_count == 2
    assert (
        mock_file_source.setup.call_count == 1
    )  # should only setup file source only 1 time
