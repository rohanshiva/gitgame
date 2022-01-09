import Highlight, { defaultProps, Language } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/palenight";
import { Pre, Line, LineNo, LineContent } from "./Styles";

import { Chunk } from "../../interfaces/chunk";
import ChunkService from "../../services/chunk";

import "./Editor.css"
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
  return (
    <div className="code-container">
      <Highlight
        {...defaultProps}
        theme={theme}
        code={ChunkService.getAsCode(chunk as Chunk)}
        language={getPrismExtension((chunk as Chunk).extension)}
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
