import { useState } from "react";
import { StatusCodes } from "http-status-codes";
import "./Feedback.css";
import Api from "../../services/HttpApi";
import { redirectToLoginUrl } from "../../constants/Route";
import { useLocation } from "react-router-dom";
import { RedirectionToLoginReason } from "../../Interface";

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
  const { pathname } = useLocation();

  const reset = () => {
    setMessage("");
    setStatus(FeedbackStatus.DRAFT);
  };

  const submit = () => {
    setStatus(FeedbackStatus.SENDING);
    Api.makeFeedback(message)
      .then(() => {
        reset();
        postSubmit();
      })
      .catch((error) => {
        const { response } = error;
        if (response.status === StatusCodes.UNAUTHORIZED) {
          redirectToLoginUrl({
            referrer: pathname,
            redirectionToLoginReason:
              RedirectionToLoginReason.COOKIE_EXPIRATION,
          });
        }

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
            Report an issue or feedback!
          </span>
          <textarea
            placeholder="We would appreciate it!"
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
