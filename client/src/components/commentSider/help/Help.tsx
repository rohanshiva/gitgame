import { ReactNode } from "react";
import "./Help.css";
import config from "../../../config";

interface HelpCommentProps {
  children: ReactNode;
}

export function HelpComment({ children }: HelpCommentProps) {
  return (
    <div className="help-card">
      <span>
        {children}
      </span>
    </div>
  );
}

function Help() {
  return (
    <HelpComment>
      <strong>
        <code className="title">
          <h2>
          How to create a comment?
          </h2>
        </code></strong>
      <ul className="help-list">
        <li>
          Click on any line number.
        </li>
        <li>
          To select multiple lines, hold{" "}
          <strong>
            <kbd>shift</kbd>
          </strong>{" "}
          and click on any line number below or above.
        </li>
        <li>
          Right click within the highlighted region to trigger
          the comment creation popup.
        </li>
        <li>
          Type your comment in the popover texarea.
        </li>
        <li>
          If you don't like something, submit a 💩 comment.
        </li>
        <li>
          If you like something, submit a 💎 comment.
        </li>
        <li>
          Cancel line selection by clicking on ❌.
        </li>
      </ul>
      <div className="help-video-container">
        <video muted controls>
          <source src={config.helpVideoUri} type="video/mp4" />
        </video>
      </div>
    </HelpComment>
  );
}

export default Help;
