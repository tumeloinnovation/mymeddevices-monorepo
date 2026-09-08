import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const LoadingIndicator = ({ text }: { text: string }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} animating size={"large"} />
      <Text style={styles.text}>Loading {text}...</Text>
    </View>
  );
};

export default LoadingIndicator;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    text: {
      color: colors.text,
      fontSize: 20,
      marginTop: SIZES.paddingSM,
      fontWeight: "700",
    },
  });
