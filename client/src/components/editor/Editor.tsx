import Highlight, { defaultProps, Language } from "prism-react-renderer";
import darkTheme from "prism-react-renderer/themes/palenight";
import lightTheme from "prism-react-renderer/themes/github";
import { Pre, Line, LineNo, LineContent } from "./Styles";

import { Chunk } from "../../interfaces/Chunk";
import ChunkService from "../../services/Chunk";
import ThemeContext, { isDark } from "../../context/ThemeContext";
import "./Editor.css";
import { useContext } from "react";

interface IEditorProps {
  chunk: Chunk;
}

function getPrismExtension(extension: string): Language {
  if (extension === "dart" || extension === "java") {
    return "clike" as Language;
  }
  return extension as Language;
}

function Editor({ chunk }: IEditorProps) {
  const { theme } = useContext(ThemeContext);

  return (
    <div className="code-container">
      <Highlight
        {...defaultProps}
        theme={isDark(theme) ? darkTheme : lightTheme}
        code={ChunkService.getAsCode(chunk)}
        language={getPrismExtension(chunk.extension)}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <Pre className={className} style={style}>
            {tokens.map((line, i) => (
              <Line key={i} {...getLineProps({ line, key: i })}>
                <LineNo>
                  {" "}
                  {ChunkService.getStartLine(chunk as Chunk) + (i + 1)}{" "}
                </LineNo>
                <LineContent>
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
