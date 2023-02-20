import React from "react";

export interface User {
    username: string;
}

export interface UserState {
    user?: User;
    setUser: () => void;
}

const UserContext = React.createContext<UserState>({
    setUser: () => { },
})

export default UserContext;