import { StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import Icon from "@/components/common/Icon";
import { router } from "expo-router";
import { useTheme } from "@react-navigation/native";

const BackIcon = () => {
  const { colors, dark } = useTheme();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <TouchableOpacity onPress={handleBack} style={styles.container}>
      <Icon
        name={"chevron-left"}
        color={colors.text}
        size={32}
      />
    </TouchableOpacity>
  );
};

export default BackIcon;

const styles = StyleSheet.create({
  container: {},
});
