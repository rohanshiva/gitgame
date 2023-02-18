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
import EmojiShower, { BoundingBox } from "./animation/EmojiAnimation";

interface EditorProps {
  code: Code;
  newComments: Comment[];
  onNewCommentAck: (comment_id: string) => void;
  addComment?: (comment: AddComment) => void;
  focusLines?: Lines;
}

interface EditorContextMenu {
  shouldOpen: boolean;
  posX: number;
  posY: number;
}

interface EmojiShowerState {
  shouldShower: boolean;
  emoji: string;
  box: BoundingBox;
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

function Editor({
  code,
  newComments,
  onNewCommentAck,
  addComment,
  focusLines,
}: EditorProps) {

  console.log(newComments);

  useEffect(() => {
    scrollToFocusLine();
  }, [focusLines]);
  const { theme } = useContext(ThemeContext);
  const { selectedLines, setSelectedLines, handleLineToggle, isLineSelected } =
    useLineSelection();
  const [contextMenuProps, setContextMenuProps] = useState<EditorContextMenu>({
    shouldOpen: false,
    posX: -1,
    posY: -1,
  });

  const closeContextMenu = () => {
    setContextMenuProps((props) => {
      return {
        ...props,
        shouldOpen: false,
      };
    });
  };

  const cancelLineSelection = () => {
    closeContextMenu();
    setSelectedLines({ start: undefined, end: undefined });
  };


  const addCommentToLineSelection = (comment: AddComment) => {
    if (addComment !== undefined) {
      addComment(comment);
    }
    cancelLineSelection();
  };

  const focusLineRef = useRef<HTMLInputElement | null>(null);
  const codeRef = useRef<HTMLPreElement | null>(null);

  const scrollToFocusLine = () => {
    focusLineRef.current?.scrollIntoView();
  };

  const isStartOfFocusLines = (lineNumber: number) => {
    if (focusLines === undefined) {
      return false;
    }
    return focusLines?.start === lineNumber;
  };

  const isFocusLine = (lineNumber: number) => {
    if (focusLines === undefined) {
      return false;
    }

    return focusLines.start <= lineNumber && lineNumber <= focusLines.end;
  };

  const computeBoundingBox = (lineStartNo: number, lineEndNo: number) => {
    const lineStart = document.getElementById(`${lineStartNo}-content`);
    const lineEnd = document.getElementById(`${lineEndNo}-content`);

    const startBox = (
      lineStart as HTMLElement
    ).getBoundingClientRect() as DOMRect;

    let box = {
      topLeft: { x: startBox.x, y: startBox.y },
      width: startBox.width,
      height: startBox.height,
    };
    if (lineStart !== lineEnd) {
      const endBox = (lineEnd as HTMLElement).getBoundingClientRect() as DOMRect;
      box.width = Math.max(box.width, endBox.width);
      box.height = endBox.y - startBox.y;
    }
    return box;
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
      }}
    >
      <div
        className="editor-context-menu"
        onClick={(event: React.MouseEvent) => {
          event.stopPropagation();
          console.log("Context Menu Clicked");
        }}
        style={{ top: contextMenuProps.posY, left: contextMenuProps.posX }}
      >
        <CommentCreationMenu
          open={contextMenuProps.shouldOpen}
          onCancel={cancelLineSelection}
          onSubmit={addCommentToLineSelection}
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
                        //Understand why onFinish can be triggered even after the next source code arrives and the Editor is re-rendered with
                        //that next source code
                        onNewCommentAck(props.comment.id)
                      }}
                    />
                  );
                })}
                {tokens.map((line, lineIndex) => (
                  <Line
                    key={lineIndex}
                    {...getLineProps({ line, key: lineIndex })}
                    ref={isStartOfFocusLines(lineIndex) ? focusLineRef : null}
                  >
                    <LineNo onClick={(e) => handleLineToggle(e, lineIndex)}>
                      {lineIndex + 1}
                    </LineNo>
                    <LineContent
                      id={`${lineIndex}-content`}
                      className={
                        isLineSelected(lineIndex) || isFocusLine(lineIndex + 1)
                          ? "selected-line"
                          : "line"
                      }
                      onContextMenu={(event: React.MouseEvent) => {
                        if (
                          isLineSelected(lineIndex) ||
                          isFocusLine(lineIndex + 1)
                        ) {
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
                ))}
              </Pre>
            </>
          );
        }}
      </Highlight>
    </div>
  );
}

export default Editor;
