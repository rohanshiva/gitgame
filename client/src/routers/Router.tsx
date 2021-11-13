import React from "react";

import { BrowserRouter as Router, Switch } from "react-router-dom";


import {baseRoutes_} from "../constants/route";
import Home from "../components/home";
import Game from "../components/game";

import CommonRoute from "./CommonRoute";
function AppRouter() {
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
