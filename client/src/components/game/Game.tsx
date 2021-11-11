import React, { useState, useEffect } from "react";

import * as api from "../../utils/api";
import config from "../../config/config";

import { useHistory } from "react-router-dom";
import "./Game.css";

import Highlight, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/palenight";

const exampleCode = `
(function someDemo() {
  var test = "Hello World!";
  console.log(test);
})();

return () => <App />;
`.trim();

function Game(props: any) {
  const [session, setSession] = useState({});
  const [loading, setLoading] = useState(true);

  const history = useHistory();
  const [chunk, setChunk] = useState("Loading...");
  const [code, setCode] = useState("Loading...");
  const getCodeChunk = async () => {
    const pickUri = config.pick.uri.replace(":sessionId", session.id);
    const chunkUri = config.chunk.uri.replace(":sessionId", session.id);

    try {
      if (!loading) {
        const pickReq = await api.get(pickUri);
        if (pickReq.status == 200) {
          const chunkReq = await api.get(chunkUri);
          if (chunkReq.status == 200) {
            console.log(chunkReq);
          }
        }
      }
    } catch (error) {}
  };
  useEffect(() => {
    setSession(props.location.state.session);
    if (session.id) {
      setLoading(false);
    }
    getCodeChunk();
  });

  console.log("received session props", session);

  const handleOnLeaveGame = () => {
    // TODO: leave game stuff
    history.push("/");
  };
  return (
    <>
      {loading ? (
        <>
          <div className="loading_tag">Loading...</div>
        </>
      ) : (
        <>
          <div className="code_container">
            <Highlight
              {...defaultProps}
              theme={theme}
              code={exampleCode}
              language="jsx"
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre className={className} style={style}>
                  {tokens.map((line, i) => (
                    <div {...getLineProps({ line, key: i })}>
                      {line.map((token, key) => (
                        <span {...getTokenProps({ token, key })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>
          <div className="player_tags">
            {session.players.map((name, key) => (
              <div className="player_tag" key={key}>
                {name}
              </div>
            ))}
          </div>
          <div className="game_options">
            <button onClick={handleOnLeaveGame}>Peak Above</button>
            <button onClick={handleOnLeaveGame}>Peak Below</button>
            <button className="leave_button" onClick={handleOnLeaveGame}>
              Leave game
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default Game;
