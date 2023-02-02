import { useReducer, useCallback, useState } from "react";

import { useHistory } from "react-router-dom";
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
import {
  AddComment,
  GameState,
  lobbyCode,
  RequestType,
  Lines,
} from "../../Interface";
import CommentSider from "../commentSider";
import DisconnectionModal from "./disconnection/DisconnectionModal";

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
  comments: [],
};

function Game({ initialState }: GameProps) {
  const history = useHistory();
  const [focusLines, setFocusLines] = useState<Lines | undefined>(undefined);
  const [disconnectionMessage, setDisconnectionMessage] = useState<string>("");
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const beforeWsOpen = useCallback(() => {
    /*toast(
      "Connecting to session...",
      toastWithId(LOADING, NotificationDisplay.CONNECTING)
    );
    */
  }, []);

  const onWsOpen = useCallback(() => {
    //toast.dismiss(NotificationDisplay.CONNECTING);
  }, []);

  const onWsMessage = useCallback(
    (data: any) => {
      const packet = JSON.parse(data);
      if (packet.error) {
        toast(
          `Failed to join session with error: ${packet.error}`,
          ERROR as any
        );
        //history.push(routes_.root());
      } else {
        dispatch([packet.message_type, packet]);
      }
    },
    [dispatch, history]
  );

  const onWsClose = useCallback((code: number, reason: string) => {
    if (reason === "") {
      reason = "Not sure what happened. Please refresh to re-connect!";
    }
    setDisconnectionMessage(reason);
  }, []);

  // implement this, right now the app just breaks when trying to connect to a ws url which doesn't exist.
  const onWsError = useCallback(() => {
    console.log("WebSocket connection is erroring...");
  }, []);

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

  const addCommentHandler = (comment: AddComment) => {
    sendMessage({
      message_type: RequestType.ADD_COMMENT,
      ...comment,
    });
  };

  const isHost = (username: string) => username === state.host;
  const isYouHost = isHost(username);

  return (
    <>
      <div className="top">
        <a href="https://github.com/rohanshiva/gitgame">
          github.com/rohanshiva/gitgame
        </a>
        <div className="top-btns">
          <button onClick={nextHandler} disabled={!isYouHost}>
            Next
          </button>
          <button onClick={copyHandler}>Copy</button>
        </div>
      </div>
      <div className="mid">
        <Editor
          code={state.source_code}
          addComment={addCommentHandler}
          focusLines={focusLines}
        />
        <CommentSider comments={state.comments} setFocusLines={setFocusLines} />
      </div>
      <Notification />
      <DisconnectionModal
        shouldOpen={disconnectionMessage !== ""}
        message={disconnectionMessage}
      />
    </>
  );
}

Game.defaultProps = {
  initialState: defaultState,
};

export default Game;
