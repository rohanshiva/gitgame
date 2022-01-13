import * as Icon from "react-feather";
import "./Navbar.css";
function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        <Icon.GitPullRequest />
        <h1 className="title-header">{"git_game"}</h1>
      </div>

      <div className="links">
        <a href="https://github.com/rohanshiva/gitgame">
          <Icon.GitHub />
        </a>
      </div>
    </nav>
  );
}

export default Navbar;
