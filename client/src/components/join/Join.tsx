import JoinModal from "../joinModal/JoinModal";
import { useHistory } from "react-router-dom";

function getSessionId(path: string) {
  const pathParts = path.split("/");
  return pathParts[pathParts.length - 1];
}

function Join() {
  const history = useHistory();

  return (
    <div>
      <JoinModal sessionId={getSessionId(history.location.pathname)} />
    </div>
  );
}

export default Join;
