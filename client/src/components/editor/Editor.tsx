import { useContext, useState, useRef, useEffect } from "react";

import "./Editor.css";
import darkTheme from "./EditorDarkTheme";
import lightTheme from "prism-react-renderer/themes/github";
import ThemeContext, { isDark } from "../../context/ThemeContext";
import { Pre, Line, LineNo, LineContent, LineActions } from "./Styles";
import Highlight, { defaultProps, Language } from "prism-react-renderer";


import { Chunk } from "../../interfaces/Chunk";
import { Comment, CommentType, Lines } from "../../interfaces/Comment";

import ChunkService from "../../services/Chunk";

import LineSelectionMenu from "./LineSelectionMenu";
import useEmojiShower from "./hooks/emojiShower/UseEmojiShower";
import useLineSelection from "./hooks/lineSelection/UseLineSelection";

interface IEditorProps {
  chunk: Chunk;
  addComment?: (comment: Comment) => void;
  focusLines?: Lines;
}

function getPrismExtension(extension: string): Language {
  if (extension === "dart" || extension === "java") {
    return "clike" as Language;
  }
  return extension as Language;
}

function Editor({ chunk, addComment, focusLines }: IEditorProps) {

  useEffect(() => {
    scrollToFocusLine();
  }, [focusLines])
  const { theme } = useContext(ThemeContext);
  const { selectedLines, setSelectedLines, handleLineToggle, isLineSelected, isStartOfSelection } = useLineSelection();
  const [addCommentMenuOpen, setAddCommentMenuOpen] = useState<boolean>(false);

  const cancelLineSelection = () => {
    setAddCommentMenuOpen((v) => !v)
    setSelectedLines({ start: undefined, end: undefined })
  }

  const { poopShower, diamondShower } = useEmojiShower(cancelLineSelection);

  const addCommentToLineSelection = (comment: Comment) => {
    if (addComment !== undefined) {
      addComment(comment)
    }
    if (comment.commentType === CommentType.POOP) {
      poopShower()
    } else {
      diamondShower()
    }
  }

  const focusLineRef = useRef<HTMLInputElement | null>(null);

  const scrollToFocusLine = () => {
    focusLineRef.current?.scrollIntoView();
  }

  const isStartOfFocusLines = (lineNumber: number) => {
    if (focusLines === undefined) {
      return false
    }
    return focusLines?.start === lineNumber
  }

  const isFocusLine = (lineNumber: number) => {
    if (focusLines === undefined) {
      return false
    }

    return focusLines.start <= lineNumber && lineNumber <= focusLines.end
  }

  return (
    <div className="code-container">
      <Highlight
        {...defaultProps}
        theme={isDark(theme) ? darkTheme : lightTheme}
        code={ChunkService.getAsCode(chunk)}
        language={getPrismExtension(chunk.extension)}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (

          <Pre>
            {tokens.map((line, i) => (
              <Line key={i} {...getLineProps({ line, key: i })} ref={isStartOfFocusLines(i) ? focusLineRef : null}>
                <LineActions>
                  {(isStartOfSelection(i)) &&
                    <>
                      <LineSelectionMenu
                        open={addCommentMenuOpen}
                        setOpen={setAddCommentMenuOpen}
                        cancel={cancelLineSelection}
                        addComment={addCommentToLineSelection}
                        lines={selectedLines as Lines}
                      />
                      <span id="poopShower" />
                      <span id="diamondShower" />
                    </>}
                </LineActions>
                <LineNo onClick={(e) => handleLineToggle(e, i)}>
                  {i + 1}
                </LineNo>
                <LineContent className={(isLineSelected(i) || isFocusLine(i)) ? "selected-line" : "line"}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token, key })} />
                  ))}
                </LineContent>
              </Line>
            ))}
          </Pre>
        )}
      </Highlight>
    </div>
  );
}

export default Editor;
