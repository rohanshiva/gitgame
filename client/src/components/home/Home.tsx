import Notification from "../notifications/Notification";
import JoinModal from "../joinModal/";
import MakeModal from "../makeModal/";
import "./Home.css";

function Home() {
  return (
    <>
      <div className="make-session">
        <MakeModal />
      </div>
      <div className="join-session">
        <JoinModal sessionId="" />
      </div>
      <Notification />
    </>
  );
}

export default Home;
