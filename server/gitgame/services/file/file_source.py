from abc import ABC, abstractmethod
from typing import List
from gitgame.services.file.file_rule import FileRule
from gitgame.services.file.file import File
from gitgame.services.file.file import File, NetworkFile
from github import Github, GithubException, Repository
import random
import logging


class FileSource(ABC):

    @abstractmethod
    def setup(self):
        pass

    @abstractmethod
    def get_next_files(self) -> List[File]:
        pass

    @abstractmethod
    def can_get_files(self) -> bool:
        pass


class LazyGithubFileSource(FileSource):
    BLOB = "blob"
    TREE = "tree"

    def __init__(
        self,
        github: Github,
        file_rule: FileRule,
        user: str,
        repo_indicies: List[int] = [],
        max_loadable_repos: int = 1,
    ):
        self.__github = github
        self.__file_rule = file_rule
        self.__user = user
        self.__repo_indicies = repo_indicies[:]
        self.__max_loadable_repos = max_loadable_repos
        self.__paginated_repos = None
    
    def setup(self):
        if not self.__paginated_repos:
            named_user = self.__github.get_user(self.__user)
            if not self.__repo_indicies:
                # randomly sample repositories to pick code chunks from for a user
                self.__repo_indicies = [i for i in range(named_user.public_repos)]
                logging.info(
                    "User [%s]; randomly shuffling %d public repos",
                    self.__user,
                    named_user.public_repos,
                )
                random.shuffle(self.__repo_indicies)
            self.__paginated_repos = named_user.get_repos()

    def get_next_files(self) -> List[File]:
        repos_picked = 0
        files = []
        while self.can_get_files() and repos_picked < self.__max_loadable_repos:
            repo = self.__paginated_repos[self.__repo_indicies.pop()]
            if not repo.fork:
                logging.info(
                    "User [%s]; considering non-forked repo %s",
                    self.__user,
                    repo.full_name,
                )
                try:
                    file_additions = 0
                    git_tree = repo.get_git_tree(repo.default_branch, recursive=True)
                    for element in git_tree.tree:
                        path, size = element.path, element.size

                        if element.type == self.BLOB:
                            file = NetworkFile(
                                self.__user,
                                path,
                                repo.full_name,
                                self.__get_file_download_url(repo, path),
                                size,
                            )

                            if self.__file_rule.is_valid(file):
                                files.append(file)
                                file_additions += 1

                    if file_additions > 0:
                        repos_picked += 1
                    else:
                        logging.warn(
                            "User [%s]; repo %s didn't add any files, choosing another repo to look in",
                            self.__user,
                            repo.full_name,
                        )

                except GithubException as e:
                    logging.error(
                        "User [%s]; unable to get tree for repo %s: %s",
                        self.__user,
                        repo.full_name,
                        str(e),
                    )
        return files

    def can_get_files(self) -> bool:
        return not (self.__paginated_repos is None) and len(self.__repo_indicies) > 0

    def __get_file_download_url(self, repo: Repository, file_path: str):
        return f"https://raw.githubusercontent.com/{repo.full_name}/{repo.default_branch}/{file_path}"
