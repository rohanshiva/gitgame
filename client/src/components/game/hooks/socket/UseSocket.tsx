import { useState, useEffect } from "react";

function useSocket(
  socketUrl: string,
  beforeOpen: () => void,
  onOpen: () => void,
  onMessage: (data: any) => void,
  onClose: () => void,
  onError: () => void
) {
  const [ws, setWs] = useState<WebSocket>(null as unknown as WebSocket);
  const [isConnected, setIsConnected] = useState(false);

  const sendMessage = (data: any) => {
    ws.send(JSON.stringify(data));
  };

  useEffect(() => {
    beforeOpen();
    const socket = new WebSocket(socketUrl);
    socket.onmessage = ({ data }) => {
      onMessage(data);
    };

    socket.onerror = (ev) => {
      onError();
    };

    socket.onclose = (ev) => {
      onClose();
    };

    socket.onopen = (ev) => {
      setIsConnected(true);
      onOpen();
    };
    setWs(socket);

    return () => {
      if (ws && ws.readyState !== ws.CLOSED) {
        ws.close();
      }
    };
  }, []);

  return { sendMessage, isConnected };
}

export default useSocket;
