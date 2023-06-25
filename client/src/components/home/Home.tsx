import toast from "react-hot-toast";
import { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Notification, { ERROR } from "../notifications/Notification";
import "./Home.css";
import UserContext from "../../context/UserContext";
import { GitPullRequest } from "react-feather";
import config from "../../config";
import MakeForm from "../makeForm";
import { LoginParams } from "../../constants/Route";

function useLoginParams(): LoginParams {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  let loginParams = {};
  if (params.has("referrer")) {
    loginParams = { referrer: params.get("referrer") as string };
  }
  if (params.has("didCookieExpirePostAuth")) {
    const didCookieExpirePostAuth =
      (params.get("didCookieExpirePostAuth") as string) === "true";
    loginParams = { ...loginParams, didCookieExpirePostAuth };
  }
  return loginParams;
}

function Login() {
  const loginParams = useLoginParams();

  const loginUrl = new URL(`${config.baseUri}/${config.login.uri}`);
  if (loginParams.referrer) {
    loginUrl.searchParams.append("referrer", loginParams.referrer);
  }

  return (
    <a href={loginUrl.toString()}>
      <button>Login</button>
    </a>
  );
}

function Form() {
  return (
    <>
      <div className="make-session">
        <MakeForm />
      </div>
    </>
  );
}

function Home() {
  const { user } = useContext(UserContext);
  const loginParams = useLoginParams();

  useEffect(() => {
    if (loginParams.didCookieExpirePostAuth) {
      toast(
        "Your cookie expired. Please login again to resume from where you left off.",
        ERROR as any
      );
    }
  }, [loginParams.didCookieExpirePostAuth]);

  return (
    <div className="home-container">
      <div className="home-left">
        <GitPullRequest size={64} />
        <h1 className="headline">
          <span>Real-Time</span>
          <span>Code Review Fun!</span>
        </h1>
        <h4 className="tagline">
          git_game is the best way to look at code with friends.
        </h4>

        {user ? <Form /> : <Login />}
      </div>
      <div className="home-right">
        <video autoPlay loop muted>
          <source src={config.demoVideoUri} type="video/mp4" />
        </video>
      </div>
      <Notification />
    </div>
  );
}

export default Home;
