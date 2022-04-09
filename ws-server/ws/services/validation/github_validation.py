from github import Github
from typing import List


def get_invalid_authors(github_instance: Github, authors: List[str]) -> List[str]:
    invalid_authors = []
    for author in authors:
        try:
            github_instance.get_user(author)
        except Exception:
            invalid_authors.append(author)
    return invalid_authors
