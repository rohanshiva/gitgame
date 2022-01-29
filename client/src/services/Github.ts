class GithubService{

    static getProfileUrl(username: string) : string{
        return `https://github.com/${username}`;
    }
}

export default GithubService