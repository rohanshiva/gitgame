import { useState } from "react";
import { JoinFormData } from "../../interfaces/JoinFormData";
import { useHistory } from "react-router-dom";
import "./JoinForm.css";
import routes_ from "../../constants/Route";
interface InitialJoinState {
  sessionId: string;
}

function JoinForm({ sessionId }: InitialJoinState) {
  const history = useHistory();

  const [joinData, setJoinData] = useState<JoinFormData>({
    username: "",
    sessionId: sessionId,
  });

  const handleJoinFormSubmit = () => {
    history.replace({
      pathname: routes_.game(joinData.sessionId, joinData.username),
    });
  };

  const isUsernameEmpty = () => {
    return joinData.username.length === 0;
  };

  const isSessionIdEmpty = () => {
    return sessionId.length === 0;
  };
  return (
    <>
      <h2> Join Session</h2>
      <form className="join-form" onSubmit={handleJoinFormSubmit}>
        <input
          type="text"
          placeholder="username"
          spellCheck="false"
          value={joinData.username}
          onChange={(event) =>
            setJoinData({ ...joinData, username: event.target.value })
          }
        />
        <div>
          {isSessionIdEmpty() && (
            <input
              type="text"
              placeholder="session id"
              spellCheck="false"
              value={joinData.sessionId}
              onChange={(event) =>
                setJoinData({ ...joinData, sessionId: event.target.value })
              }
            />
          )}

          <input disabled={isUsernameEmpty()} type="submit" value="Join" />
        </div>
      </form>
    </>
  );
}

JoinForm.defaultProps = {
  sessionId: "",
};

export default JoinForm;
