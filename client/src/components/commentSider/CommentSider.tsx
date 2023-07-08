import { useContext } from "react";
import {
  Comment as IComment,
  commentTypeToEmoji,
} from "../../Interface";
import "./CommentSider.css";
import { getColor } from "../../utils";
import CommentHighlightContext from "../../context/CommentHighlightContext";

interface CommentProps {
  comment: IComment;
}

function Comment({ comment }: CommentProps) {
  const { id, author, content, type, line_start: lineStart, line_end: lineEnd } = comment;
  const { commentHighlight, highlightComment } = useContext(
    CommentHighlightContext
  );
  const profileBorderColor = getColor(author.username);

  const className = `player-comment ${(commentHighlight && commentHighlight.comment.id === id) && "player-comment-selected"}`

  const onCommentClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!(commentHighlight && commentHighlight.comment.id === id)) {
      highlightComment({ comment });
    }
  };

  return (
    <div className={className} onClick={onCommentClick}>
      <div className="player-comment-header">
        <div className="player-comment-author">
          <img
            alt={`https://github.com/${author.username}`}
            className="player-comment-avatar"
            style={{ borderColor: profileBorderColor }}
            src={author.profile_url}
          />
          <div>{author.username}</div>
        </div>
        <div className="player-comment-info">
          <div className="player-comment-line-tag">
            {`L${lineStart}-L${lineEnd}`}
          </div>
          <div className="player-comment-emoji-tag">
            {commentTypeToEmoji(type)}
          </div>
        </div>

      </div>
      <div className="player-comment-content">{content}</div>
    </div>
  );
}

interface CommentListProps {
  comments: IComment[];
}

function CommentList({ comments }: CommentListProps) {

  return (
    <div className="comments-container-content">
      <div className="comments-section">
        <div className="comments-section-content">
          {comments.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CommentSiderProps {
  comments: IComment[];
}

function CommentSider({ comments }: CommentSiderProps) {
  const { dehighlight } = useContext(CommentHighlightContext);

  const getCommentsDisplay = () => {
    if (comments.length) {
      return <CommentList comments={comments} />;
    } else {
      return (
        <div>
          No comments yet! Click <kbd>Help</kbd> for instructions.
        </div>
      );
    }
  };

  return (
    <div className="comments-container" onClick={dehighlight}>
      <div
        className="comments-container-header"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="comments-container-header-title">
          <span>
            Kudos 💎 / Roasts 💩
          </span>
        </div>
      </div>
      {getCommentsDisplay()}
    </div>
  );
}

export default CommentSider;
