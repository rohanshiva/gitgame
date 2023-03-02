import { useContext, useState } from "react";
import {
  Comment as IComment,
  CommentType,
  commentTypeToEmoji,
} from "../../Interface";
import "./CommentSider.css";
import "./help/Help.css";
import Help from "./help/Help";
import { HelpComment } from "./help/Help";
import { getColor } from "../../utils";
import CommentHighlightContext from "../../context/CommentHighlightContext";

interface CommentProps {
  comment: IComment;
}

function Comment({ comment }: CommentProps) {
  const { id, author, content } = comment;
  const { commentHighlight, highlightComment } = useContext(
    CommentHighlightContext
  );
  const profileBorderColor = getColor(author.username);

  let className = "player-comment";
  if (commentHighlight && commentHighlight.comment.id === id) {
    className += " player-comment-selected";
  }

  const onCommentClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!(commentHighlight && commentHighlight.comment.id === id)) {
      highlightComment({ comment });
    }
  };

  return (
    <div className={className} onClick={onCommentClick}>
      <div className="player-comment-header">
        <img
          alt={`https://github.com/${author.username}`}
          className="player-comment-avatar"
          style={{ borderColor: profileBorderColor }}
          src={author.profile_url}
        />
        <div>{author.username}</div>
      </div>
      <div className="player-comment-content">{content}</div>
    </div>
  );
}

interface CommentListProps {
  comments: IComment[];
  commentType: CommentType;
}

function CommentList({ comments, commentType }: CommentListProps) {
  const groupCommentsByLines = () => {
    const map = new Map<string, IComment[]>();
    for (const comment of comments) {
      const { line_start, line_end } = comment;
      const key = `${line_start}-${line_end}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.set(key, (map.get(key) as IComment[]).concat(comment));
    }

    const groupedComments = Array.from(map.values()).map((comments) => {
      const uniqueAuthors = Array.from(
        new Set(comments.map(({ author }) => author.username))
      );
      uniqueAuthors.sort();

      return {
        comments,
        lines: {
          start: comments[0].line_start,
          end: comments[0].line_end,
        },
        authors: uniqueAuthors,
      };
    });

    groupedComments.sort((a, b) => {
      if (a.lines.start < b.lines.start) {
        return -1;
      }
      if (b.lines.start < a.lines.start) {
        return 1;
      }
      if (a.lines.end < b.lines.end) {
        return -1;
      }
      return 1;
    });

    return groupedComments;
  };

  return (
    <div className="comments-container-content">
      {groupCommentsByLines().map(({ lines, comments, authors }, index) => {
        return (
          <div className="comments-section" key={index}>
            <div className="comments-section-header">
              <code>{`L${lines.start + 1}-L${lines.end + 1}`}</code>
              <abbr title={authors.join(", ")}>
                <span className="emoji-reactions">
                  {commentTypeToEmoji(commentType)} {comments.length}
                </span>
              </abbr>
            </div>
            <div className="comments-section-content">
              {comments.map((comment) => (
                <Comment key={comment.id} comment={comment} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface CommentSiderProps {
  comments: IComment[];
}

function CommentSider({ comments }: CommentSiderProps) {
  const [filter, setFilter] = useState<CommentType>(CommentType.POOP);
  const [isHelpSelected, setIsHelpSelected] = useState<boolean>(false);
  const { dehighlight } = useContext(CommentHighlightContext);

  const getCommentsDisplay = () => {
    if (isHelpSelected) {
      return <Help />;
    }
    if (hasCommentsForType(filter)) {
      const filteredComments = comments.filter(({ type }) => type === filter);
      return <CommentList comments={filteredComments} commentType={filter} />;
    } else {
      return (
        <HelpComment>
          <div className="help-card-content">
            No {commentTypeToEmoji(filter)} comments yet!
            <div>Click on ℹ for instructions to add a new comment.</div>
          </div>
        </HelpComment>
      );
    }
  };
  const hasCommentsForType = (commentType: CommentType) => {
    return comments.filter(({ type }) => type === commentType).length > 0;
  };

  return (
    <div className="comments-container" onClick={dehighlight}>
      <div
        className="comments-container-header"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="filters">
          <div
            className={
              filter === CommentType.POOP && !isHelpSelected
                ? "filter selected-filter"
                : "filter"
            }
            onClick={() => {
              setFilter(CommentType.POOP);
              setIsHelpSelected(false);
            }}
          >
            💩
          </div>
          <div
            className={
              filter === CommentType.DIAMOND && !isHelpSelected
                ? "filter selected-filter"
                : "filter"
            }
            onClick={() => {
              setFilter(CommentType.DIAMOND);
              setIsHelpSelected(false);
            }}
          >
            💎
          </div>
          <div
            className={isHelpSelected ? "filter selected-filter" : "filter"}
            onClick={() => setIsHelpSelected(true)}
          >
            ℹ
          </div>
        </div>
      </div>
      {getCommentsDisplay()}
    </div>
  );
}

export default CommentSider;
