import React, {Component} from "react";
import {Route, Redirect} from "react-router-dom";


function CommonRoute({component: Component, path, exact = true}: any) {
    return (
        <Route path={path} exact={exact} render={(props)=> {
            console.log(path)
            return <Component {...props}/>
        }}/>
    )
}

export default CommonRoute;