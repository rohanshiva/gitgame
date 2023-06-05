import { useState } from "react";
import { CommentType, AddComment, Lines } from "../../Interface";

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
      <div className="context-menu-container">
        <div className="context-menu-content">
          <span className="context-menu-header">Let them know!</span>
          <textarea
            placeholder="say something here..."
            onChange={(e) => setCommentMessage(e.target.value)}
            value={commentMessage}
            maxLength={250}
            spellCheck={false}
          />
        </div>

        <div className="context-menu-buttons">
          <span className="context-menu-button" onClick={onCancel}>
            ❌
          </span>
          <span
            className="context-menu-button"
            onClick={() => submit(CommentType.DIAMOND)}
          >
            💎
          </span>
          <span
            className="context-menu-button"
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
