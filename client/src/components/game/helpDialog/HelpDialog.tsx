import { ReactNode } from "react";
import * as Icon from "react-feather";
import config from "../../../config";
import Dialog from "../../dialog/Dialog";
import "./HelpDialog.css";

interface HelpCommentProps {
  children: ReactNode;
}

function HelpComment({ children }: HelpCommentProps) {
  return (
    <div className="help-card">
      <span>
        {children}
      </span>
    </div>
  );
}

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <HelpComment>
        <div className="dialog-header">
          <h2>
            Invite your friends!
          </h2>
          <div className="dialog-close">
            <Icon.X size={16} onClick={onClose} />
          </div>
        </div>
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
          <video preload="auto" muted controls>
            <source src={config.helpVideoUri} type="video/mp4" />
          </video>
        </div>
      </HelpComment>
    </Dialog>
  );
}
