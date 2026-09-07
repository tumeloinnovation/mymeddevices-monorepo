import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import Icon from "@/components/common/Icon";
import AmazonSearchBar from "./AmazonSearchBar";
import NotificationIcon from "@/components/common/NotificationIcon";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

const AccountHeader = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.top);

  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <View style={styles.searchWrapper}>
          <AmazonSearchBar placeholder="Search orders, products, help..." />
        </View>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => router.push("/(aux)/help-center")}
          accessibilityRole="button"
          accessibilityLabel="Help center"
          activeOpacity={0.7}
        >
          <Icon name="help" size={20} color={colors.text} />
        </TouchableOpacity>
        <NotificationIcon />
      </View>
    </View>
  );
};

export default AccountHeader;

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
    helpButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
