import { ReactNode } from "react";
import * as Icon from "react-feather";
import "./Help.css";

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
        How to create a comment?
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
    </HelpComment>
  );
}

export default Help;
