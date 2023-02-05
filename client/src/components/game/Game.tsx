import { useCallback, useState } from "react";

import { useHistory } from "react-router-dom";
import Notification, {
  SUCCESS,
  LOADING,
  toastWithId,
  NotificationDisplay,
} from "../notifications/Notification";
import Editor from "../editor";
import toast from "react-hot-toast";
import "./Game.css";
import {
  AddComment,
  Lines
} from "../../Interface";
import CommentSider from "../commentSider";
import DisconnectionModal from "./disconnection/DisconnectionModal";
import useGameConnection from "./hooks/gameConnection/UseGameConnection";

function getSessionId(path: string) {
  const pathParts = path.split("/");
  return pathParts[pathParts.length - 2];
}

function getUsername(path: string) {
  const pathParams = path.split("/");
  return pathParams[pathParams.length - 1];
}

function Game() {
  const history = useHistory();
  const sessionId = getSessionId(history.location.pathname);
  const username = getUsername(history.location.pathname);
  const [focusLines, setFocusLines] = useState<Lines | undefined>(undefined);

  const onAlert = useCallback((alert: string) => {
    toast(alert, SUCCESS as any);
  }, []);

  const { state, actions, disconnection } = useGameConnection(
    sessionId,
    username,
    onAlert
  );

  const { isDisconnected, disconnectionMessage } = disconnection;

  const copyHandler = async () => {
    await navigator.clipboard.writeText(sessionId);
    toast(`Session code copied ${sessionId}!`, SUCCESS as any);
  };

  const nextHandler = () => {
    
    toast(
      "Fetching next chunk",
      toastWithId(LOADING, NotificationDisplay.NEXT_ROUND)
    );

    actions.pickSourceCode();
  };

  const addCommentHandler = (comment: AddComment) => {
    actions.addComment(comment);
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
        shouldOpen={isDisconnected}
        message={disconnectionMessage as string}
      />
    </>
  );
}

export default Game;
