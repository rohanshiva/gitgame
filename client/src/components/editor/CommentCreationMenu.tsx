import { useState } from "react";
import { CommentType, AddComment, Lines } from "../../Interface";
import "./CommentCreationMenu.css";

interface CommentCreationMenuProps {
  open: boolean;
  onSubmit: (comment: AddComment) => void;
  onCancel: () => void;
  lines: Lines;
}

function CommentCreationMenu({
  open,
  onCancel,
  onSubmit,
  lines,
}: CommentCreationMenuProps) {
  const [commentMessage, setCommentMessage] = useState<string>("");

  const onDiamond = () => {
    if (commentMessage.trim() !== "") {
      onSubmit({
        line_start: lines.start,
        line_end: lines.end,
        type: CommentType.DIAMOND,
        content: commentMessage,
      });
    }
  };

  const onPoop = () => {
    if (commentMessage.trim() !== "") {
      onSubmit({
        line_start: lines.start,
        line_end: lines.end,
        type: CommentType.POOP,
        content: commentMessage,
      });
    }
  };

  return (
    <>
      {open && (
        <div className="add-comment-container">
          <span className="add-comment-header">Let them know!</span>
          <textarea
            placeholder="say something here..."
            onChange={(e) => setCommentMessage(e.target.value)}
            value={commentMessage}
            maxLength={250}
            spellCheck={false}
          />
          <div className="add-comments-buttons">
            <span className="add-comment-button" onClick={onCancel}>
              ❌
            </span>
            <span className="add-comment-button" onClick={onDiamond}>
              💎
            </span>
            <span
              className="add-comment-button"
              onClick={onPoop}
              id="poop-button"
            >
              💩
            </span>
          </div>
        </div>
      )}
    </>
  );
}

export default CommentCreationMenu;
