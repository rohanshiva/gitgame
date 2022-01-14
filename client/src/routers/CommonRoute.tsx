import React from "react";
import { Route } from "react-router-dom";

function CommonRoute({ component: Component, path, exact = true }: any) {
  return (
    <Route
      path={path}
      exact={exact}
      render={(props) => {
        return <Component {...props} />;
      }}
    />
  );
}

export default CommonRoute;
