import { useContext, useRef, useEffect } from "react";
import "./Editor.css";
import lightTheme from "prism-react-renderer/themes/github";
import darkTheme from "prism-react-renderer/themes/vsDark";
import "./Editor.css";
import {
  Code,
  Lines,
  AddComment,
  commentTypeToEmoji,
  Comment,
} from "../../Interface";
import ThemeContext, { isDark } from "../../context/ThemeContext";
import { Pre, Line, LineNo, LineContent } from "./Styles";
import Highlight, { defaultProps } from "prism-react-renderer";
import useLineSelection from "./hooks/UseLineSelection";
import CommentCreationMenu from "./CommentCreationMenu";
import EmojiShower from "./animation/EmojiAnimation";
import CommentHighlightContext from "../../context/CommentHighlightContext";
import {
  computeLazyScrollYAxisOptions,
  getViewportBounds,
  mergeViewportBounds,
  getPrismLanguage,
} from "./Util";
import Popover, { usePopover } from "../popover/Popover";

interface EditorProps {
  code: Code;
  newComments: Comment[];
  onNewCommentAck: (comment_id: string) => void;
  addComment?: (comment: AddComment) => void;
}

export function Editor({
  code,
  newComments,
  onNewCommentAck,
  addComment,
}: EditorProps) {
  const { commentHighlight, dehighlight } = useContext(CommentHighlightContext);
  const { theme } = useContext(ThemeContext);
  const {
    selectedLines,
    clearLineSelection,
    handleLineToggle,
    isLineSelected,
  } = useLineSelection();

  const { anchor, anchorAt, close } = usePopover();

  const cancelCommentCreation = () => {
    close();
    clearLineSelection();
  };

  useEffect(() => {
    cancelCommentCreation();
    dehighlight();
    codeRef.current?.scroll(0, 0);
  }, [code.id]);

  useEffect(() => {
    if (commentHighlight) {
      scrollToHighlight();
      cancelCommentCreation();
    }
  }, [commentHighlight]);

  const createComment = (comment: AddComment) => {
    if (addComment !== undefined) {
      addComment(comment);
    }
    cancelCommentCreation();
  };

  const codeRef = useRef<HTMLPreElement | null>(null);

  const scrollToHighlight = () => {
    const lineStart = document.getElementById(
      `${commentHighlight?.comment.line_start}-content`
    );
    const lineEnd = document.getElementById(
      `${commentHighlight?.comment.line_end}-content`
    );

    const startBounds = getViewportBounds(lineStart as HTMLElement);
    const codeBounds = getViewportBounds(codeRef.current as HTMLElement);

    const highlightBounds = mergeViewportBounds(
      startBounds,
      getViewportBounds(lineEnd as HTMLElement)
    );

    const scrollToOptions = computeLazyScrollYAxisOptions(
      codeBounds,
      highlightBounds,
      startBounds.height
    );
    codeRef.current?.scrollBy(scrollToOptions);
  };

  const isHighlightLine = (lineNumber: number) => {
    return (
      commentHighlight &&
      commentHighlight.comment.line_start <= lineNumber &&
      lineNumber <= commentHighlight.comment.line_end
    );
  };

  const computeBoundingBox = (lineStartNo: number, lineEndNo: number) => {
    const lineStart = document.getElementById(`${lineStartNo}-content`);
    const lineEnd = document.getElementById(`${lineEndNo}-content`);

    return mergeViewportBounds(
      getViewportBounds(lineStart as HTMLElement),
      getViewportBounds(lineEnd as HTMLElement)
    );
  };

  const getShowersProps = () => {
    return newComments.map((comment) => {
      const { id, line_end, line_start, type } = comment;
      const box = computeBoundingBox(line_start, line_end);
      return {
        comment,
        id,
        box,
        emoji: commentTypeToEmoji(type),
      };
    });
  };

  return (
    <div
      className="code-container"
      onClick={() => {
        close();
        if (commentHighlight) {
          dehighlight();
        }
      }}
    >
      <Popover baseAnchor={anchor}>
        <CommentCreationMenu
          onCancel={cancelCommentCreation}
          onSubmit={createComment}
          lines={selectedLines as Lines}
        />
      </Popover>
      <Highlight
        {...defaultProps}
        theme={isDark(theme) ? darkTheme : lightTheme}
        code={code.content}
        language={getPrismLanguage(code.file_extension)}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => {
          return (
            <>
              <Pre ref={codeRef}>
                {getShowersProps().map((props) => {
                  return (
                    <EmojiShower
                      key={props.id}
                      emoji={props.emoji}
                      zone={props.box}
                      count={30}
                      onFinish={() => {
                        //todo(Ramko9999): Understand why onFinish can be triggered even after the next source code arrives and the Editor is re-rendered with
                        //that next source code
                        onNewCommentAck(props.comment.id);
                      }}
                    />
                  );
                })}
                {tokens.map((line, lineIndex) => {
                  let lineContentClass;
                  if (isLineSelected(lineIndex)) {
                    lineContentClass = "selected-line";
                  }
                  if (isHighlightLine(lineIndex)) {
                    lineContentClass = "comment-highlighted-line";
                  }

                  return (
                    <Line
                      key={lineIndex}
                      {...getLineProps({ line, key: lineIndex })}
                    >
                      <LineNo
                        onClick={(e) => {
                          handleLineToggle(e, lineIndex);
                        }}
                      >
                        {lineIndex + 1}
                      </LineNo>
                      <LineContent
                        id={`${lineIndex}-content`}
                        className={lineContentClass}
                        onContextMenu={(event: React.MouseEvent) => {
                          if (isLineSelected(lineIndex)) {
                            event.preventDefault();
                            anchorAt(
                              { x: event.pageX, y: event.pageY }
                              //contextMenuRef.current as HTMLElement
                            );
                          }
                        }}
                      >
                        {line.map((token, tokenIndex) => (
                          <span
                            key={tokenIndex}
                            {...getTokenProps({ token, key: tokenIndex })}
                          />
                        ))}
                      </LineContent>
                    </Line>
                  );
                })}
              </Pre>
            </>
          );
        }}
      </Highlight>
    </div>
  );
}

interface TextDisplayProps {
  text: string;
}

export function TextDisplay({ text }: TextDisplayProps) {
  const { theme } = useContext(ThemeContext);

  return (
    <div className="code-container">
      <Highlight
        {...defaultProps}
        theme={isDark(theme) ? darkTheme : lightTheme}
        code={text}
        language={"markdown"}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => {
          return (
            <>
              <Pre>
                {tokens.map((line, lineIndex) => {
                  return (
                    <Line
                      key={lineIndex}
                      {...getLineProps({ line, key: lineIndex })}
                    >
                      <LineNo>{lineIndex + 1}</LineNo>
                      <LineContent id={`${lineIndex}-content`}>
                        {line.map((token, tokenIndex) => (
                          <span
                            key={tokenIndex}
                            {...getTokenProps({ token, key: tokenIndex })}
                          />
                        ))}
                      </LineContent>
                    </Line>
                  );
                })}
              </Pre>
            </>
          );
        }}
      </Highlight>
    </div>
  );
}

export default Editor;
