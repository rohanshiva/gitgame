import React from "react";

export interface UserType {
    username: string;
}

export interface User {
    user?: UserType;
    setUser: () => void;
}

const UserContext = React.createContext<User>({
    setUser: () => { },
})

export default UserContext;