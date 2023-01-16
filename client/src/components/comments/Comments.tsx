import { useState } from "react";
import config from "../../config";
import {
    Comment,
    CommentType,
    commentTypeToEmoji,
    Lines,
} from "../../interfaces/Comment";
import "./Comments.css";
import * as Icon from "react-feather";

interface ICommentsProps {
    comments: Comment[];
    setFocusLines: React.Dispatch<React.SetStateAction<Lines | undefined>>,
}

function Comments({ comments, setFocusLines }: ICommentsProps) {
    const [filter, setFilter] = useState<CommentType>(CommentType.POOP);

    const getEncodedCommentLines = (comment: Comment) => {
        return `L${comment.lines.start}-L${comment.lines.end}`;
    };

    const getDecodedCommentLines = (encodedCommentLines: string) => {
        const lines = {
            start: Number(encodedCommentLines.split("-")[0].split("L")[1]),
            end: Number(encodedCommentLines.split("-")[1].split("L")[1]),
        } as Lines;

        return lines;
    };

    const filteredComments = () => {
        const commentsByType = comments.filter(
            (comment) => comment.commentType === filter
        );

        let groupedComments = new Map<string, Comment[]>();
        for (const comment of commentsByType) {
            const key = getEncodedCommentLines(comment);
            const commentsByKey = groupedComments.get(key);
            if (commentsByKey === undefined) {
                groupedComments.set(key, [comment]);
            } else {
                groupedComments.set(key, commentsByKey.concat(comment));
            }
        }

        const filteredComments = Array.from(
            groupedComments,
            ([lines, comments]) => ({
                lines: lines,
                comments: comments,
            })
        );

        filteredComments.sort((a, b) => {
            const aLines = getDecodedCommentLines(a.lines);
            const bLines = getDecodedCommentLines(b.lines);
            if (aLines.start < bLines.start) {
                return -1;
            } else if (aLines.start > bLines.start) {
                return 1;
            } else {
                if (aLines.end < bLines.end) {
                    return -1;
                } else if (aLines.end > bLines.end) {
                    return 1;
                } else {
                    return 0;
                }
            }
        });

        return filteredComments;
    };

    const getPlayersOfComments: (comments: Comment[]) => string[] = (
        comments: Comment[]
    ) => {
        let players = [];
        for (const comment of comments) {
            if (comment.player !== undefined) {
                players.push(comment.player);
            }
        }
        return players;
    };

    const onFocus = (lines: string) => {
        setFocusLines(getDecodedCommentLines(lines))
    }

    return (
        <div className="comments-container">
            <div className="comments-container-header">
                <div className="filters">
                    <div
                        className={
                            filter === CommentType.POOP ? "filter selected-filter" : "filter"
                        }
                        onClick={() => setFilter(CommentType.POOP)}
                    >
                        💩
                    </div>
                    <div
                        className={
                            filter === CommentType.DIAMOND
                                ? "filter selected-filter"
                                : "filter"
                        }
                        onClick={() => setFilter(CommentType.DIAMOND)}
                    >
                        💎
                    </div>
                </div>
            </div>
            <div className="comments-container-content">
                {filteredComments().map(({ lines, comments }) => {
                    // todo(rohan) remove 'rohanshiva' as default player tag
                    return (
                        <div className="comments-section" key={lines}>
                            <div className="comments-section-header">
                                <code onClick={() => onFocus(lines)}>{lines}</code>
                                <abbr title={getPlayersOfComments(comments).join(", ")}>
                                    <span className="emoji-reactions">
                                        {commentTypeToEmoji(filter)} {comments.length}
                                    </span>
                                </abbr>
                            </div>
                            <div className="comments-section-content">
                                {comments.map((comment, key) => (
                                    <div className="player-comment" key={key}>
                                        <div className="player-comment-header">
                                            <img
                                                alt={`https://github.com/${comment.player ? comment.player : "rohanshiva"
                                                    }`}
                                                className="player-comment-avatar"
                                                src={`${config.githubAvatarUri}${comment.player ? comment.player : "rohanshiva"
                                                    }`}
                                            />
                                            <div>rohanshiva</div>
                                        </div>
                                        <div className="player-comment-content">
                                            {comment.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {comments.filter((comment) => comment.commentType === filter).length ===
                0 && (
                    <div className="help-card">
                        <div className="help-card-icon">
                            <Icon.Info size={"1rem"} />
                        </div>
                        <div className="help-card-content">
                            No {commentTypeToEmoji(filter)} comments yet!
                            <div>
                                Click on <kbd>help</kbd> for instructions to add a new comment.
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

export default Comments;
