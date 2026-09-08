import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import Icon from "@/components/common/Icon";
import { useNotificationStore } from "@/stores/useNotificationStore";
import backendNotificationApi from "@/services/backend-notification.api";
import { queryKeys } from "@/services/queryKeys";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/types/app";

const NotificationIcon = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { isAuthenticated } = useAuth();
  const localNotifications = useNotificationStore((state) => state.notifications);

  const localUnreadCount = localNotifications.filter((n) => !n.read).length;

  const { data: remoteUnreadCount } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => backendNotificationApi.unreadCount(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Poll every minute
  });

  const displayCount =
    typeof remoteUnreadCount === "number" && remoteUnreadCount > 0
      ? remoteUnreadCount
      : localUnreadCount;

  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={() => router.push("/notifications" as any)}
      accessibilityRole="button"
      accessibilityLabel={`Notifications, ${displayCount} unread`}
      activeOpacity={0.7}
    >
      <Icon name="bell" size={20} color={colors.text} />
      {displayCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {displayCount > 99 ? "99+" : displayCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default NotificationIcon;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    actionButton: {
      padding: 10,
      marginHorizontal: 4,
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: 5,
      right: 4,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: colors.card,
    },
    badgeText: {
      fontWeight: "800",
      fontSize: 9,
      color: "#FFFFFF",
      textAlign: "center",
      lineHeight: 11,
    },
  });
