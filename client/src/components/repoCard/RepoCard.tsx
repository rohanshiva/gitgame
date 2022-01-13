import * as Icon from "react-feather";
import { IRepository } from "../../interfaces/Answer";
import "./RepoCard.css";

interface IRepoCard {
  repository: IRepository;
}

function RepoCard({ repository }: IRepoCard) {
  return (
    <div className="repo-card" onClick={() => window.open(repository.url)}>
      <div className="repo-name">
        <Icon.Book className="icon" />
        {repository.name}
      </div>
      <div className="repo-desc">
        {repository.description
          ? repository.description
          : "No description provided"}
      </div>
      <div className="repo-stats">
        <div className="repo-language">{repository.language}</div>
        <div className="repo-stars">
          <Icon.Star className="icon" />
          {repository.starCount}
        </div>
      </div>
    </div>
  );
}

export default RepoCard;
