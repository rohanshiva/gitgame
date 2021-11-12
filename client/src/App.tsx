import "./App.css";
import AppRouter from "./routers/Router";
import * as Icon from "react-feather";

function App() {
  return (
    <>
      <nav>
        <div className="logo">
          <Icon.GitPullRequest />
          <h1>{"git_game"}</h1>
        </div>

        <div className="links">
          <a href="https://github.com/rohanshiva/gitgame">
            <Icon.GitHub />
          </a>
        </div>
      </nav>
      <div className="container">
        <AppRouter />
      </div>
    </>
  );
}

export default App;
