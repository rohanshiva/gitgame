import { useContext, useState, useRef, useEffect } from "react";
import "./Editor.css";
import darkTheme from "./EditorDarkTheme";
import lightTheme from "prism-react-renderer/themes/github";
import "./Editor.css";
import { Code, Lines, AddComment, commentTypeToEmoji } from "../../Interface";
import ThemeContext, { isDark } from "../../context/ThemeContext";
import { Pre, Line, LineNo, LineContent } from "./Styles";
import Highlight, { defaultProps, Language } from "prism-react-renderer";
import useLineSelection from "./hooks/lineSelection/UseLineSelection";
import CommentCreationMenu from "./CommentCreationMenu";
import EmojiShower, { BoundingBox } from "./animation/EmojiAnimation";

interface EditorProps {
  code: Code;
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

function Editor({ code, addComment, focusLines }: EditorProps) {
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
  const [emojiShowerProps, setEmojiShowerProps] = useState<EmojiShowerState>({
    shouldShower: false,
    emoji: "",
    box: {
      topLeft: { x: -1, y: -1 },
      width: -1,
      height: -1,
    },
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

  const shower = (
    emoji: string,
    start: number,
    end: number,
    box: BoundingBox
  ) => {
    setEmojiShowerProps({
      shouldShower: true,
      emoji: emoji,
      box,
    });
  };

  const addCommentToLineSelection = (comment: AddComment) => {
    if (addComment !== undefined) {
      addComment(comment);
    }
    const start = selectedLines.start as number;
    const end = selectedLines.end as number;

    const startBox =
      selectionStartRef.current?.getBoundingClientRect() as DOMRect;

    let box = {
      topLeft: { x: startBox.x, y: startBox.y },
      width: startBox.width,
      height: startBox.height
    }

    if(selectionEndRef.current != null){
      const endBox = selectionEndRef.current?.getBoundingClientRect() as DOMRect;
      box.width = Math.max(box.width, endBox.width);
      box.height = endBox.y - startBox.y;
    }
    cancelLineSelection();
    shower(commentTypeToEmoji(comment.type), start, end, box);
  };

  const focusLineRef = useRef<HTMLInputElement | null>(null);
  const selectionStartRef = useRef<HTMLElement | null>(null);
  const selectionEndRef = useRef<HTMLElement | null>(null);

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
              <Pre>
                {emojiShowerProps.shouldShower && (
                  <EmojiShower
                    key={"shower"}
                    emoji={emojiShowerProps.emoji}
                    zone={emojiShowerProps.box}
                    count={30}
                    onFinish={() => {
                      setEmojiShowerProps((props) => {
                        return {
                          ...props,
                          shouldShower: false,
                        };
                      });
                    }}
                  />
                )}
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
                      onClick={(e) => console.log(e.pageY)}
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
                      ref={
                        selectedLines.start === lineIndex
                          ? selectionStartRef
                          : selectedLines.end === lineIndex
                          ? selectionEndRef
                          : null
                      }
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
