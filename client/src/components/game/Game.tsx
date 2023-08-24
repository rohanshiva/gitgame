import { useCallback, useContext, useState } from "react";

import { useParams } from "react-router-dom";
import Notification, {
  SUCCESS,
} from "../notifications/Notification";
import { Editor, TextDisplay } from "../editor";
import toast from "react-hot-toast";
import "./Game.css";
import { AddComment, Code, GameState, GameStatus, User, Player } from "../../Interface";
import CommentSider from "../commentSider";
import useGameConnection from "./hooks/UseGameConnection";
import Lobby from "./lobby/Lobby";
import UserContext from "../../context/UserContext";
import CommentHighlightContext, {
  CommentHighlight,
} from "../../context/CommentHighlightContext";
import { applyPlayerDisplayOrder } from "./Util";
import Dialog, { useDialog } from "../dialog/Dialog";
import InviteDialog, { copyInviteLink } from "./iniviteDialog/InviteDialog";
import HelpDialog from "./helpDialog/HelpDialog";

interface GameParams {
  sessionId: string;
}

function getWelcomeText({ players }: GameState, deviceUser: string) {
  const playerText = applyPlayerDisplayOrder(players, deviceUser)
    .map(({username}) => username)
    .join(", ");

  const debriefText = `A code file will be picked among your public Github repositories.\n\nRoast it with a 💩 comment or celebrate it with a 💎 comment.\n\nClick 🔎 if you ever need any help.\n\nTo start reviewing, everyone needs to ready up`;

  return `Players: ${playerText}\n\n${debriefText}`;
}

function isDevicePlayerReady(players: Player[], {username}: User){
  if(players.length === 0){
    return false;
  }
  const devicePlayer =  players.filter((p) => p.username === username)[0];
  return devicePlayer.is_ready;
}


function Game() {
  const { sessionId } = useParams<GameParams>();
  const { user } = useContext(UserContext);
  const username = user?.username as string;

  const [commentHighlight, setCommentHighlight] = useState<CommentHighlight>();

  const dehighlight = () => setCommentHighlight(undefined);

  const onAlert = useCallback((alert: string) => {
    toast(alert, SUCCESS as any);
  }, []);

  const { state, actions, disconnection } = useGameConnection(
    sessionId,
    onAlert
  );

  const { source_code, players, new_comments, comments, status } = state;

  const { isDisconnected, disconnectionMessage } = disconnection;

  const { isOpen: isHelpDialogOpen, open: openHelpDialog, close: closeHelpDialog } = useDialog();

  const { isOpen: isInviteDialogOpen, close: closeInviteDialog } = useDialog({ initialIsOpen: true });

  const advanceHandler = () => {
    if(isDevicePlayerReady(players, user as User)){
      return actions.wait();
    }
    return actions.ready();
  }

  const addCommentHandler = (comment: AddComment) => {
    actions.addComment(comment);
  };

  const renderEditor = () => {
    if (status === GameStatus.FINISHED) {
      return (
        <TextDisplay
          text={"We ran out of code files for you play on! Thanks for playing!"}
        />
      );
    }

    if (status === GameStatus.PLAYING) {
      return (
        <Editor
          code={source_code as Code}
          newComments={new_comments}
          onNewCommentAck={actions.ackNewComment}
          addComment={addCommentHandler}
        />
      );
    }
    if (status === GameStatus.IN_LOBBY) {
      return <TextDisplay text={getWelcomeText(state, username)} />;
    }

    return <TextDisplay text={"Connecting..."} />;
  };

  const getCodePath = () => {
    if (status === GameStatus.FINISHED) {
      return "GameOver.txt";
    } else if (status === GameStatus.IN_LOBBY) {
      return "Welcome.txt";
    } else if (status === GameStatus.PLAYING) {
      return source_code?.file_display_path;
    } else {
      return "Connecting.txt";
    }
  };


  const codeLink =
    status === GameStatus.PLAYING ? source_code?.file_visit_url : undefined;
  const isInLobby = status === GameStatus.IN_LOBBY;

  return (
    <>
      <div className="top">
        <a href={codeLink} target="_blank">
          {getCodePath()}
        </a>
        <div className="top-right">
          <Lobby players={players} locationUser={username} />
          <div className="top-btns">
            <button className="advance-btn" onClick={advanceHandler} disabled={status === GameStatus.CONNECTING}>
              {isDevicePlayerReady(players, user as User) ? "Wait" : "Ready"}
            </button>
            <abbr title="Invite your friends!">
              <button onClick={copyInviteLink}>Copy Invite Link</button>
            </abbr>
            <abbr title="How to add a comment?">
              <button onClick={openHelpDialog}>Help</button>
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
      <Dialog isOpen={isDisconnected}>{disconnectionMessage as string}</Dialog>
      <HelpDialog isOpen={isHelpDialogOpen} onClose={closeHelpDialog} />
      {isInLobby && (
        <InviteDialog isOpen={isInviteDialogOpen} onClose={closeInviteDialog} />
      )}
    </>
  );
}

export default Game;
