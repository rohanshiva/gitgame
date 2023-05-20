import { useState, useEffect, useReducer } from "react";
import {
  AddComment,
  AlertPayload,
  BatchPayload,
  GameStateDispatchEvent,
  GameStateDispatchEventType,
  RequestType,
  ResponsePayload,
  ResponseType,
} from "../../../../Interface";
import gameReducer from "../../reducers/GameReducer";
import config from "../../../../config/Config";

function getWebSocketAddress(sessionId: string) {
  return `${config.wsUri}/${config.socket.uri.replace(
    ":sessionId",
    sessionId
  )}`;
}

function useGameConnection(
  sessionId: string,
  onAlert: (alert: string) => void
) {
  const [ws, setWs] = useState<WebSocket>(null as unknown as WebSocket);
  const [state, dispatch] = useReducer(gameReducer, {
    players: [],
    host: "",
    source_code: null,
    comments: [],
    new_comments: [],
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
      dispatch({
        ...payload,
        event_type: GameStateDispatchEventType.WS_RESPONSE,
      });
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

    socket.onerror = (ev) => {
      console.log("Ran into a WS error", ev);
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

  const ackNewComment = (comment_id: string) => {
    dispatch({
      event_type: GameStateDispatchEventType.ACK_NEW_COMMENT,
      comment_id: comment_id,
    } as GameStateDispatchEvent);
  };

  const actions = {
    pickSourceCode,
    addComment,
    ackNewComment,
  };

  const disconnection = {
    isDisconnected: disconnectionMessage != null,
    disconnectionMessage: disconnectionMessage,
  };

  const isConnected = state.players.length > 0; // hacky way of checking whether a WS response has been recieved after joining
  const isInGame = state.source_code != null;

  return { state, actions, disconnection, isConnected, isInGame };
}

export default useGameConnection;
