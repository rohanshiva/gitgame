import { useState, useEffect} from "react";

function useSocket(socketUrl: string, beforeOpen: () => void, onOpen: (ws: WebSocket) => void, onMessage: (data: any) => void,
  onClose: () => void, onError: () => void) {
  const [ws, setWs] = useState<WebSocket>(null as unknown as WebSocket);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (ws) {
      if (ws.readyState === ws.CONNECTING){
        ws.onmessage = ({ data }) => {
          onMessage(data);
        };
  
        ws.onerror = (ev) => {
          onError();
        }
  
        ws.onclose = (ev) => {
          onClose();
        }
  
        ws.onopen = (ev) => {
          setIsConnected(true);
          onOpen(ws);
        }
      }
    } else {
      beforeOpen()
      setWs(new WebSocket(socketUrl))
    }

    return () => {
      if (ws && ws.readyState !== ws.CLOSED) {
        ws.close()
      }
    }

  }, [ws, beforeOpen, onOpen, onMessage, onClose, onError, socketUrl]);

  const sendMessage = (data: any) => {
    ws.send(JSON.stringify(data));
  }

  return {sendMessage, isConnected};
}

export default useSocket;
