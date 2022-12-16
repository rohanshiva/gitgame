import logging
from typing import TypedDict, Optional
from httpx import AsyncClient
from fastapi import status
from pathlib import Path
from datetime import datetime

logger = logging.getLogger()


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


class RateLimitResult(TypedDict):
    limit: int
    used: int
    reset: datetime


class GithubUserNotFound(Exception):
    pass


class GithubRepositoryFileLoadingError(Exception):
    pass


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
                if response.status_code == status.HTTP_404_NOT_FOUND:
                    raise GithubUserNotFound()
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
        max_file_size: int = 1000000,
    ):
        def get_download_url(file_path: str):
            return f"https://raw.githubusercontent.com/{full_repo_name}/{default_branch}/{file_path}"

        endpoint = (
            f"https://api.github.com/repos/{full_repo_name}/git/trees/{default_branch}"
        )

        params = {"recursive": True}
        file_dicts: list[FileDict] = []
        async with AsyncClient() as client:
            response = await client.get(endpoint, headers=self.HEADERS, params=params)
            if response.status_code != status.HTTP_200_OK:
                logger.warn(
                    f"Unable to load files from {full_repo_name}: {response.json()['message']}"
                )
                raise GithubRepositoryFileLoadingError()

            for entity in response.json()["tree"]:
                if entity["type"] == "blob" and entity["size"] <= max_file_size:
                    extension = Path(entity["path"]).suffix[1:]
                    if extension in supported_extensions:
                        file_dicts.append(
                            FileDict(
                                name=Path(entity["path"]).name,
                                path=entity["path"],
                                download_url=get_download_url(entity["path"]),
                            )
                        )
        return file_dicts
