import React from "react"
import {Route, Redirect} from "react-router-dom";

function CommonRoute({component: Component, path, exact = true}) {
    return (
        <Route path={path} exact={exact} render={(props)=> {
            console.log(path)
            return <Component {...props}/>
        }}/>
    )
}

export default CommonRoute;