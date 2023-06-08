import "./App.css";
import { useEffect, useState } from "react";
import AppRouter from "./routers/Router";
import Navbar from "./components/navbar";
import ThemeContext, { Theme } from "./context/ThemeContext";
import UserContext, { UserState } from "./context/UserContext";
import { User } from "./Interface";
import Api from "./services/HttpApi";

function App() {
  const [theme, setTheme] = useState("light");
  const [user, setUser] = useState<User>();

  useEffect(() => {
    Api.getUser().then(setUser);
  }, []);

  return (
    <>
      <ThemeContext.Provider value={{ theme, setTheme } as Theme}>
        <UserContext.Provider value={{ user, setUser } as UserState}>
          <div className="app">
            <Navbar />
            <div className="main-section">
              <AppRouter />
            </div>
          </div>
        </UserContext.Provider>
      </ThemeContext.Provider>
    </>
  );
}

export default App;
