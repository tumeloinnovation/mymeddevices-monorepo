import { RootTheme } from "./types/app";

declare module "@react-navigation/native" {
  export function useTheme(): RootTheme;
}
