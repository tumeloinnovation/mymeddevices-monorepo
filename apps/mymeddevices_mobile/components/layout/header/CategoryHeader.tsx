import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NotificationIcon from "@/components/common/NotificationIcon";
import AmazonSearchBar from "./AmazonSearchBar";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

const CategoryHeader = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.top);

  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <View style={styles.searchWrapper}>
          <AmazonSearchBar placeholder="Search categories & products..." />
        </View>
        <NotificationIcon />
      </View>
    </View>
  );
};

export default CategoryHeader;

const createStyles = (colors: Colors, topInset: number) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.card,
      paddingTop: topInset + 6,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 4,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SIZES.spacingMD,
      gap: 8,
    },
    searchWrapper: {
      flex: 1,
    },
  });
