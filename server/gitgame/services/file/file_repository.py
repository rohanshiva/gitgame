class FileRepository:
    def __init__(
        self,
        name: str,
        url: str,
        star_count: int,
        language: str,
        description: str,
        default_branch: str,
    ):
        self.__name = name
        self.__url = url
        self.__star_count = star_count
        self.__language = language
        self.__description = description
        self.__default_branch = default_branch

    def get_name(self) -> str:
        return self.__name

    def get_url(self) -> str:
        return self.__url

    def get_star_count(self) -> int:
        return self.__star_count

    def get_language(self) -> str:
        return self.__language

    def get_description(self) -> str:
        return self.__description

    def get_default_branch(self) -> str:
        return self.__default_branch
