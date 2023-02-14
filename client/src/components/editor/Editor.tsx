import { useContext, useState, useRef, useEffect } from "react";
import "./Editor.css";
import darkTheme from "./EditorDarkTheme";
import lightTheme from "prism-react-renderer/themes/github";
import "./Editor.css";
import { Code, CommentType, Lines, AddComment } from "../../Interface";
import ThemeContext, { isDark } from "../../context/ThemeContext";
import { Pre, Line, LineNo, LineContent, LineActions } from "./Styles";
import Highlight, { defaultProps, Language } from "prism-react-renderer";
import useEmojiShower from "./hooks/emojiShower/UseEmojiShower";
import useLineSelection from "./hooks/lineSelection/UseLineSelection";
import CommentCreationMenu from "./CommentCreationMenu";

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

interface EmojiShower {
  
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
  const {
    selectedLines,
    setSelectedLines,
    handleLineToggle,
    isLineSelected,
    isStartOfSelection,
  } = useLineSelection();
  const [contextMenuProps, setContextMenuProps] = useState<EditorContextMenu>({
    shouldOpen: false,
    posX: -1,
    posY: -1,
  });


  const closeContextMenu = () => {
    setContextMenuProps((props) => {
      return {
        ...props,
        shouldOpen: false
      }
    });
  }

  const cancelLineSelection = () => {
    closeContextMenu();
    setSelectedLines({ start: undefined, end: undefined });
  };

  const { poopShower, diamondShower } = useEmojiShower(cancelLineSelection);

  const addCommentToLineSelection = (comment: AddComment) => {
    if (addComment !== undefined) {
      addComment(comment);
    }
    cancelLineSelection();
    if (comment.type === CommentType.POOP) {
      poopShower();
    } else {
      diamondShower();
    }
  };

  const focusLineRef = useRef<HTMLInputElement | null>(null);

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
        closeContextMenu()
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
      <div className="emoji-shower">
        <span id="poopShower"></span>
        <span id="diamondShower"></span>
      </div>
      <Highlight
        {...defaultProps}
        theme={isDark(theme) ? darkTheme : lightTheme}
        code={code.content}
        language={getPrismExtension(code.file_extension)}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => {
          return (
            <Pre>
              {}
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
          );
        }}
      </Highlight>
    </div>
  );
}

export default Editor;
