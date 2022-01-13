import { IRepository } from "../../interfaces/Answer";
import IPlayer from "../../interfaces/Player";
import RepoCard from "../repoCard";
import "./Answer.css";

interface IAnswerProps {
  correctChoice: string;
  players: IPlayer[];
  outOfChunks?: boolean;
  repository: IRepository;
}

function Answer({
  correctChoice,
  players,
  outOfChunks,
  repository,
}: IAnswerProps) {
  return (
    <div className="answer-section">
      <h2>Leaderboard</h2>
      {outOfChunks ? (
        <table>
          <tr>
            <th>#</th>
            <th>Username</th>
            <th>Score</th>
          </tr>
          {players.map((player: IPlayer, i: number) => (
            <tr>
              <th>{i}</th>
              <th>{player.username}</th>
              <th>{player.score}</th>
            </tr>
          ))}
        </table>
      ) : (
        <>
          <RepoCard repository={repository} />
          <h3 className="correct-answer">
            <span className="correct-player">{correctChoice}</span> wrote this
            code{" "}
          </h3>
          <table>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Guess</th>
              <th>Score</th>
            </tr>
            {players.map((player: IPlayer, i: number) => (
              <tr>
                <th>{i + 1}</th>
                <th>{player.username}</th>
                <th>{player.guess}</th>
                <th>{player.score}</th>
              </tr>
            ))}
          </table>
        </>
      )}
    </div>
  );
}

export default Answer;
