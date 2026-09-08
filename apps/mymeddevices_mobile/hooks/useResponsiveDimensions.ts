import { useWindowDimensions } from "react-native";

/**
 * Responsive design utilities for auth screens
 * Based on screen size analysis of common devices:
 * - iPhone SE: 375x667
 * - iPhone 12/13: 390x844
 * - iPhone 14 Pro Max: 430x932
 * - iPad Mini: 768x1024
 * - iPad: 820x1180
 */

export const useResponsiveDimensions = () => {
  const { width, height } = useWindowDimensions();

  // Screen size breakpoints
  const isSmallPhone = width < 380; // iPhone SE, iPhone 12 mini
  const isPhone = width >= 380 && width < 768; // Most phones
  const isTablet = width >= 768; // Tablets and large tablets

  // Base dimensions (iPhone 12/13 as reference)
  const baseWidth = 390;
  const baseHeight = 844;

  // Scale factors
  const widthScale = width / baseWidth;
  const heightScale = height / baseHeight;
  const scaleFactor = Math.min(widthScale, heightScale);

  // Responsive dimensions
  const getMaxWidth = () => {
    if (isSmallPhone) return width * 0.9;  // 90% width for small phones
    if (isPhone) return Math.min(400, width * 0.85); // Max 400, 85% width
    return Math.min(500, width * 0.6);  // Max 500, 60% width for tablets
  };

  const getHorizontalPadding = () => {
    if (isSmallPhone) return 16;
    if (isPhone) return 24;
    return 32; // More padding on tablets
  };

  const getVerticalPadding = () => {
    if (isSmallPhone) return 20;
    if (isPhone) return 40;
    return 60; // More padding on tablets
  };

  const getFontSize = (baseSize: number) => {
    const scaledSize = baseSize * scaleFactor;

    // Clamp to reasonable ranges
    if (baseSize >= 32) return Math.min(scaledSize, baseSize * 1.3); // Headlines
    if (baseSize >= 20) return Math.min(scaledSize, baseSize * 1.2); // Subheadings
    return Math.min(scaledSize, baseSize * 1.1); // Body text
  };

  const getButtonHeight = () => {
    if (isSmallPhone) return 44;
    if (isPhone) return 48;
    return 52; // Larger buttons on tablets
  };

  const getOtpInputSize = () => {
    const size = isSmallPhone ? 40 : isPhone ? 45 : 50;
    const height = isSmallPhone ? 50 : isPhone ? 55 : 60;
    return { width: size, height };
  };

  const getSpacing = (baseSize: number) => {
    return baseSize * scaleFactor;
  };

  const getBorderRadius = (baseSize: number) => {
    return baseSize * scaleFactor;
  };

  return {
    // Screen info
    width,
    height,
    isSmallPhone,
    isPhone,
    isTablet,
    scaleFactor,

    // Responsive getters
    getMaxWidth,
    getHorizontalPadding,
    getVerticalPadding,
    getFontSize,
    getButtonHeight,
    getOtpInputSize,
    getSpacing,
    getBorderRadius,

    // Common values
    containerMaxWidth: getMaxWidth(),
    horizontalPadding: getHorizontalPadding(),
    verticalPadding: getVerticalPadding(),
    buttonHeight: getButtonHeight(),
    otpInputSize: getOtpInputSize(),
  };
};

export type ResponsiveDimensions = ReturnType<typeof useResponsiveDimensions>;