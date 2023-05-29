import { useState } from "react";
import { CommentType, AddComment, Lines } from "../../Interface";
import "./CommentCreationMenu.css";

interface CommentCreationMenuProps {
  onSubmit: (comment: AddComment) => void;
  onCancel: () => void;
  lines: Lines;
}

function CommentCreationMenu({
  onCancel,
  onSubmit,
  lines,
}: CommentCreationMenuProps) {
  const [commentMessage, setCommentMessage] = useState<string>("");

  const clear = () => {
    setCommentMessage("");
  };

  const submit = (commentType: CommentType) => {
    if (commentMessage.trim() !== "") {
      onSubmit({
        line_start: lines.start,
        line_end: lines.end,
        type: commentType,
        content: commentMessage,
      });
      clear();
    }
  };

  return (
    <>
      <div className="add-comment-container">
        <div className="add-comment-content">
          <span className="add-comment-header">Let them know!</span>
          <textarea
            placeholder="say something here..."
            onChange={(e) => setCommentMessage(e.target.value)}
            value={commentMessage}
            maxLength={250}
            spellCheck={false}
          />
        </div>

        <div className="add-comments-buttons">
          <span className="add-comment-button" onClick={onCancel}>
            ❌
          </span>
          <span
            className="add-comment-button"
            onClick={() => submit(CommentType.DIAMOND)}
          >
            💎
          </span>
          <span
            className="add-comment-button"
            onClick={() => submit(CommentType.POOP)}
            id="poop-button"
          >
            💩
          </span>
        </div>
      </div>
    </>
  );
}

export default CommentCreationMenu;
