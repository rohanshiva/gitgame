import { useContext, useState, useRef, useEffect } from "react";
import "./Editor.css";
import darkTheme from "./EditorDarkTheme";
import lightTheme from "prism-react-renderer/themes/github";
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
import Highlight, { defaultProps, Language } from "prism-react-renderer";
import useLineSelection from "./hooks/lineSelection/UseLineSelection";
import CommentCreationMenu from "./CommentCreationMenu";
import EmojiShower from "./animation/EmojiAnimation";
import CommentHighlightContext from "../../context/CommentHighlightContext";
import {
  computeLazyScrollYAxisOptions,
  getViewportBounds,
  mergeViewportBounds,
} from "./Util";

interface EditorProps {
  code: Code;
  newComments: Comment[];
  onNewCommentAck: (comment_id: string) => void;
  addComment?: (comment: AddComment) => void;
}

interface EditorContextMenu {
  shouldOpen: boolean;
  posX: number;
  posY: number;
}

// todo: fill this out for supported languages
const prismExtensionMapping: { [index: string]: string } = {
  dart: "clike",
  java: "clike",
  py: "python",
  swift: "typescript", // dummy value to get prism to highlight swift code
};

function getPrismExtension(extension: string): Language {
  if (extension in prismExtensionMapping) {
    return prismExtensionMapping[extension] as Language;
  }
  return extension as Language;
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

  // todo(ramko9999): abstract the context menu state to a hook
  const [contextMenuProps, setContextMenuProps] = useState<EditorContextMenu>({
    shouldOpen: false,
    posX: -1,
    posY: -1,
  });

  const cancelCommentCreation = () => {
    closeContextMenu();
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

  const closeContextMenu = () => {
    setContextMenuProps((props) => {
      return {
        ...props,
        shouldOpen: false,
      };
    });
  };

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
        closeContextMenu();
        if (commentHighlight) {
          dehighlight();
        }
      }}
    >
      <div
        className="editor-context-menu"
        onClick={(event: React.MouseEvent) => {
          event.stopPropagation();
        }}
        style={{ top: contextMenuProps.posY, left: contextMenuProps.posX }}
      >
        <CommentCreationMenu
          open={contextMenuProps.shouldOpen}
          onCancel={cancelCommentCreation}
          onSubmit={createComment}
          lines={selectedLines as Lines}
        />
      </div>
      <Highlight
        {...defaultProps}
        theme={isDark(theme) ? darkTheme : lightTheme}
        code={code.content}
        language={getPrismExtension(code.file_extension)}
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
                            setContextMenuProps({
                              shouldOpen: true,
                              posX: event.pageX,
                              posY: event.pageY,
                            });
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
