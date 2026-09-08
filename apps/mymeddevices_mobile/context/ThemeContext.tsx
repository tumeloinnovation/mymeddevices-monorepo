import React, { createContext, useState, useCallback } from "react";
import { ColorSchemeName, useColorScheme } from "react-native";

interface ThemeContextValueTypes {
  theme: ColorSchemeName;
  changeTheme: (theme: ColorSchemeName) => void;
}

export const ThemeContext = createContext<ThemeContextValueTypes>({
  theme: "light",
  changeTheme: () => {},
});

type Props = { children: React.ReactNode };

export const ThemeProvider: React.FC<Props> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [customTheme, setCustomTheme] = useState<ColorSchemeName | null>(null);

  const theme: ColorSchemeName = customTheme ?? colorScheme ?? "light";

  const changeTheme = useCallback((newTheme: ColorSchemeName) => {
    setCustomTheme(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
