import React, { useContext } from "react";
import * as Icon from "react-feather";
import ThemeContext, { isDark, isLight } from "../../context/ThemeContext";
import "./Navbar.css";

const switchTheme = (setTheme: any) => {
  if (document.documentElement.getAttribute("data-theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "light");
    setTheme("light");
  } else {
    setTheme("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  }
};
function Navbar() {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <nav className="navbar">
      <div className="logo">
        <Icon.GitPullRequest />
        <h1 className="title-header">{"git_game"}</h1>
      </div>

      <div className="links">
        {isDark(theme) && <Icon.Sun onClick={() => switchTheme(setTheme)}  className="icon"/>}
        {isLight(theme) && <Icon.Moon onClick={() => switchTheme(setTheme)} className="icon"/>}

        <a href="https://github.com/rohanshiva/gitgame">
          <Icon.GitHub />
        </a>
      </div>
    </nav>
  );
}

export default Navbar;
