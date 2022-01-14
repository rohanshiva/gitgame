import { IRepository } from "../../interfaces/Answer";
import IPlayer from "../../interfaces/Player";
import Leaderboard from "../leaderboard";
import RepoCard from "../repoCard";
import "./Results.css"

interface RoundResultsProps {
    players: IPlayer[],
    repository: IRepository
    correctChoice: string
}

export function RoundResults({ players, repository, correctChoice }: RoundResultsProps) {

    return (<div className="results">
        <h2>Round Results</h2> 
        <RepoCard repository={repository} />
        <h3>
            <span className="correct-player">{correctChoice}</span> wrote this
            code{" "}
        </h3>
        <Leaderboard players={players} guessData={{ withGuess: true, correctChoice: correctChoice }} />
    </div>);
}
