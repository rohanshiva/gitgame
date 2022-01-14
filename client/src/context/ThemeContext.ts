import React from "react";

export interface Theme {
  theme: string;
  setTheme: () => void;
}

const ThemeContext = React.createContext({
  theme: "light",
  setTheme: () => {},
});

export const isDark = (theme: string) => {
  return theme === "dark";
};

export const isLight = (theme: string) => {
  return theme === "light";
};

export default ThemeContext;
