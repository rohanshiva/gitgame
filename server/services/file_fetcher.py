from github import Github
from github.Repository import Repository
from services.file import File, NetworkFile
from services.file_rule import FileRule
from typing import List
import itertools
import random
import logging


logger = logging.getLogger()

# interface class to fetch code files from users
class FileFetcher:
    def get_files(self, users: List[str]) -> List[File]:
        pass


class GithubFileFetcher(FileFetcher):
    BLOB = "blob"
    TREE = "tree"

    def __init__(self, github: Github, file_rule: FileRule, max_repos_per_user=1):
        self.__github = github
        self.__file_rule = file_rule
        self.__max_repos_per_user = max_repos_per_user

    def get_files(self, users: List[str]) -> List[File]:
        logging.info("Trying to get files for [%s]", ",".join(users))
        user_files = [self.__get_files(user) for user in users]
        return list(itertools.chain(*user_files))

    def __get_files(self, user: str) -> List[File]:
        files = []
        named_user = self.__github.get_user(user)

        # randomly sample repositories to pick code chunks from for a user
        shuffled_repo_indicies = [i for i in range(named_user.public_repos)]
        logging.info(
            "User [%s]; shuffling public repos among %d", user, named_user.public_repos
        )
        random.shuffle(shuffled_repo_indicies)

        picked_count = 0
        repos = named_user.get_repos()

        for repo_index in shuffled_repo_indicies:
            if picked_count >= self.__max_repos_per_user:
                break
            repo: Repository = repos[repo_index]

            # only consider non-forked repositories
            if not repo.fork:
                logger.info(
                    "User [%s]; considering non-forked repo %s", user, repo.full_name
                )
                file_additions = 0
                git_tree = repo.get_git_tree(repo.default_branch, recursive=True)
                for element in git_tree.tree:
                    path, size = element.path, element.size

                    if element.type == self.BLOB:
                        file = NetworkFile(
                            user,
                            path,
                            repo.full_name,
                            self.__get_file_download_url(repo, path),
                            size,
                        )

                        if self.__file_rule.is_valid(file):
                            files.append(file)
                            file_additions += 1

                if file_additions > 0:
                    picked_count += 1
                else:
                    logger.warn(
                        "User [%s]; repo %s didn't add any files, choosing another repo to look in",
                        user,
                        repo.full_name,
                    )

        return files

    def __get_file_download_url(self, repo: Repository, file_path: str):
        return f"https://raw.githubusercontent.com/{repo.full_name}/{repo.default_branch}/{file_path}"
