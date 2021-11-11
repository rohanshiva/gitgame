import React from "react";

import { BrowserRouter as Router, Switch } from "react-router-dom";

import routes_ from "../constants/route";
import Home from "../components/home";
import Game from "../components/game";

import CommonRoute from "./CommonRoute";
function AppRouter() {
  return (
    <Router>
      <Switch>
        <CommonRoute component={Game} path={routes_.game} />
        <CommonRoute component={Home} path={routes_.root} />
      </Switch>
    </Router>
  );
}

export default AppRouter;
