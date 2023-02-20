import { useState } from "react";
import { useHistory } from "react-router-dom";
import "./JoinForm.css";
import routes_ from "../../constants/Route";

interface JoinFormProps {
  sessionId: string;
}

interface JoinFormState {
  sessionId: string;
}

function JoinForm({ sessionId }: JoinFormProps) {
  const history = useHistory();

  const [joinData, setJoinData] = useState<JoinFormState>({
    sessionId: sessionId,
  });

  const handleJoinFormSubmit = () => {
    history.replace({
      pathname: routes_.game(joinData.sessionId),
    });
  };

  const isSessionIdEmpty = () => {
    return sessionId.length === 0;
  };
  return (
    <>
      <h2> Join Session</h2>
      <form className="join-form" onSubmit={handleJoinFormSubmit}>
        <div>
          <input
            type="text"
            placeholder="session id"
            spellCheck="false"
            value={joinData.sessionId}
            onChange={(event) =>
              setJoinData({ ...joinData, sessionId: event.target.value })
            }
          />
          <input disabled={isSessionIdEmpty()} type="submit" value="Join" />
        </div>
      </form>
    </>
  );
}

JoinForm.defaultProps = {
  sessionId: "",
};

export default JoinForm;
