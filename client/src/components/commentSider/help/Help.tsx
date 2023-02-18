import { ReactNode } from "react";
import * as Icon from "react-feather";
import "./Help.css";

interface HelpCommentProps {
  children: ReactNode;
}

export function HelpComment({ children }: HelpCommentProps) {
  return (
    <div className="help-card">
      <div>
        <Icon.Info size={"1rem"} />
      </div>
      {children}
    </div>
  );
}

function Help() {
  return (
    <HelpComment>
      <div className="help-card-content" style={{ gap: "0.5rem" }}>
        <div>
          <strong>How to create a comment?</strong>
        </div>
        <div>Click on any line number.</div>
        <div>
          To select multiple lines, hold{" "}
          <strong>
            <kbd>shift</kbd>
          </strong>{" "}
          and click on any line number below or above.
        </div>
        <div>
          Right click within the highlighted region to trigger
          the comment creation popup.
        </div>
        <div>Type your comment in the popover texarea.</div>
        <div>If you don't like something, submit a 💩 comment.</div>
        <div>If you like something, submit a 💎 comment.</div>
        <div>Cancel line selection by clicking on ❌.</div>
      </div>
    </HelpComment>
  );
}

export default Help;
