import React, { useReducer, useCallback, useEffect } from "react";

import { useHistory } from "react-router-dom";
import routes_ from "../../constants/Route";
import Notification, {
  SUCCESS,
  ERROR,
  LOADING,
  toastWithId,
  NotificationDisplay,
} from "../notifications/Notification";
import Editor from "../editor";
import IGameState, {
  SessionState,
  lobbyChunk,
  ClientEventType,
} from "../../interfaces/GameState";
import IPlayer from "../../interfaces/Player";

import config from "../../config";
import gameReducer from "./reducers/GameReducer";
import toast from "react-hot-toast";
import "./Game.css";
import { GameResults, RoundResults } from "../results";
import useSocket from "./hooks/socket/UseSocket";
import IPrompt from "../../interfaces/Prompt";
import IAnswer from "../../interfaces/Answer";
import Timer from "../timer/Timer";
import Choices from "../choices/Choices";

function getSessionId(path: string) {
  const pathParts = path.split("/");
  return pathParts[pathParts.length - 2];
}

function getUsername(path: string) {
  const pathParams = path.split("/");
  return pathParams[pathParams.length - 1];
}

function getWebSocketAddress(sessionId: string, username: string) {
  return `${config.wsUri}/${config.socket.uri
    .replace(":sessionId", sessionId)
    .replace(":username", username)}`;
}

const initialState: IGameState = {
  players: [],
  host: { username: "", score: 0, has_guessed: false },
  state: SessionState.IN_LOBBY,
};

function Game() {
  const history = useHistory();
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const beforeWsOpen = useCallback(() => {
    toast(
      "Connecting to session...",
      toastWithId(LOADING, NotificationDisplay.CONNECTING)
    );
  }, []);

  const onWsOpen = useCallback((websocket: WebSocket) => {
    toast.dismiss(NotificationDisplay.CONNECTING);
  }, []);

  const onWsMessage = useCallback(
    (data: any) => {
      const packet = JSON.parse(data);
      if (packet.error) {
        toast(
          `Failed to join session with error: ${packet.error}`,
          ERROR as any
        );
        history.push(routes_.root());
      } else {
        dispatch([packet.message_type, packet.message]);
      }
    },
    [dispatch, history]
  );

  const onWsClose = useCallback(() => { }, []);
  const onWsError = useCallback(() => { }, []);

  const sessionId = getSessionId(history.location.pathname);
  const username = getUsername(history.location.pathname);
  const socketUrl = getWebSocketAddress(sessionId, username);
  const { sendMessage } = useSocket(
    socketUrl,
    beforeWsOpen,
    onWsOpen,
    onWsMessage,
    onWsClose,
    onWsError
  );

  const copyHandler = async () => {
    await navigator.clipboard.writeText(sessionId);
    toast(`Session code copied ${sessionId}!`, SUCCESS as any);
  };

  const startHandler = () => {
    sendMessage({ event_type: ClientEventType.START_GAME });
  };

  const nextHandler = () => {
    toast(
      "Fetching next chunk",
      toastWithId(LOADING, NotificationDisplay.NEXT_ROUND)
    );
    sendMessage({ event_type: ClientEventType.NEXT_ROUND });
  };

  const guessHandler = (guess: string) => {
    sendMessage({ event_type: ClientEventType.GUESS, guess });
  };

  const isHost = (username: string) => username === state.host.username;
  const isYouHost = isHost(username);

  const inGuessing = () => {
    return state.state === SessionState.IN_GUESSING;
  };
  const inDoneGuessing = () => {
    return state.state === SessionState.DONE_GUESSING;
  };
  const inOutOfChunks = () => {
    return state.state === SessionState.OUT_OF_CHUNKS;
  };
  const inLobby = () => {
    return state.state === SessionState.IN_LOBBY;
  };

  return (
    <>
      <div className="game-settings">
        <div className="left-panel">
          <button
            disabled={!inDoneGuessing() || !isYouHost}
            onClick={nextHandler}
            className="game-buttons"
          >
            Next
          </button>
          <button
            disabled={!inLobby() || !isYouHost}
            onClick={startHandler}
            className="game-buttons"
          >
            Start
          </button>
        </div>
        <div className="right-panel">
          {inGuessing() && (
            <>
              <Timer expiration={(state.prompt as IPrompt).guessExpiration} />
            </>
          )}
          <button onClick={copyHandler} className="game-buttons">
            Copy
          </button>
        </div>
      </div>
      <div className="mid">
        <div className="players-container">
          {state.players.map((player: IPlayer, i: number) => (
            <div
              className={`player ${isHost(player.username) ? "host" : ""}`}
              key={i}
            >
              <div className="player-info">
                <img
                  className="player-avatar"
                  src={`${config.githubAvatarUri}${player.username}`}
                />
                <div>{player.username}</div>
              </div>

              <div>{player.score}</div>
            </div>
          ))}
        </div>

        {inLobby() && <Editor chunk={lobbyChunk} />}
        {inGuessing() && (
          <>
            <Editor chunk={(state.prompt as IPrompt).chunk} />
          </>
        )}
        {inDoneGuessing() && (
          <RoundResults correctChoice={(state.answer as IAnswer).correctChoice}
            players={(state.answer as IAnswer).players}
            repository={(state.answer as IAnswer).repository} />
        )}
        {inOutOfChunks() && (
          <GameResults players={(state.answer as IAnswer).players}
            endGameMessage="Out of chunks for you to guess on. Thanks for playing!" />
        )}
      </div>

      {inGuessing() && (
        <Choices
          choices={(state.prompt as IPrompt).choices}
          guessHandler={guessHandler}
        />
      )}

      <Notification />
    </>
  );
}

export default Game;
