import { useContext, useEffect } from "react";
import Notification, { LOADING } from "../notifications/Notification";
import "./Home.css";
import UserContext from "../../context/UserContext";
import { GitPullRequest } from "react-feather";
import config from "../../config";
import MakeForm from "../makeForm";
import toast from "react-hot-toast";

function Login() {
  return (
    <a href={`${config.baseUri}/${config.login.uri}`}>
      <button>Login</button>
    </a>
  )
}

function Form() {
  return (
    <>
      <div className="make-session">
        <MakeForm />
      </div>
    </>
  )
}

function Home() {

  const { user } = useContext(UserContext);

  return (
    <div className="home-container">
      <div className="home-left">
        <GitPullRequest size={64} />
        <h1 className="headline">
          <span>
            Real-Time
          </span>
          <span>
            Code Review Fun!
          </span>
        </h1>
        <h4 className="tagline">
          git_game is the best way to look at code with friends.
        </h4>

        {user ? <Form /> : <Login />}
      </div>
      <div className="home-right">

      </div>
      <Notification />
    </div>
  );
}

export default Home;
