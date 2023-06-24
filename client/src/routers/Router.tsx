import { useContext } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import Home from "../components/home";
import Game from "../components/game";
import UserContext from "../context/UserContext";
import { baseRoutes_ } from "../constants/Route";

function AppRouter() {
  const { user } = useContext(UserContext);

  if (!user) {
    return <Home />;
  }

  return (
    <Router>
      <Switch>
        <Route path={baseRoutes_.game} exact={true}>
          <Game/>
        </Route>
        <Route path={baseRoutes_.root} exact={true}>
            <Home/>
        </Route>
        <Route path="*">
          <Redirect to={baseRoutes_.root}/>
        </Route>
      </Switch>
    </Router>
  );
}

export default AppRouter;
