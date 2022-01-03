from github import Github
from typing import List

def validate_authors(github_insatnce: Github, authors: List[str]) -> List[str]:
    res = []
    for author in authors:
        try:
            github_insatnce.get_user(author)
        except Exception:
            res.append(author)
    return res if len(res) > 0 else None