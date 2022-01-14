import React from "react";

export enum ThemeType {
  DARK = "dark",
  LIGHT = "light",
}

export interface Theme {
  theme: ThemeType;
  setTheme: () => void;
}

const ThemeContext = React.createContext({
  theme: ThemeType.LIGHT,
  setTheme: () => {},
});

export const isDark = (theme: string) => {
  return theme === ThemeType.DARK;
};

export const isLight = (theme: string) => {
  return theme === ThemeType.LIGHT;
};

export default ThemeContext;
