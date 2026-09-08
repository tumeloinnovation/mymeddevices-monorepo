import React from "react";
import { Text, TextStyle, StyleSheet, TextProps, StyleProp } from "react-native";
import { useTheme } from "@react-navigation/native";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

interface CustomTextProps extends TextProps {
  children: React.ReactNode;
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body" | "caption" | "button";
  style?: StyleProp<TextStyle>;
}

const CustomText: React.FC<CustomTextProps> = ({
  children,
  variant = "body",
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <Text 
      style={[styles[variant], style]} 
      allowFontScaling={true}
      maxFontSizeMultiplier={1.3}
      {...props}
    >
      {children}
    </Text>
  );
};

const getStyles = (colors: Colors) =>
  StyleSheet.create({
    h1: {
      // fontFamily: "Jost_700Bold",
      fontSize: SIZES.h1,
      color: colors.text,
    },
    h2: {
      // fontFamily: "Jost_600SemiBold",
      fontSize: SIZES.h2,
      color: colors.text,
    },
    h3: {
      // fontFamily: "Jost_600SemiBold",
      fontSize: SIZES.h3,
      color: colors.text,
    },
    h4: {
      // fontFamily: "Jost_500Medium",
      fontSize: SIZES.h4,
      color: colors.text,
    },
    h5: {
      // fontFamily: "Jost_500Medium",
      fontSize: SIZES.h5,
      color: colors.text,
    },
    h6: {
      // fontFamily: "Jost_400Regular",
      fontSize: SIZES.h6,
      color: colors.text,
    },
    body: {
      // fontFamily: "Jost_400Regular",
      fontSize: SIZES.fontMD,
      color: colors.text,
    },
    caption: {
      // fontFamily: "Jost_400Regular",
      fontSize: SIZES.fontSM,
      color: colors.textSecondary,
    },
    button: {
      fontSize: SIZES.fontMD,
      fontWeight: "600",
      color: colors.text,
    },
  });

export default CustomText;
