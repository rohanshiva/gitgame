from config import GITHUB_ACCESS_TOKEN
from services.github_client import GithubClient


def get_gh_client():
    return GithubClient(GITHUB_ACCESS_TOKEN)
