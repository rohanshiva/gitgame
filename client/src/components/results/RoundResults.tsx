import Answer from "../../interfaces/Answer";
import GithubService from "../../services/Github";
import Leaderboard from "../leaderboard";
import RepoCard from "../repoCard";
import "./Results.css"


export function RoundResults({ players, repository, correctChoice, chunkUrl }: Answer) {

    const openGithubChunkUrl = () => {
        window.open(chunkUrl);
    }

    const openGithubProfile = () => {
        const profileUrl = GithubService.getProfileUrl(correctChoice);
        window.open(profileUrl);
    }

    return (<div className="results">
        <h2>Round Results</h2>
        <RepoCard repository={repository} />
        <h3>
            <span className="result-highlight" onClick={openGithubProfile}>{correctChoice}</span> wrote this{" "}
            <span className="result-highlight" onClick={openGithubChunkUrl}> code</span>
        </h3>
        <Leaderboard players={players} guessData={{ withGuess: true, correctChoice: correctChoice }} />
    </div>);
}
