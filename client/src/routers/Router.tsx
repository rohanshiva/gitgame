import { useContext } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  RouteProps,
  useLocation,
} from "react-router-dom";
import Home from "../components/home";
import Game from "../components/game";
import UserContext from "../context/UserContext";
import { baseRoutes_ } from "../constants/Route";

function constructRedirectToLoginPath(referrer: string) {
  const params = new URLSearchParams({ referrer });
  return `${baseRoutes_.root}?${params.toString()}`;
}

function ProtectedRoute({ children, ...routeProps }: RouteProps) {
  const { pathname } = useLocation();
  const { user } = useContext(UserContext);

  return (
    <Route {...routeProps}>
      {user ? (
        children
      ) : (
        <Redirect to={constructRedirectToLoginPath(pathname)} />
      )}
    </Route>
  );
}

function AppRouter() {
  return (
    <Router>
      <Switch>
        <ProtectedRoute path={baseRoutes_.game} exact={true}>
          <Game />
        </ProtectedRoute>
        <Route path={baseRoutes_.root} exact={true}>
          <Home />
        </Route>
        <Route path="*">
          <Redirect to={baseRoutes_.root} />
        </Route>
      </Switch>
    </Router>
  );
}

export default AppRouter;
