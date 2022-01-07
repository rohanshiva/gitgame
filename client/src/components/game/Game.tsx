import React, { useState, useEffect, useReducer } from "react";

import { useHistory } from "react-router-dom";
import routes_ from "../../constants/route";
import Notification, {
  SUCCESS,
  ERROR,
  LOADING,
} from "../notifications/Notification";

import IGameState, {
  ServerMessageType,
  SessionState,
} from "../../interfaces/GameState";
import IPlayer from "../../interfaces/Player";

import config from "../../config";
import gameReducer from "./reducers/GameReducer";
import toast from "react-hot-toast";
import "./Game.css";

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
  state: SessionState.NEWLY_CREATED,
};

function Game(props: any) {
  const history = useHistory();
  const sessionId = getSessionId(history.location.pathname);
  const username = getUsername(history.location.pathname);

  const [state, dispatch] = useReducer(gameReducer, initialState);

  const copyHandler = async () => {
    await navigator.clipboard.writeText(sessionId);
    toast(`Session code copied ${sessionId}!`, SUCCESS as any);
  };

  useEffect(() => {
    const ws = new WebSocket(getWebSocketAddress(sessionId, username));

    const loadingToast = toast.loading(
      "Connecting to session...",
      LOADING as any
    );

    ws.onmessage = ({ data }) => {
      toast.dismiss(loadingToast);
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
    };
    return () => {
      try {
        ws.close();
      } catch (e) {}
    };
  }, []);
  return (
    <>
      <div className="game-settings">
        <div className="left-panel">
          <button>Next</button>
          <button disabled={!(username === state.host.username)}>Start</button>
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
                player.username === state.host.username ? "host" : ""
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
        <div>Waiting for players to join</div>
      </div>

      <Notification />
    </>
  );
}

export default Game;
