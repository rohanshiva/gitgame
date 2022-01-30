import Notification from "../notifications/Notification";
import JoinForm from "../joinForm/";
import MakeForm from "../makeForm/";
import "./Home.css";

function Home() {
  return (
    <>
      <div className="make-session">
        <MakeForm />
      </div>
      <div className="join-session">
        <JoinForm />
      </div>
      <Notification />
    </>
  );
}

export default Home;
