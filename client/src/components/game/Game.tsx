import { useCallback, useContext, useState } from "react";

import { useParams } from "react-router-dom";
import Notification, {
  SUCCESS,
  LOADING,
  toastWithId,
  NotificationDisplay,
} from "../notifications/Notification";
import { Editor, TextDisplay } from "../editor";
import toast from "react-hot-toast";
import "./Game.css";
import { AddComment, Code, GameState } from "../../Interface";
import CommentSider from "../commentSider";
import useGameConnection from "./hooks/UseGameConnection";
import Lobby from "./lobby/Lobby";
import UserContext from "../../context/UserContext";
import CommentHighlightContext, {
  CommentHighlight,
} from "../../context/CommentHighlightContext";
import { applyPlayerDisplayOrder } from "./Util";
import Dialog, { useDialog } from "../dialog/Dialog";
import Help from "../commentSider/help/Help";

interface GameParams {
  sessionId: string
}

function getWelcomeText({ players }: GameState, deviceUser: string) {
  const host = players.filter((player) => player.is_host)[0];
  const playerText = applyPlayerDisplayOrder(players, deviceUser)
    .map(({ username, is_host }) => {
      if (is_host) {
        return `${username} (Host)`;
      }
      return username;
    })
    .join(", ");

  const debriefText = `A code file will be picked among your public Github repositories.\n\nRoast it with a 💩 comment or celebrate it with a 💎 comment.\n\nClick 🔎 if you ever need any help.\n\nTo start reviewing, ${host.username} (Host) needs to click 'Next'`;

  return `Players: ${playerText}\n\n${debriefText}`;
}

function Game() {
  const {sessionId} = useParams<GameParams>();
  const { user } = useContext(UserContext);
  const username = user?.username as string;

  const [commentHighlight, setCommentHighlight] = useState<CommentHighlight>();

  const dehighlight = () => setCommentHighlight(undefined);

  const onAlert = useCallback((alert: string) => {
    toast(alert, SUCCESS as any);
  }, []);

  const { state, actions, disconnection, isConnected, hasGameStarted } =
    useGameConnection(sessionId, onAlert);

  const { source_code, players, new_comments, comments } = state;

  const { isDisconnected, disconnectionMessage } = disconnection;

  const { isOpen: isHelpOpen, open: openHelp, close: closeHelp } = useDialog();

  const copyHandler = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast(`Invite link copied!`, SUCCESS as any);
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

  const renderEditor = () => {
    if (state.is_finished) {
      return (
        <TextDisplay
          text={"We ran out of code files for you play on! Thanks for playing!"}
        />
      );
    }

    if (hasGameStarted) {
      return (
        <Editor
          code={source_code as Code}
          newComments={new_comments}
          onNewCommentAck={actions.ackNewComment}
          addComment={addCommentHandler}
        />
      );
    }
    if (isConnected) {
      return <TextDisplay text={getWelcomeText(state, username)} />;
    }

    return <TextDisplay text={"Connecting..."} />;
  };

  const visitUrl =
    hasGameStarted && !state.is_finished
      ? source_code?.file_visit_url
      : "https://github.com/rohanshiva/gitgame";
  const displayPath =
    hasGameStarted && !state.is_finished
      ? source_code?.file_display_path
      : "rohanshiva/gitgame";

  const isYouHost = username === state.host;
  const canPickNext = isYouHost && !state.is_finished;

  return (
    <>
      <div className="top">
        <a href={visitUrl} target="_blank">
          {displayPath}
        </a>
        <div className="top-right">
          <Lobby players={players} locationUser={username} />
          <div className="top-btns">
            <button onClick={nextHandler} disabled={!canPickNext}>
              Next
            </button>
            <abbr title="Invite your friends!">
              <button onClick={copyHandler}>Copy Invite Link</button>
            </abbr>
            <abbr title="How to add a comment?">
              <button onClick={openHelp}>
                Help
              </button>
            </abbr>
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
          {renderEditor()}
          <CommentSider comments={comments} />
        </CommentHighlightContext.Provider>
      </div>
      <Notification />
      <Dialog
        isOpen={isDisconnected}
      >
        {disconnectionMessage as string}
      </Dialog>
      <Dialog isOpen={isHelpOpen} onClose={closeHelp}>
        <Help />
      </Dialog>
    </>
  );
}



export default Game;
