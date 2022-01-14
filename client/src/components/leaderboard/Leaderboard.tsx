import IPlayer from "../../interfaces/Player";
import "./Leaderboard.css";

interface LeaderboardProps {
    players: IPlayer[],
    guessData?: {
        withGuess: boolean,
        correctChoice: string
    }
}

function sortByScore(players: IPlayer[]) {
    return players.sort((a, b) => b.score - a.score);
}

function Leaderboard({ players, guessData }: LeaderboardProps) {
    const shouldDisplayGuess = guessData && guessData.withGuess;
    const correctChoice = shouldDisplayGuess ? guessData.correctChoice : null;

    const getHeaders = () => {
        return (<tr>
            <th>#</th>
            <th>Username</th>
            {shouldDisplayGuess && <th>Guess</th>}
            <th>Score</th>
        </tr>);
    }

    const getEntry = (player: IPlayer, entryIndex: number) => {
        const isGuessCorrect = shouldDisplayGuess && correctChoice === player.guess;
        let guessStyleClass = isGuessCorrect ? "correct-choice" : "wrong-choice";

        return (<tr>
            <th>{entryIndex + 1}</th>
            <th>{player.username}</th>
            {shouldDisplayGuess && <th className={guessStyleClass}>{player.guess}</th>}
            <th>{player.score}</th>
        </tr>);
    }

    return (
        <>
            <table>
                {getHeaders()}
                {sortByScore(players).map((player, index) => getEntry(player, index))}
            </table>
        </>
    )
}


export default Leaderboard;