import React from "react";
import * as Updates from "expo-updates";
import { router } from "expo-router";
import { useTheme } from "@react-navigation/native";
import ListItem from "@/components/common/ListItem";
import Icon from "@/components/common/Icon";

export const AppUpdateTile: React.FC = () => {
  const { colors } = useTheme();
  const { isUpdateAvailable, isChecking, isDownloading } = Updates.useUpdates();

  const updateStatusLabel = isDownloading
    ? "Installing update..."
    : isChecking
    ? "Checking for updates..."
    : isUpdateAvailable
    ? "New update ready"
    : "You're running the latest version";

  const updateBorderColor = isUpdateAvailable ? colors.primary : undefined;

  return (
    <ListItem
      icon={<Icon name="smartphone" size={24} color={colors.primary} />}
      onPress={() => router.push("/(aux)/check-updates")}
      title="Check for updates"
      subtitle={updateStatusLabel}
      borderColor={updateBorderColor}
    />
  );
};

export default AppUpdateTile;
