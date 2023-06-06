import { useState } from "react";
import "./Feedback.css";
import FeedbackService from "../../services/Feedback";

interface FeedbackProps {
  onCancel: () => void;
  postSubmit: () => void;
}

enum FeedbackStatus {
  DRAFT = 1,
  SENDING = 2,
  ERROR = 3,
}

function Feedback({ onCancel, postSubmit }: FeedbackProps) {
  const [status, setStatus] = useState<FeedbackStatus>(FeedbackStatus.DRAFT);
  const [message, setMessage] = useState<string>("");

  const reset = () => {
    setMessage("");
    setStatus(FeedbackStatus.DRAFT);
  };

  const submit = () => {
    setStatus(FeedbackStatus.SENDING);
    FeedbackService.makeFeedback(message)
      .then(() => {
        reset();
        postSubmit();
      })
      .catch((error) => {
        setStatus(FeedbackStatus.ERROR);
      });
  };

  const cancel = () => {
    setStatus(FeedbackStatus.DRAFT);
    onCancel();
  };

  const canSend =
    message.trim().length > 0 && status !== FeedbackStatus.SENDING;
  const hasErrored = status === FeedbackStatus.ERROR;

  return (
    <>
      <div className="context-menu-container">
        <div className="context-menu-content">
          <span className="context-menu-header">
            Please provide any feedback!
          </span>
          <textarea
            placeholder="...."
            onChange={(e) => setMessage(e.target.value)}
            value={message}
            maxLength={250}
            spellCheck={false}
          />
          {hasErrored && (
            <span className="feedback-fail">Failed to send! Try again!</span>
          )}
        </div>

        <div className="context-menu-buttons">
          <button className="context-menu-button" onClick={cancel}>
            ❌
          </button>
          <button
            className={"context-menu-button"}
            disabled={!canSend}
            onClick={submit}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}

export default Feedback;
