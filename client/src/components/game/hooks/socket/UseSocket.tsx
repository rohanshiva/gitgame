import { useState, useEffect } from "react";

function useSocket(socketUrl: string, beforeOpen: () => void, onOpen: (ws: WebSocket) => void, onMessage: (data: any) => void,
  onClose: () => void, onError: () => void) {
  const [ws, setWs] = useState<WebSocket>(null as unknown as WebSocket);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    beforeOpen();
    const socket = new WebSocket(socketUrl);
    socket.onmessage = ({ data }) => {
      onMessage(data);
    };

    socket.onerror = (ev) => {
      onError();
    }

    socket.onclose = (ev) => {
      onClose();
    }

    socket.onopen = (ev) => {
      setIsConnected(true);
      onOpen(ws);
    }
    setWs(socket);

    return () => {
      if (ws && ws.readyState !== ws.CLOSED) {
        ws.close()
      }
    }
  }, [])

  const sendMessage = (data: any) => {
    ws.send(JSON.stringify(data));
  }

  return { sendMessage, isConnected };
}

export default useSocket;
