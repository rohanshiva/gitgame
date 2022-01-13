from abc import ABC, abstractmethod
from typing import List
from gitgame.services.file.file_rule import FileRule
from gitgame.services.file.file_repository import FileRepository
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
    def is_setup(self) -> bool:
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
        max_loadable_repos: int = 1,
    ):
        self.__github = github
        self.__file_rule = file_rule
        self.__user = user
        self.__max_loadable_repos = max_loadable_repos
        self.__paginated_repos = None
        self.__repo_indicies = None

    def is_setup(self) -> bool:
        return not (self.__paginated_repos is None)

    def setup(self):
        if not self.is_setup():
            named_user = self.__github.get_user(self.__user)
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
        repos_picked_count = 0
        files = []
        while self.can_get_files() and repos_picked_count < self.__max_loadable_repos:
            github_repo = self.__paginated_repos[self.__repo_indicies.pop()]
            if not github_repo.fork:
                file_repo = FileRepository(
                    github_repo.full_name,
                    github_repo.html_url,
                    github_repo.stargazers_count,
                    github_repo.language,
                    github_repo.description,
                )

                logging.info(
                    "User [%s]; considering non-forked repo %s",
                    self.__user,
                    github_repo.full_name,
                )
                try:
                    file_additions = 0
                    git_tree = github_repo.get_git_tree(
                        github_repo.default_branch, recursive=True
                    )
                    for element in git_tree.tree:
                        path, size = element.path, element.size

                        if element.type == self.BLOB:
                            file = NetworkFile(
                                self.__user,
                                path,
                                file_repo,
                                self.__get_file_download_url(github_repo, path),
                                size,
                            )

                            if self.__file_rule.is_valid(file):
                                files.append(file)
                                file_additions += 1

                    if file_additions > 0:
                        repos_picked_count += 1
                    else:
                        logging.warning(
                            "User [%s]; repo %s didn't add any files, choosing another repo to look in",
                            self.__user,
                            github_repo.full_name,
                        )

                except GithubException as e:
                    logging.error(
                        "User [%s]; unable to get tree for repo %s: %s",
                        self.__user,
                        github_repo.full_name,
                        str(e),
                    )
        return files

    def can_get_files(self) -> bool:
        return self.is_setup() and len(self.__repo_indicies) > 0

    def __get_file_download_url(self, github_repo: Repository, file_path: str):
        return f"https://raw.githubusercontent.com/{github_repo.full_name}/{github_repo.default_branch}/{file_path}"
