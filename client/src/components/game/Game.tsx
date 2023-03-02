import { useCallback, useContext, useState, useEffect } from "react";

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
import { AddComment } from "../../Interface";
import CommentSider from "../commentSider";
import DisconnectionModal from "./disconnection/DisconnectionModal";
import useGameConnection from "./hooks/gameConnection/UseGameConnection";
import Lobby from "./lobby/Lobby";
import UserContext from "../../context/UserContext";
import CommentHighlightContext, {
  CommentHighlight,
} from "../../context/CommentHighlightContext";

function getSessionId(path: string) {
  const pathParts = path.split("/");
  return pathParts[pathParts.length - 1];
}

function Game() {
  const history = useHistory();
  const sessionId = getSessionId(history.location.pathname);
  const { user } = useContext(UserContext);
  const username = user?.username as string;

  const [commentHighlight, setCommentHighlight] =
    useState<CommentHighlight>();

  const dehighlight = () => setCommentHighlight(undefined);

  const onAlert = useCallback((alert: string) => {
    toast(alert, SUCCESS as any);
  }, []);

  const { state, actions, disconnection } = useGameConnection(
    sessionId,
    onAlert
  );

  const { source_code, players, new_comments, comments } = state;

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

  //todo(Ramko9999): disable any interaction on the lobby chunk
  return (
    <>
      <div className="top">
        <a href={source_code.file_visit_url} target="_blank">
          {source_code.file_display_path}
        </a>
        <div className="top-right">
          <Lobby players={players} locationUser={username} />
          <div className="top-btns">
            <button onClick={nextHandler} disabled={!isYouHost}>
              Next
            </button>
            <button onClick={copyHandler}>Copy</button>
          </div>
        </div>
      </div>
      <div className="mid">
        <CommentHighlightContext.Provider
          value={{
            commentHighlight,
            highlightComment: setCommentHighlight,
            dehighlight,
          }}
        >
          <Editor
            code={source_code}
            newComments={new_comments}
            onNewCommentAck={actions.ackNewComment}
            addComment={addCommentHandler}
          />
          <CommentSider comments={comments}/>
        </CommentHighlightContext.Provider>
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
