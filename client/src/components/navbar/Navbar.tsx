import React, { useContext, useRef } from "react";

import * as Icon from "react-feather";
import ThemeContext, {
  isDark,
  isLight,
  ThemeType,
} from "../../context/ThemeContext";
import "./Navbar.css";
import UserContext from "../../context/UserContext";
import useContextMenu from "../editor/hooks/UseContextMenu";
import FeedbackCreationMenu from "./FeedbackCreationMenu";

const switchTheme = (setTheme: any) => {
  if (document.documentElement.getAttribute("data-theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "light");
    setTheme(ThemeType.LIGHT);
  } else {
    setTheme(ThemeType.DARK);
    document.documentElement.setAttribute("data-theme", "dark");
  }
};
function Navbar() {
  const { user } = useContext(UserContext);
  const { theme, setTheme } = useContext(ThemeContext);

  const { isOpen, anchor, anchorAt, close } = useContextMenu();
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  return (
    <nav className="navbar">
      <div
        className="logo"
        onClick={() => {
          window.open(window.location.origin);
        }}
      >
        <Icon.GitPullRequest />
        <div className="title-header">{"git_game"}</div>
      </div>


      <div className="links">
        <div
          className="context-menu"
          ref={contextMenuRef}
          onClick={(event: React.MouseEvent) => {
            event.stopPropagation();
          }}
          style={{
            top: anchor.y,
            left: anchor.x,
            display: isOpen ? "initial" : "none",
          }}
        >
          <FeedbackCreationMenu onCancel={close} />
        </div>
        {user && (
          <Icon.MessageSquare className="icon" onClick={(event: React.MouseEvent) => {
            event.preventDefault();
            anchorAt(
              { x: event.pageX, y: event.pageY },
              contextMenuRef.current as HTMLElement
            );
          }} />
        )}

        {isDark(theme) && (
          <Icon.Sun onClick={() => switchTheme(setTheme)} className="icon" />
        )}
        {isLight(theme) && (
          <Icon.Moon onClick={() => switchTheme(setTheme)} className="icon" />
        )}

        <a href="https://github.com/rohanshiva/gitgame">
          <Icon.GitHub />
        </a>
      </div>
    </nav>
  );
}

export default Navbar;
