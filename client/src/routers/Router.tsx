import { useContext } from "react";
import { BrowserRouter as Router, Switch } from "react-router-dom";
import config from "../config/index";
import Home from "../components/home";
import Game from "../components/game";
import CommonRoute from "./CommonRoute";
import UserContext from "../context/UserContext";
import { baseRoutes_ } from "../constants/Route";

function AppRouter() {
  const { user } = useContext(UserContext);

  if (!user) {
    return (
      <div>
        <a href={`${config.baseUri}/${config.login.uri}`}>
          Login
        </a>
      </div>
    )
  }

  return (
    <Router>
      <Switch>
        <CommonRoute component={Game} path={baseRoutes_.game} />
        <CommonRoute component={Home} path={baseRoutes_.root} />
      </Switch>
    </Router>
  );
}

export default AppRouter;
