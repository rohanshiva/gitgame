import "../App.css";
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
import { baseRoutes_, constructRedirectToLoginUrl } from "../constants/Route";
import Navbar from "../components/navbar";

function ProtectedRoute({ children, ...routeProps }: RouteProps) {
  const { pathname } = useLocation();
  const { user } = useContext(UserContext);

  return (
    <Route {...routeProps}>
      {user ? (
        children
      ) : (
        <Redirect
          to={constructRedirectToLoginUrl({
            referrer: pathname,
          })}
        />
      )}
    </Route>
  );
}

function AppRouter() {
  return (
    <Router>
      <Navbar />
      <div className="main-section">
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
      </div>
    </Router>
  );
}

export default AppRouter;
