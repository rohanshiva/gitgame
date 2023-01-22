import Highlight, { defaultProps, Language } from "prism-react-renderer";
import darkTheme from "prism-react-renderer/themes/palenight";
import lightTheme from "prism-react-renderer/themes/github";
import { Pre, Line, LineNo, LineContent } from "./Styles";
import ThemeContext, { isDark } from "../../context/ThemeContext";
import "./Editor.css";
import { useContext } from "react";
import { Code } from "../../Interface";

interface EditorProps {
  code: Code;
}

// todo: fill this out for supported languages
const prismExtensionMapping: { [index: string]: string } = {
  dart: "clike",
  java: "clike",
  py: "python",
};

function getPrismExtension(extension: string): Language {
  if (extension in prismExtensionMapping) {
    return prismExtensionMapping[extension] as Language;
  }
  return extension as Language;
}

function Editor({ code }: EditorProps) {
  const { theme } = useContext(ThemeContext);

  return (
    <div className="code-container">
      <Highlight
        {...defaultProps}
        theme={isDark(theme) ? darkTheme : lightTheme}
        code={code.content}
        language={getPrismExtension(code.file_extension)}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <Pre className={className} style={style}>
            {tokens.map((line, i) => (
              <Line key={i} {...getLineProps({ line, key: i })}>
                <LineNo> {i + 1} </LineNo>
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
