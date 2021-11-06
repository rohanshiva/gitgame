from pathlib import Path

class File:

    def __str__(self) -> str:
        return f"{self.get_repo()} : {self.get_path()}"

    def get_user(self) -> str:
        pass

    def get_path(self) -> str:
        pass

    def get_filename(self) -> str:
        pass

    def get_repo(self) -> str:
        pass

    def readlines(self):
        pass


class NetworkFile(File):

    def __init__(self, user: str, path: str, repo: str, download_url: str):
        self.__user = user
        self.__path = path
        self.__repo = repo
        self.__download_url = download_url

    def get_user(self) -> str:
        return self.__user
    
    def get_path(self) -> str:
        return self.__path

    def get_filename(self) -> str:
        return Path(self.__path).name
    
    def get_repo(self) -> str:
        return self.__repo
    
    def readlines(self):
        pass 

    

