import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ColorValue,
  StyleProp,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

interface CustomButtonProps
  extends React.ComponentProps<typeof TouchableOpacity> {
  title: string;
  size?: "large" | "medium" | "small";
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  type?: "default" | "primary" | "secondary";
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  size = "medium",
  style,
  textStyle,
  type = "primary",
  ...props
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors, type, size);

  return (
    <TouchableOpacity
      {...props}
      style={[
        styles.button,
        style,
        { backgroundColor: type === "primary" ? colors.primary : colors.card },
      ]}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const getStyles = (
  colors: Colors,
  type: "primary" | "default" | "secondary",
  size: "large" | "medium" | "small"
) =>
  StyleSheet.create({
    button: {
      paddingVertical: SIZES[`buttonPaddingVertical_${size}`],
      paddingHorizontal: SIZES[`buttonPaddingHorizontal_${size}`],
      marginHorizontal: SIZES.marginSM,
      borderRadius: SIZES[`radius_${size}`],
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: type === "primary" ? colors.primary : colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    text: {
      color: type === "primary" ? colors.background : colors.onSurface,
      fontSize: SIZES[`fontSize_${size}`],
      // fontWeight: "500",
    },
  });

export default CustomButton;
