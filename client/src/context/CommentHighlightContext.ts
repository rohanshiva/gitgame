import React from "react";
import { Comment } from "../Interface";

export interface CommentHighlight {
  comment: Comment;
}

interface CommentHighlightState {
  commentHighlight?: CommentHighlight;
  highlightComment: (commentHighlight: CommentHighlight) => void;
  dehighlight: () => void;
}

const CommentHighlightContext = React.createContext<CommentHighlightState>({
  highlightComment: (_) => {},
  dehighlight: () => {},
});

export default CommentHighlightContext;
