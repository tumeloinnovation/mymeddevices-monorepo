import React from "react";
import { useTheme } from "@react-navigation/native";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { Colors } from "@/types/app";

interface ContainerScrollViewProps {
  children: React.ReactNode;
  padding?: number;
  margin?: number;
  style?: ViewStyle;
}

const ContainerScrollView: React.FC<ContainerScrollViewProps> = ({
  children,
  padding = 16,
  margin = 16,
  style,
}) => {
  const { colors } = useTheme();
  const getStyles = styles(colors, padding, margin);
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[getStyles.container, style]}
    >
      {children}
      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const styles = (colors: Colors, padding: number, margin: number) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: padding,
      margin: margin,
      backgroundColor: colors.background,
    },
  });

export default ContainerScrollView;
