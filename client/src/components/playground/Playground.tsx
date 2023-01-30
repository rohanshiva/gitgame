import { useRef, useState } from "react";
import { Code, AddComment, Comment, Lines } from "../../Interface";
import Comments from "../comments";
import Editor from "../editor";
import "./Playground.css";
const code = {
  file_name: "drone_camera_observer.py",
  file_extension: "py",
  file_visit_url: "",
  content: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
    from models import Session, File, Player, Comment
    from services.github_client import GithubClient
    from models import (
        AlreadyConnectedPlayerError,
        PlayerNotInGithubError,
        OutOfFilesError,
        NoSelectedSourceCodeError,
    )
    from ws.connection_manager import Connection, ConnectionManager
    from config import GITHUB_ACCESS_TOKEN
    from enum import IntEnum
    from uuid import uuid4, UUID
    from pydantic import BaseModel
    import logging
    
    LOGGER = logging.getLogger(__name__)
    
    socket_app = FastAPI()
    
    
    class WSRequestType(IntEnum):
        PICK_SOURCE_CODE = 1
        ADD_COMMENT = 2
        DELETE_COMMENT = 3
    
    
    class WSResponseType(IntEnum):
        ALERT = 0
        ERROR = 1
        OUT_OF_FILES_TO_PICK = 2
        LOBBY = 3
        SOURCE_CODE = 4
        COMMENTS = 5
    
    
    class WSErrorType(IntEnum):
        ALREADY_CONNECTED_PLAYER = 0
        PLAYER_NOT_IN_GITHUB = 1
        SESSION_NOT_FOUND = 2
        NOT_ALLOWED = 3
    `,
  author: "Ramko9999",
} as Code;

// const Players = ["ramko9999", "rohanshiva", "TanushN", "rabingaire", "IronClad8055"]

const Help = () => {
  return (
    <div className="help">
      <div className="step">
        <div className="step-header">Step 1️</div>
        <div>Click on any line number</div>
      </div>
      <div className="step">
        <div className="step-header">Step 2</div>
        <div>
          Hold <kbd>shift</kbd> and click on any line number below or above the
          previously clicked line, to select a group of lines
        </div>
      </div>
      <div className="step">
        <div className="step-header">Step 3️</div>
        <div>
          Click on the <kbd>...</kbd> next to the selected line number. (popover
          should appear)
        </div>
      </div>
      <div className="step">
        <div className="step-header">Step 4️</div>
        <div>Type your comment in the popover texarea</div>
      </div>
      <div className="step">
        <div className="step-header">Step 5️</div>
        <div>
          If you don't like something, submit a 💩 comment by clicking on 💩
        </div>
      </div>
      <div className="step">
        <div className="step-header">Step 6️</div>
        <div>If you like something, submit a 💎 by clicking on 💎</div>
      </div>
      <div className="step">
        <div className="step-header">Step 7️</div>
        <div>Cancel line selection by clicking on ❌</div>
      </div>
    </div>
  );
};

export const Playground = () => {
  const [showHelp, setShowHelp] = useState<boolean>(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [focusLines, setFocusLines] = useState<Lines | undefined>(undefined);

  const addComment = (comment: AddComment) => {
    setComments((prevComments) => [
      ...prevComments,
      {
        ...comment,
        id: "1",
        author: {
          profile_url: "",
          username: "",
        },
      },
    ]);
  };

  return (
    <>
      <div className="top">
        <a href="https://github.com/rohanshiva/gitgame">
          github.com/rohanshiva/gitgame
        </a>
        <div className="top-btns">
          <button>Next</button>
          <button onClick={() => setShowHelp((v) => !v)}>
            {showHelp ? "Comments" : "Help"}
          </button>
        </div>
      </div>
      <div className="container">
        <Editor code={code} addComment={addComment} focusLines={focusLines} />
        {showHelp ? (
          <Help />
        ) : (
          <Comments comments={comments} setFocusLines={setFocusLines} />
        )}
      </div>
    </>
  );
};

export default Playground;
