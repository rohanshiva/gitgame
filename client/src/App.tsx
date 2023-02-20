import "./App.css";
import { useEffect, useState } from "react";
import AppRouter from "./routers/Router";
import Navbar from "./components/navbar";
import ThemeContext, { Theme } from "./context/ThemeContext";
import UserContext, { User, UserType } from "./context/UserContext";
import UserService from "./services/User";

function App() {
  const [theme, setTheme] = useState("light");

  const [user, setUser] = useState<UserType>();

  useEffect(() => {
    const getUser = async () => {
      try {
        setUser(await UserService.getUser());
      } catch {
        setUser(undefined);
      }
    };
    getUser();
  }, []);

  return (
    <>
      <ThemeContext.Provider value={{ theme, setTheme } as Theme}>
        <UserContext.Provider value={{ user, setUser } as User}>
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
