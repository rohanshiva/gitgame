import { useState, useEffect, useReducer } from "react";
import { useHistory } from "react-router-dom";
import gameReducer from "../../reducers/GameReducer";
import toast from "react-hot-toast";
import { ERROR, LOADING } from "../../../notifications/Notification";
import IPlayer from "../../../../interfaces/Player";
import IGameState, { SessionState } from "../../../../interfaces/GameState";
import config from "../../../../config";
import routes_ from "../../../../constants/route";

const dummyPlayer: IPlayer = { username: "", score: 0, has_guessed: false };
const initialState: IGameState = {
  players: [],
  host: dummyPlayer,
  state: SessionState.IN_LOBBY,
};

function getWebSocketAddress(sessionId: string, username: string) {
  return `${config.wsUri}/${config.socket.uri
    .replace(":sessionId", sessionId)
    .replace(":username", username)}`;
}

function useSocket(sessionId: string, username: string) {
  // const [ws, setWs] = useState(null as unknown as WebSocket);
  const history = useHistory();
  const [ws, setWs] = useState(null as unknown as WebSocket);
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    if (ws) {
      ws.onmessage = ({ data }) => {
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
    } else {
      const loadingToast = toast.loading(
        "Connecting to session...",
        LOADING as any
      );
      setWs(new WebSocket(getWebSocketAddress(sessionId, username)));
      toast.dismiss(loadingToast);
    }

    return () => {
      try {
        ws.close();
      } catch (e) {}
    };
  }, [ws]);

  return {ws, state };
}

export default useSocket;
