import React from "react";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

const DefaultHeader = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = createStyles(colors, insets.top);
  return <View style={styles.container}>{children}</View>;
};

export default DefaultHeader;

const createStyles = (colors: Colors, topInset: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      // height: 60 + topInset, // Removed fixed height to allow flexibility
      paddingTop: topInset + SIZES.paddingSM, // Adjusted padding
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: SIZES.paddingMD,
      paddingLeft: 10,
      paddingRight: 0,
    },
  });
