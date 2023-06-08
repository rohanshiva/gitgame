import React from "react";
import { User } from "../Interface";

export interface UserState {
  user?: User;
  setUser: () => void;
}

const UserContext = React.createContext<UserState>({
  setUser: () => {},
});

export default UserContext;
