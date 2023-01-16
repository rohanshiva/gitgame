import "./App.css";
import React, { useState } from "react";
import AppRouter from "./routers/Router";
import Navbar from "./components/navbar";
import ThemeContext, { Theme } from "./context/ThemeContext";

function App() {
  const [theme, setTheme] = useState("light");
  const value = { theme, setTheme };
  return (
    <>
      <ThemeContext.Provider value={value as Theme}>
        <div className="app">
          <Navbar />
          <div className="main-section">
            <AppRouter />
          </div>
        </div>
      </ThemeContext.Provider>
    </>
  );
}

export default App;
