import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";

import Icon from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

interface AmazonSearchBarProps {
  placeholder?: string;
  onPress?: () => void;
}

const AmazonSearchBar: React.FC<AmazonSearchBarProps> = ({
  placeholder = "Search MyMedDevices...",
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/(shop)/search-modal");
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Search products"
    >
      <View style={styles.iconWrapper}>
        <Icon name="search" size={18} color={colors.textSecondary} />
      </View>
      <Text style={styles.placeholderText} numberOfLines={1}>
        {placeholder}
      </Text>
      <View style={styles.scanIconWrapper}>
        <Icon name="scan" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

export default AmazonSearchBar;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 22,
      height: 42,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    iconWrapper: {
      marginRight: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    placeholderText: {
      flex: 1,
      fontSize: SIZES.fontSM,
      color: colors.textSecondary,
      fontWeight: "400",
    },
    scanIconWrapper: {
      marginLeft: 6,
      opacity: 0.7,
    },
  });
