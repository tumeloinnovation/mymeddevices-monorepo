const fontConfig = {
  regular: "Jost-Regular",
  heading: "Marcellus-Regular",
  subheading: "SpaceMono-Regular",
};

export const LightTheme = {
  dark: false,
  colors: {
    primary: "#FF6F61", // A warm and inviting primary color
    secondary: "#5A67D8", // A calm and cool secondary color
    background: "#F7FAFC", // A very light background color
    card: "#FFFFFF", // Card background color
    onSurface: "#2D3748", // Darker color for text on surface
    success: "#48BB78", // Green success color
    error: "#E53E3E", // Red error color
    warning: "#ECC94B", // Yellow warning color
    info: "#4299E1", // Blue info color
    text: "#2D3748", // Primary text color
    textSecondary: "#718096", // Secondary text color
    textDisabled: "#A0AEC0", // Disabled text color
    border: "#CBD5E0", // Light border color
    notification: "#38B2AC", // Teal notification color
  },
  fonts: fontConfig,
};

export const DarkTheme = {
  dark: true,
  colors: {
    primary: "#FF8C82", // A lighter version of the primary color for dark mode
    secondary: "#A3BFFA", // A lighter secondary color for dark mode
    background: "#1A202C", // Dark background color
    card: "#2D3748", // Darker card background color
    onSurface: "#F7FAFC", // Light color for text on surface
    success: "#68D391", // Light green success color
    error: "#FC8181", // Light red error color
    warning: "#F6E05E", // Light yellow warning color
    info: "#63B3ED", // Light blue info color
    text: "#E2E8F0", // Light text color
    textSecondary: "#A0AEC0", // Lighter secondary text color
    textDisabled: "#4A5568", // Disabled text color
    border: "#4A5568", // Dark border color
    notification: "#4FD1C5", // Light teal notification color
  },
  fonts: fontConfig,
};

export type Theme = typeof LightTheme | typeof DarkTheme;

export type ColorSchemeName = keyof Theme;
