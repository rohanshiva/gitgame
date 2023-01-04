import { useContext, useState } from "react";

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
  comments?: Comment[],
  addComment?: (comment: Comment) => void,
  expandComment?: (lineNumber: number, commentType: CommentType) => void,
}

function getPrismExtension(extension: string): Language {
  if (extension === "dart" || extension === "java") {
    return "clike" as Language;
  }
  return extension as Language;
}

function Editor({ chunk, comments, addComment, expandComment }: IEditorProps) {

  const { selectedLines, setSelectedLines, handleLineToggle, isLineSelected, isStartOfSelection } = useLineSelection();
  const { poopShower, diamondShower } = useEmojiShower();
  const [addCommentMenuOpen, setAddCommentMenuOpen] = useState<boolean>(false);

  const { theme } = useContext(ThemeContext);

  const cancelLineSelection = () => {
    setAddCommentMenuOpen((v) => !v)
    setSelectedLines({ start: undefined, end: undefined })
  }

  const addCommentToLineSelection = (comment: Comment) => {
    setAddCommentMenuOpen((v) => !v)
    if (addComment !== undefined) {
      addComment(comment)
    }
    if (comment.commentType === CommentType.POOP) {
      poopShower()
    } else {
      diamondShower()
    }
    setSelectedLines({ start: undefined, end: undefined })
  }

  const getLineComments = (lineNumber: number) => {
    const lineComments : CommentType[] = []
    //@ts-ignore
    for (const comment of comments) {
      if (comment.lines.start === lineNumber) {
        lineComments.push(comment.commentType)
      }
    }
    return lineComments
  }

  const lineActions = (lineNumber: number) => {
    const lineComments = getLineComments(lineNumber);

    if (isStartOfSelection(lineNumber)) {
      return (
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
        </>
      )
    }

    return (
      <>
        {lineComments.map((commentType, key) => (
          // @ts-ignore
          <span key={key} onClick={() => expandComment(lineNumber, commentType)} className="line-comment-emoji">
            {commentType === "diamond" ? "💎" : "💩"}
          </span>
        ))}
      </>
    )
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

          <Pre >
            {tokens.map((line, i) => (
              <Line key={i} {...getLineProps({ line, key: i })}>
                <LineActions>
                  {lineActions(i)}
                </LineActions>
                <LineNo onClick={(e) => handleLineToggle(e, i)}>
                  {i + 1}
                </LineNo>
                <LineContent className={isLineSelected(i) ? "selected-line" : "line"}>
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
