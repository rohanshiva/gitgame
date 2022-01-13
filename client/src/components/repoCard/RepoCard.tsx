import * as Icon from "react-feather";
import config from "../../config";
import { IRepository } from "../../interfaces/Answer";
import "./RepoCard.css";

interface IRepoCard {
  repository: IRepository;
}

const getRepoUri = (repo: string) => config.repoCardUri.replace(":repo", repo);

function RepoCard({ repository }: IRepoCard) {
  return (
    <a href={getRepoUri(repository.name)}>
      <div className="repo-card">
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
    </a>
  );
}

export default RepoCard;
