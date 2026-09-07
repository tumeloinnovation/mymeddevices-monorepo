import React from "react";
import { useTheme } from "@react-navigation/native";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors } from "@/types/app";

interface ContainerViewProps {
  children: React.ReactNode;
  padding?: number;
  margin?: number;
  style?: ViewStyle;
  bottom?: boolean;
}

const ContainerView: React.FC<ContainerViewProps> = ({
  children,
  padding = 16,
  margin = 0,
  style,
  bottom = false,
}) => {
  const { colors } = useTheme();
  const getStyles = styles(colors, padding, margin, bottom);
  return <View style={[getStyles.container, style]}>{children}</View>;
};

const styles = (
  colors: Colors,
  padding: number,
  margin: number,
  bottom: boolean
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: padding,
      margin: margin,
      backgroundColor: colors.background,
      paddingBottom: bottom ? 0 : undefined,
    },
  });

export default ContainerView;
