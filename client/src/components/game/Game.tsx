import React, { useState, useEffect, useReducer } from "react";

import { useHistory } from "react-router-dom";
import routes_ from "../../constants/route";
import Notification, {
  SUCCESS,
  ERROR,
  LOADING,
  toastWithId,
} from "../notifications/Notification";
import Editor from "../editor";
import IGameState, {
  ServerMessageType,
  SessionState,
  lobbyChunk,
} from "../../interfaces/GameState";
import SessionService from "../../services/session";
import IPlayer from "../../interfaces/Player";

import config from "../../config";
import gameReducer from "./reducers/GameReducer";
import toast from "react-hot-toast";
import "./Game.css";
import Answer from "../answer";
import useSocket from "./hooks/socket/SessionHook";

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

const dummyPlayer: IPlayer = { username: "", score: 0, has_guessed: false };
const initialState: IGameState = {
  players: [],
  host: dummyPlayer,
  state: SessionState.IN_LOBBY,
};

function Game(props: any) {
  const history = useHistory();
  const sessionId = getSessionId(history.location.pathname);
  const username = getUsername(history.location.pathname);
  const { ws, state } = useSocket(sessionId, username);

  const copyHandler = async () => {
    await navigator.clipboard.writeText(sessionId);
    toast(`Session code copied ${sessionId}!`, SUCCESS as any);
  };

  const startHandler = () => {
    SessionService.startGame(ws);
  };

  const nextHandler = () => {
    const nextToast = toast(
      "Fetching next chunk",
      toastWithId(LOADING as any, "nextRound")
    );
    SessionService.nextChunk(ws);
  };

  const guessHandler = (event: any) => {
    const guess = event.target.innerText;
    console.info("guess:", guess);
    SessionService.makeGuess(ws, guess);
  };
  return (
    <>
      <div className="game-settings">
        <div className="left-panel">
          <button
            disabled={
              !(state.state === SessionState.DONE_GUESSING) ||
              !SessionService.isHost(username, state.host)
            }
            onClick={nextHandler}
          >
            Next
          </button>
          <button
            disabled={
              !(state.state === SessionState.IN_LOBBY) ||
              !SessionService.isHost(username, state.host)
            }
            onClick={startHandler}
          >
            Start
          </button>
        </div>
        <div className="right-panel">
          <button onClick={copyHandler}>Copy</button>
        </div>
      </div>
      <div className="mid">
        <div className="players-container">
          {state.players.map((player: IPlayer, i: number) => (
            <div
              className={`player ${
                SessionService.isHost(username, state.host) ? "host" : ""
              }`}
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
        {state.state === SessionState.IN_LOBBY && <Editor chunk={lobbyChunk} />}
        {state.state === SessionState.IN_GUESSING && (
          <Editor chunk={state.prompt.chunk} />
        )}
        {state.state === SessionState.DONE_GUESSING && (
          <Answer
            correctChoice={state.answer.correctChoice}
            players={state.answer.players}
            outOfChunks={false}
          />
        )}
        {state.state === SessionState.OUT_OF_CHUNKS && (
          <Answer
            correctChoice={state.correctChoice}
            players={SessionService.getSortedPlayers(state.players)}
            outOfChunks={true}
          />
        )}
      </div>
      {state.state === SessionState.IN_GUESSING && (
        <div className="choices">
          {state.prompt.choices.map((choice: string, i: number) => (
            <button className="choice" onClick={(event) => guessHandler(event)}>
              {choice}
            </button>
          ))}
        </div>
      )}

      <Notification />
    </>
  );
}

export default Game;
