import toast from "react-hot-toast";
import { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Notification, { toastStyles } from "../notifications/Notification";
import "./Home.css";
import UserContext from "../../context/UserContext";
import { GitPullRequest } from "react-feather";
import config from "../../config";
import MakeForm from "../makeForm";
import { LoginParams } from "../../constants/Route";
import { RedirectionToLoginReason } from "../../Interface";

function explainRedirectionToLogin(reason: RedirectionToLoginReason) {
  if (reason === RedirectionToLoginReason.COOKIE_EXPIRATION) {
    return "Your cookie has expired. Please login in again to resume where you left off.";
  } else if (reason === RedirectionToLoginReason.USER_DENIED_GITHUB_AUTH) {
    return "Please ensure to authorize the application. We promise we won't steal your data!";
  } else {
    return "Something unexpected went wrong! Please try again.";
  }
}

function useLoginParams(): LoginParams {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  let loginParams = {};
  if (params.has("referrer")) {
    loginParams = { referrer: params.get("referrer") as string };
  }
  if (params.has("redirection_reason")) {
    loginParams = {
      ...loginParams,
      redirectionToLoginReason: parseInt(
        params.get("redirection_reason") as string
      ),
    };
  }
  return loginParams;
}

function Login() {
  const { referrer } = useLoginParams();

  const loginUrl = new URL(`${config.baseUri}/${config.login.uri}`);
  if (referrer) {
    loginUrl.searchParams.append("referrer", referrer);
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
  const { redirectionToLoginReason } = useLoginParams();

  useEffect(() => {
    if (redirectionToLoginReason !== undefined) {
      toast(
        explainRedirectionToLogin(redirectionToLoginReason),
        toastStyles.NEGATIVE
      );
    }
  }, [redirectionToLoginReason]);

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
