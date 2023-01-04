import React from "react";

import { BrowserRouter as Router, Switch } from "react-router-dom";


import {baseRoutes_} from "../constants/Route";
import Home from "../components/home";
import Game from "../components/game";
import Join from "../components/join";

import CommonRoute from "./CommonRoute";
import Playground from "../components/playground";
function AppRouter() {
  return (
    <Router>
      <Switch>
        <CommonRoute component={Game} path={baseRoutes_.game} />
        <CommonRoute component={Join} path={baseRoutes_.join} />
        {/* <CommonRoute component={Home} path={baseRoutes_.root} /> */}
        <CommonRoute component={Playground} path={baseRoutes_.root} />
      </Switch>
    </Router>
  );
}

export default AppRouter;
