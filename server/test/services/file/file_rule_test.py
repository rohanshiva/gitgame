from gitgame.services import FileExtensionRule, File
import pytest
from ...util import get_mock_file

supported_extensions = ["py", "txt"]
file_extension_rule = FileExtensionRule(supported_extensions)


@pytest.mark.parametrize(
    argnames="input_path",
    argvalues=[("main.py"), ("./a/b/c/root.txt"), ("./main.test.py"), ("main/input.py")],
)
def test_fileWithSupportedExtension_shouldBeValid(input_path):
    mock_file = get_mock_file(file_path=input_path)
    assert file_extension_rule.is_valid(mock_file) is True


@pytest.mark.parametrize(
    argnames="input_path",
    argvalues=[("./base"), ("./input.js"), ("src/main/input.pyi")],
)
def test_fileWithNonSupportedExtension_shouldBeInvalid(input_path):
    mock_file = get_mock_file(file_path=input_path)
    assert file_extension_rule.is_valid(mock_file) is False
