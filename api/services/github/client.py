import logging
from typing import TypedDict, Optional
from httpx import AsyncClient
from fastapi import status
from pathlib import Path
from datetime import datetime

LOGGER = logging.getLogger()


class RepositoryDict(TypedDict):
    name: str
    pushed_at: str
    url: str
    stars: int
    default_branch: str
    description: Optional[str]
    language: Optional[str]


class FileDict(TypedDict):
    name: str
    path: str
    download_url: str
    visit_url: str


class RateLimitResult(TypedDict):
    limit: int
    used: int
    reset: datetime


class UserDict(TypedDict):
    username: str
    name: str
    node_id: str


class GithubApiException(Exception):
    def __init__(self, gh_endpoint: str, status_code: int, text: str):
        self.gh_endpoint = gh_endpoint
        self.status_code = status_code
        self.text = text

    def __str__(self):
        return f"Github API request to '{self.gh_endpoint}' resulted in '{self.status_code}': '{self.text}'"


MAX_FILE_SIZE = 15000  # 15kb


class GithubClient:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.HEADERS = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        }

    async def get_rate_limit(self):
        endpoint = "https://api.github.com/rate_limit"
        async with AsyncClient() as client:
            response = await client.get(endpoint, headers=self.HEADERS)
            core = response.json()["resources"]["core"]
            return RateLimitResult(
                limit=core["limit"],
                used=core["used"],
                reset=datetime.fromtimestamp(core["reset"]),
            )

    async def get_non_forked_repos(
        self, username: str, min_repos: int = 100, page: int = 1
    ):
        endpoint = f"https://api.github.com/users/{username}/repos"
        repo_dicts: list[RepositoryDict] = []
        can_get_next_page = True
        async with AsyncClient() as client:
            while len(repo_dicts) < min_repos and can_get_next_page:
                params = {
                    "type": "owner",
                    "sort": "pushed",
                    "direction": "asc",
                    "per_page": min(min_repos, 100),
                    "page": page,
                }
                response = await client.get(
                    endpoint, params=params, headers=self.HEADERS
                )
                if response.status_code != status.HTTP_200_OK:
                    raise GithubApiException(
                        response.request.url, response.status_code, response.text
                    )
                for repo in response.json():
                    if not repo["fork"] and repo["size"] > 0:
                        repo_dicts.append(
                            RepositoryDict(
                                name=repo["full_name"],
                                pushed_at=repo["pushed_at"],
                                url=repo["html_url"],
                                stars=repo["stargazers_count"],
                                default_branch=repo["default_branch"],
                                description=repo["description"],
                                language=repo["language"],
                            )
                        )

                can_get_next_page = ("link" in response.headers) and (
                    'rel="next"' in response.headers["link"]
                )
                page += 1

        next_page = None
        if can_get_next_page:
            next_page = page
        return repo_dicts, next_page

    async def get_files_for_repo(
        self,
        full_repo_name: str,
        default_branch: str,
        supported_extensions: set[str],
        max_file_size: int = MAX_FILE_SIZE,
    ):
        def get_download_url(file_path: str):
            return f"https://raw.githubusercontent.com/{full_repo_name}/{default_branch}/{file_path}"

        def get_visit_url(file_path: str):
            return (
                f"https://github.com/{full_repo_name}/blob/{default_branch}/{file_path}"
            )

        endpoint = (
            f"https://api.github.com/repos/{full_repo_name}/git/trees/{default_branch}"
        )

        params = {"recursive": True}
        file_dicts: list[FileDict] = []
        async with AsyncClient() as client:
            response = await client.get(endpoint, headers=self.HEADERS, params=params)
            if response.status_code != status.HTTP_200_OK:
                raise GithubApiException(response.request.url, response.status_code, response.text)

            for entity in response.json()["tree"]:
                if entity["type"] == "blob" and entity["size"] <= max_file_size:
                    extension = Path(entity["path"]).suffix[1:]
                    if extension in supported_extensions:
                        file_dicts.append(
                            FileDict(
                                name=Path(entity["path"]).name,
                                path=entity["path"],
                                download_url=get_download_url(entity["path"]),
                                visit_url=get_visit_url(entity["path"]),
                            )
                        )
        return file_dicts

    async def download_file_from_url(self, gh_download_url: str):
        async with AsyncClient() as client:
            response = await client.get(gh_download_url)
            if response.status_code != status.HTTP_200_OK:
                raise GithubApiException(
                    response.request.url, response.status_code, response.text
                )
            return response.text

    async def create_issue(self, title: str, body: str, labels: list[str]):
        endpoint = "https://api.github.com/repos/rohanshiva/gitgame/issues"
        payload = {"title": title, "body": body, "labels": labels}
        async with AsyncClient() as client:
            response = await client.post(endpoint, json=payload, headers=self.HEADERS)
            if response.status_code != status.HTTP_201_CREATED:
                raise GithubApiException(response.request.url, response.status_code, response.text)

    async def get_user(self):
        endpoint = "https://api.github.com/user"
        async with AsyncClient() as client:
            response = await client.get(endpoint, headers=self.HEADERS)
            if response.status_code != status.HTTP_200_OK:
                raise GithubApiException(response.request.url, response.status_code, response.text)
            user = response.json()
            return UserDict(
                username=user["login"], name=user["name"], node_id=user["node_id"]
            )
