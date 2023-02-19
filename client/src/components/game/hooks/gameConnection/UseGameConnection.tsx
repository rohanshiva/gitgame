import { useState, useEffect, useReducer } from "react";
import {
  AddComment,
  AlertPayload,
  BatchPayload,
  lobbyCode,
  RequestType,
  ResponsePayload,
  ResponseType,
} from "../../../../Interface";
import gameReducer from "../../reducers/GameReducer";
import config from "../../../../config/Config";

function getWebSocketAddress(sessionId: string) {
  return `${config.wsUri}/${config.socket.uri.replace(":sessionId", sessionId)}`;
}

function useGameConnection(
  sessionId: string,
  onAlert: (alert: string) => void
) {
  const [ws, setWs] = useState<WebSocket>(null as unknown as WebSocket);
  const [state, dispatch] = useReducer(gameReducer, {
    players: [],
    host: "",
    source_code: lobbyCode,
    comments: [],
  });

  const [disconnectionMessage, setDisconnectionMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    const socket = new WebSocket(getWebSocketAddress(sessionId));
    socket.onmessage = ({ data }) => {
      const payload: ResponsePayload = JSON.parse(data);
      if (payload.message_type === ResponseType.ALERT) {
        onAlert((payload as AlertPayload).alert);
      } else if (payload.message_type === ResponseType.BATCH) {
        const batchPayload = payload as BatchPayload;
        const alertPayload = batchPayload.messages.find(
          ({ message_type }) => message_type === ResponseType.ALERT
        ) as AlertPayload;
        if (alertPayload) {
          onAlert(alertPayload.alert);
        }
      }

      // AlertPayloads are ignored in the reducer
      dispatch(payload);
    };

    socket.onclose = (ev: CloseEvent) => {
      if (ev.code >= 4000) {
        setDisconnectionMessage(ev.reason);
      } else {
        setDisconnectionMessage(
          "Not sure what happened. Please refresh to re-connect!"
        );
      }
    };

    socket.onopen = () => {
      setDisconnectionMessage(null);
    };

    setWs(socket);

    return () => {
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        console.log("Cleaning up connection");
        socket.close();
      }
    };
  }, []);

  const sendMessage = (data: any) => {
    ws.send(JSON.stringify(data));
  };

  const pickSourceCode = () => {
    sendMessage({ message_type: RequestType.PICK_SOURCE_CODE });
  };

  const addComment = (comment: AddComment) => {
    sendMessage({ message_type: RequestType.ADD_COMMENT, ...comment });
  };

  const actions = {
    pickSourceCode,
    addComment,
  };

  const disconnection = {
    isDisconnected: disconnectionMessage != null,
    disconnectionMessage: disconnectionMessage,
  };

  return { state, actions, disconnection };
}

export default useGameConnection;
