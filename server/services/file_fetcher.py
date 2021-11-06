from github import Github
from services.file import File, NetworkFile
from services.file_rule import FileRule
import itertools
from typing import List

# interface class to fetch code files from users
class FileFetcher:
    def get_files(self, users: List[str]) -> List[File]:
        pass

class GithubFileFetcher(FileFetcher):
    BLOB = "blob"
    TREE = "tree"

    def __init__(self, github : Github, file_rule: FileRule):
        self.__github = github
        self.__file_rule = file_rule

    def get_files(self, users: List[str]) -> List[File]:
        user_files = [self.__get_files(user) for user in users]
        return itertools.chain(*user_files)

    def __get_files(self, user: str) -> List[File]:
        files = []
        repo_count = 0
        for repo in self.__github.get_user(user).get_repos():
            repo_name = repo.full_name
            if not repo.fork:
                if repo_count > 2:
                    break
                git_tree = repo.get_git_tree(repo.default_branch, recursive=True)
                for element in git_tree.tree:
                    path, size = element.path, element.size
                    if element.type == self.BLOB and self.__file_rule.is_valid(path, size):
                        files.append(NetworkFile(
                            user, path, repo_name, 
                                self.__get_file_download_url(repo_name, user, path)
                        ))  
                repo_count += 1
        return files
    
    def __get_file_download_url(self, repo_name : str, user : str, file_path : str):
        return f"https://raw.githubusercontent.com/{user}/{repo_name}/master/{file_path}"
    