import IPlayer from "../../interfaces/Player";
import Leaderboard from "../leaderboard";

interface GameResultsProps {
    players: IPlayer[],
    endGameMessage: string
}

export function GameResults({ players, endGameMessage }: GameResultsProps) {

    return (<div className="results">
        <h2>Game Results</h2>
        <h3>
            {endGameMessage}
        </h3>
        <Leaderboard players={players} />
    </div>);
}

