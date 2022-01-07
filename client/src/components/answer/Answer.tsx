import config from "../../config";
import "./Answer.css";
function Answer() {
  return (
    <div className="answer-section">
      <h3 className="correct-answer">
        <span className="correct-player">rohanshiva</span> wrote this code{" "}
      </h3>

      <a className="source-tag" href="https://github.com/rohanshiva/gigame">
        <img
          className="repo-card"
          src={`${config.repoCardUri
            .replace(":username", "rohanshiva")
            .replace(":repo", "gitgame")}`}
        />
      </a>
      <h2>Leaderboard</h2>
      <table>
        <tr>
          <th>#</th>
          <th>Username</th>
          <th>Guess</th>
          <th>Score</th>
        </tr>
        <tr>
          <td>1</td>
          <td>rohanshiva</td>
          <td>ramko9999</td>
          <td>5</td>
        </tr>
        <tr>
          <td>1</td>
          <td>rohanshiva</td>
          <td>ramko9999</td>
          <td>5</td>
        </tr>
        <tr>
          <td>1</td>
          <td>rohanshiva</td>
          <td>ramko9999</td>
          <td>5</td>
        </tr>
        <tr>
          <td>1</td>
          <td>rohanshiva</td>
          <td>ramko9999</td>
          <td>5</td>
        </tr>
        <tr>
          <td>1</td>
          <td>rohanshiva</td>
          <td>ramko9999</td>
          <td>5</td>
        </tr>
        <tr>
          <td>1</td>
          <td>rohanshiva</td>
          <td>ramko9999</td>
          <td>5</td>
        </tr>
        <tr>
          <td>1</td>
          <td>rohanshiva</td>
          <td>ramko9999</td>
          <td>5</td>
        </tr>
      </table>
    </div>
  );
}

export default Answer;
