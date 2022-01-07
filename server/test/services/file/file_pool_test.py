from gitgame.services import File, ReplenishingFilePool, FileSource, FilePicker
from unittest.mock import Mock
from collections import deque
from typing import List

MAX_SENDABLE_FILES = 5
TOTAL_FILE_COUNT = 10


def get_mock_file_picker():
    file_queue = deque([])
    mock_file_picker = Mock(spec=FilePicker)

    def add_files_side_effect(*args, **kwargs):
        files = args[0]
        for file in files:
            file_queue.append(file)

    mock_file_picker.add_files = Mock(side_effect=add_files_side_effect)
    mock_file_picker.can_pick_file = lambda: len(file_queue) > 0
    mock_file_picker.pick_file = lambda: file_queue.pop()
    return mock_file_picker


def get_mock_file_source(
    file_count=TOTAL_FILE_COUNT, author="Author", max_sendable_files=MAX_SENDABLE_FILES
):
    has_setup = False

    def is_setup() -> bool:
        return has_setup

    def setup(*args, **kwargs):
        nonlocal has_setup
        has_setup = True

    def get_next_files() -> List[File]:
        nonlocal file_count
        files = []
        sendable_file_count = min(file_count, max_sendable_files)
        while sendable_file_count > 0:
            mock_file = Mock(spec=File)
            mock_file.get_user.return_value = author
            files.append(mock_file)
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
    mock_file_picker = get_mock_file_picker()
    mock_file_source = get_mock_file_source(author="ramko9999")
    file_pool = ReplenishingFilePool(mock_file_picker)

    file_pool.add_author("ramko9999", mock_file_source)

    assert file_pool.can_pick() is True
    for _ in range(MAX_SENDABLE_FILES):
        file_pool.pick()

    assert file_pool.can_pick() is True
    for _ in range(MAX_SENDABLE_FILES):
        file_pool.pick()

    assert file_pool.can_pick() is False  # completely ran out of files
    assert mock_file_picker.add_files.call_count == 2
    assert mock_file_source.setup.call_count == 1 # should only setup source only 1 time
