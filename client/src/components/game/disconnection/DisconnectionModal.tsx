import "./DisconnectionModal.css";

interface DisconnectionModalProps {
  shouldOpen: boolean;
  message: string;
}

function DisconnectionModal({ shouldOpen, message }: DisconnectionModalProps) {
  return (
    <>
      {shouldOpen && (
        <div className="disconnection-modal">
          <div className="disconnection-message-container">
            <strong>You have been disconnected!</strong>
            <div>{message}</div>
          </div>
        </div>
      )}
    </>
  );
}

export default DisconnectionModal;
