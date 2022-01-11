from typing import Callable, List
from unittest.mock import Mock

from gitgame.services import FileRepository, File

default_repo = FileRepository("Repo", "Repo Url", 0, "Lang", "Description")

def default_readlines_callback():
    return []

def get_mock_file(
    readlines_callback: Callable[[], List[str]] = default_readlines_callback,
    file_name="file_name.py",
    file_path="./file_path/file_name.py",
    author="Author",
    repo=default_repo,
    size=100,
) -> Mock:
    mock_file = Mock(spec=File)
    mock_file.readlines = readlines_callback
    mock_file.get_filepath.return_value = file_path
    mock_file.get_filename.return_value = file_name
    mock_file.get_repo.return_value = repo
    mock_file.get_author.return_value = author
    mock_file.get_size.return_value = size
    return mock_file
