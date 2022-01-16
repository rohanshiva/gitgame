import { useState } from "react";
import { IJoinFormData } from "../../interfaces/JoinFormData";
import { useHistory } from "react-router-dom";
import "./Join.css";
import routes_ from "../../constants/Route";

function getSessionId(path: string) {
  const pathParts = path.split("/");
  return pathParts[pathParts.length - 1];
}

function Join() {
  const history = useHistory();

  const [joinData, setJoinData] = useState<IJoinFormData>({
    username: "",
    sessionId: getSessionId(history.location.pathname),
  });

  const handleJoinFormSubmit = () => {
    history.replace({
      pathname: routes_.game(joinData.sessionId, joinData.username),
    });
  };

  const isUsernameEmpty = () => {
    return joinData.username.length == 0;
  };

  return (
    <>
      <h2> Join Session</h2>

      <form className="join-form" onSubmit={handleJoinFormSubmit}>
        <div>
          <input
            type="text"
            placeholder="username"
            spellCheck="false"
            value={joinData.username}
            onChange={(event) =>
              setJoinData({ ...joinData, username: event.target.value })
            }
          />
          <input disabled={isUsernameEmpty()} type="submit" value="Join" />
        </div>
      </form>
    </>
  );
}

export default Join;