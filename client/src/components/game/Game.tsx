import React, { useState, useEffect } from "react";

import { useHistory } from "react-router-dom";
import "./Game.css";
import Highlight, { defaultProps, Language } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/palenight";
import Session from "../../interfaces/session";
import routes_ from "../../constants/route";
import { Chunk } from "../../interfaces/chunk";
import SessionService from "../../services/session";
import ChunkService from "../../services/chunk";

function getSessionId(path: string){
  const pathParts = path.split("/");
  return pathParts[pathParts.length - 1];
}

function getPrismExtension(extension: string) : Language{
  if(extension === "dart" || extension === "java"){
    return "clike" as Language;
  }
  return extension as Language;
}

function Game(props: any) {

  const history = useHistory();
  const sessionId = getSessionId(history.location.pathname);

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [chunk, setChunk] = useState<Chunk | null>(null);

  useEffect(() => {
    async function loadSession(){
      try{
        setSession(await SessionService.getSession(sessionId));
        await pickChunk();
        setLoading(false);
      } catch (error: any){
        console.error(error.message);
      }
    }
    loadSession();
  }, []);

  const handleOnLeaveGame = () => {
    // TODO: leave game stuff
    history.push(routes_.root());
  };

  const pickChunk = async () => {
      setChunk(await SessionService.pick(sessionId));
  };

  const peekAbove = async () => {
    try{
      setChunk(await SessionService.peek(sessionId, "above"));
    } catch(error: any){
      console.log(`Unable to peek above: ${error.message}`);
    }
  }

  const peekBelow = async () => {
    try{
      setChunk(await SessionService.peek(sessionId, "below"));
    } catch(error: any){
      console.log(`Unable to peek below: ${error.message}`);
    }
      
  }

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
              code={ChunkService.getAsCode(chunk as Chunk)}
              language={getPrismExtension((chunk as Chunk).extension)}
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
            {(session as Session).players.map((name: string, key:number) => (
              <div className="player_tag" key={key}>
                {name}
              </div>
            ))}
          </div>
          <div className="game_options">
            <button onClick={pickChunk}> Pick Another Chunk </button>
            <button onClick={peekAbove}>Peak Above</button>
            <button onClick={peekBelow}>Peak Below</button>
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
