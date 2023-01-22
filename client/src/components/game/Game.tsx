import { useReducer, useCallback } from "react";

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
import config from "../../config";
import gameReducer from "./reducers/GameReducer";
import toast from "react-hot-toast";
import "./Game.css";
import useSocket from "./hooks/socket/UseSocket";
import { GameState, lobbyCode, Player, RequestType } from "../../Interface";

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

interface GameProps {
  initialState: GameState;
}

const defaultState: GameState = {
  players: [],
  host: "",
  source_code: lobbyCode,
};

function Game({ initialState }: GameProps) {
  const history = useHistory();
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const beforeWsOpen = useCallback(() => {
    toast(
      "Connecting to session...",
      toastWithId(LOADING, NotificationDisplay.CONNECTING)
    );
  }, []);

  const onWsOpen = useCallback(() => {
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
        dispatch([packet.message_type, packet]);
      }
    },
    [dispatch, history]
  );

  const onWsClose = useCallback(() => {}, []);

  // implement this, right now the app just breaks when trying to connect to a ws url which doesn't exist.
  const onWsError = useCallback(() => {}, []);

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

  const nextHandler = () => {
    toast(
      "Fetching next chunk",
      toastWithId(LOADING, NotificationDisplay.NEXT_ROUND)
    );
    sendMessage({ message_type: RequestType.PICK_SOURCE_CODE });
  };

  const isHost = (username: string) => username === state.host;
  const isYouHost = isHost(username);

  return (
    <>
      <div className="game-settings">
        <div className="left-panel">
          <button
            disabled={!isYouHost}
            onClick={nextHandler}
            className="game-buttons"
          >
            Next
          </button>
        </div>
        <div className="right-panel">
          <button onClick={copyHandler} className="game-buttons">
            Copy
          </button>
        </div>
      </div>
      <div className="mid">
        <div className="players-container">
          {state.players.map((player: Player, i: number) => (
            <div
              className={`player ${isHost(player.username) ? "host" : ""}`}
              key={i}
            >
              <div className="player-info">
                <img
                  alt={`https://github.com/${player.username}`}
                  className="player-avatar"
                  src={player.profile_url}
                />
                <div data-testid={isHost(player.username) ? "host" : ""}>
                  {player.username}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Editor code={state.source_code} />
      </div>
      <Notification />
    </>
  );
}

Game.defaultProps = {
  initialState: defaultState,
};

export default Game;
