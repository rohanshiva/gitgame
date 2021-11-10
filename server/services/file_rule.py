import pathlib
from services.file import File
from typing import List

class FileRule:
    def is_valid(self, file:File) -> bool:
        pass

# only consider files which have supported_extensions
class CodeFileRule(FileRule):

    def __init__(self, supported_extensions: List[str]):
        self.__supported_extensions = set(supported_extensions)

    def is_valid(self, file:File) -> bool:
        extension = self.__get_extension(file.get_path())
        return len(extension) > 0 and extension in self.__supported_extensions

    def __get_extension(self, path: str) -> str:
        return pathlib.Path(path).suffix[1:]