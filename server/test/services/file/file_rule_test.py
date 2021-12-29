from gitgame.services import FileExtensionRule, File
import pytest
from unittest.mock import Mock

supported_extensions = ["py", "txt"]
file_extension_rule = FileExtensionRule(supported_extensions)
    
@pytest.mark.parametrize(argnames="input_path, expected", argvalues=[("main.py", True), ("./a/b/c/root.txt", True), ("./main.test.py", True)]) 
def test_fileWithSupportedExtensions_shouldBeValid(input_path, expected):
    mock_file = Mock(spec=File)
    mock_file.get_path.return_value = input_path
    assert file_extension_rule.is_valid(mock_file) is expected

