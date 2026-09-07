import { Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");

export const SIZES = {
  // Font Sizes
  fontXS: 12,
  fontSM: 14,
  fontMD: 16,
  fontLG: 18,
  fontXL: 20,

  // Headline Font Sizes
  h1: 40,
  h2: 32,
  h3: 28,
  h4: 24,
  h5: 20,
  h6: 16,

  // Radius
  radius: 8,
  radius_small: 4,
  radius_medium: 8,
  radius_large: 12,
  radiusXL: 16,
  radiusXXL: 20,

  // Spacing
  spacingXS: 4,
  spacingSM: 8,
  spacingMD: 12,
  spacingLG: 16,
  spacingXL: 24,
  spacingXXL: 32,

  // Padding & Margin
  paddingXS: 4,
  paddingSM: 8,
  paddingMD: 12,
  paddingLG: 16,
  paddingXL: 24,
  paddingXXL: 32,

  marginXS: 4,
  marginSM: 8,
  marginMD: 12,
  marginLG: 16,
  marginXL: 24,
  marginXXL: 32,

  // App Dimensions
  width,
  height,

  // Container Width
  containerWidth: 800,

  // Button Sizes
  buttonPaddingVertical_large: 14,
  buttonPaddingVertical_medium: 10,
  buttonPaddingVertical_small: 6,
  buttonPaddingHorizontal_large: 20,
  buttonPaddingHorizontal_medium: 16,
  buttonPaddingHorizontal_small: 12,
  fontSize_large: 18,
  fontSize_medium: 16,
  fontSize_small: 14,
};
