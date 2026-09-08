import React, { useMemo, useState, useCallback, useLayoutEffect } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner-native";

import Icon, { IconName } from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import {
  useNotificationStore,
  NotificationType,
  NotificationCategory,
} from "@/stores/useNotificationStore";
import backendNotificationApi, {
  BackendNotification,
} from "@/services/backend-notification.api";
import { queryKeys } from "@/services/queryKeys";

type FilterTab = "all" | "unread" | "order" | "clinical";

interface CategoryMeta {
  icon: IconName;
  color: string;
  bg: string;
  label: string;
}

const CATEGORY_MAP: Record<NotificationCategory, CategoryMeta> = {
  order: {
    icon: "package",
    color: "#2563EB",
    bg: "rgba(37, 99, 235, 0.12)",
    label: "Order Update",
  },
  delivery: {
    icon: "truck",
    color: "#8B5CF6",
    bg: "rgba(139, 92, 246, 0.12)",
    label: "Dispatch Alert",
  },
  payment: {
    icon: "hand-coins",
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.12)",
    label: "Payment / M-Pesa",
  },
  clinical: {
    icon: "shield-check",
    color: "#059669",
    bg: "rgba(5, 150, 105, 0.12)",
    label: "Health Tip",
  },
  promo: {
    icon: "sparkles",
    color: "#EC4899",
    bg: "rgba(236, 72, 153, 0.12)",
    label: "Special Offer",
  },
  system: {
    icon: "bell",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    label: "Notification",
  },
};

function inferCategoryFromBackend(notif: BackendNotification): NotificationCategory {
  const t = (notif.notification_type || "").toLowerCase();
  const title = (notif.title || "").toLowerCase();
  const body = (notif.body || "").toLowerCase();
  const text = `${t} ${title} ${body}`;

  if (text.includes("mpesa") || text.includes("payment") || text.includes("paid") || text.includes("refund")) {
    return "payment";
  }
  if (text.includes("dispatch") || text.includes("driver") || text.includes("transit") || text.includes("shipped") || text.includes("delivered")) {
    return "delivery";
  }
  if (text.includes("order") || notif.data?.order_id || notif.data?.order_number) {
    return "order";
  }
  if (text.includes("safety") || text.includes("recall") || text.includes("regulatory") || text.includes("clinical") || text.includes("ppb")) {
    return "clinical";
  }
  if (text.includes("deal") || text.includes("discount") || text.includes("offer") || text.includes("price")) {
    return "promo";
  }
  return "system";
}

// ---------------------- SKELETON COMPONENT ----------------------
const NotificationSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={{ padding: SIZES.spacingMD, gap: 12 }}>
      {[1, 2, 3, 4, 5].map((key) => (
        <View
          key={key}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            padding: 14,
            backgroundColor: colors.card,
            borderRadius: SIZES.radius_medium,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 12,
          }}
        >
          <Skeleton width={44} height={44} borderRadius={12} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Skeleton width="45%" height={14} borderRadius={4} />
              <Skeleton width="22%" height={10} borderRadius={4} />
            </View>
            <Skeleton width="90%" height={12} borderRadius={4} />
            <Skeleton width="65%" height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
};

// ---------------------- EMPTY STATE COMPONENT ----------------------
const NotificationEmptyState: React.FC<{ filter: FilterTab; onResetFilter: () => void }> = ({
  filter,
  onResetFilter,
}) => {
  const { colors } = useTheme();

  const isFiltered = filter !== "all";

  return (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.iconCircle, { backgroundColor: colors.primary + "14" }]}>
        <Icon
          name={filter === "unread" ? "check-circle" : "bell"}
          size={36}
          color={colors.primary}
        />
      </View>

      <Text style={[emptyStyles.title, { color: colors.text }]}>
        {filter === "unread"
          ? "You're All Caught Up!"
          : filter === "order"
          ? "No Order Notifications"
          : filter === "clinical"
          ? "No Offers or Tips"
          : "No Notifications Yet"}
      </Text>

      <Text style={[emptyStyles.description, { color: colors.textSecondary || colors.text }]}>
        {filter === "unread"
          ? "There are no unread alerts right now. We will notify you when order statuses or special offers arrive."
          : filter === "order"
          ? "You don't have any order tracking alerts matching this view."
          : filter === "clinical"
          ? "No special offers, discounts, or health tips at the moment."
          : "Updates regarding your orders, delivery status, and payment receipts will appear here."}
      </Text>

      {isFiltered ? (
        <TouchableOpacity
          style={[emptyStyles.actionButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
          onPress={onResetFilter}
          activeOpacity={0.8}
        >
          <Icon name="refresh" size={14} color={colors.primary} />
          <Text style={[emptyStyles.actionButtonText, { color: colors.primary }]}>
            View All Notifications
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={emptyStyles.actionRow}>
          <TouchableOpacity
            style={[emptyStyles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/")}
            activeOpacity={0.8}
          >
            <Icon name="bag" size={16} color="#FFFFFF" />
            <Text style={emptyStyles.primaryBtnText}>Start Shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[emptyStyles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/notifications-settings" as any)}
            activeOpacity={0.8}
          >
            <Icon name="bell-ring" size={16} color={colors.text} />
            <Text style={[emptyStyles.secondaryBtnText, { color: colors.text }]}>
              Manage Alerts
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SIZES.spacingXL,
    paddingVertical: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    opacity: 0.75,
    marginBottom: 24,
    maxWidth: 320,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: SIZES.radius_medium,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: SIZES.radius_medium,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontWeight: "600",
    fontSize: 13,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: SIZES.radius_medium,
  },
  actionButtonText: {
    fontWeight: "600",
    fontSize: 13,
  },
});

// ---------------------- MAIN NOTIFICATIONS SCREEN ----------------------
const NotificationsScreen = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.bottom), [colors, insets.bottom]);
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const localNotifications = useNotificationStore((state) => state.notifications);
  const markAsReadLocal = useNotificationStore((state) => state.markAsRead);
  const markAllAsReadLocal = useNotificationStore((state) => state.markAllAsRead);
  const removeNotificationLocal = useNotificationStore((state) => state.removeNotification);
  const clearNotificationsLocal = useNotificationStore((state) => state.clearNotifications);

  // Set Navigation Header options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Notifications & Messages",
      headerBackTitle: "Back",
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/notifications-settings" as any)}
          style={{ padding: 8, marginRight: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Notification settings"
          activeOpacity={0.7}
        >
          <Icon name="bell-ring" size={20} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  // Fetch backend notifications if authenticated
  const {
    data: backendNotifications,
    isLoading: isBackendLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.notifications.lists(),
    queryFn: () => backendNotificationApi.list(false),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  });

  // Mark Read Mutation
  const markReadMutation = useMutation({
    mutationFn: (ids?: string[]) => backendNotificationApi.markRead(ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  // Merge Remote + Local Notifications
  const unifiedNotifications = useMemo<NotificationType[]>(() => {
    const map = new Map<string, NotificationType>();

    // 1. Add Local Store Notifications
    for (const item of localNotifications) {
      map.set(item.id, item);
    }

    // 2. Add Remote Backend Notifications (if any)
    if (backendNotifications && backendNotifications.length > 0) {
      for (const item of backendNotifications) {
        const cat = inferCategoryFromBackend(item);
        const timestamp = item.created_at ? new Date(item.created_at).getTime() : Date.now();
        map.set(item.id, {
          id: item.id,
          title: item.title || "Notification",
          body: item.body || "",
          category: cat,
          read: item.is_read,
          timestamp: isNaN(timestamp) ? Date.now() : timestamp,
          additionalData: item.data as any,
        });
      }
    }

    // Sort newest first
    return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [localNotifications, backendNotifications]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return unifiedNotifications.filter((n) => !n.read);
      case "order":
        return unifiedNotifications.filter(
          (n) => n.category === "order" || n.category === "delivery" || n.category === "payment"
        );
      case "clinical":
        return unifiedNotifications.filter(
          (n) => n.category === "clinical" || n.category === "promo"
        );
      case "all":
      default:
        return unifiedNotifications;
    }
  }, [unifiedNotifications, activeFilter]);

  const unreadCount = useMemo(
    () => unifiedNotifications.filter((n) => !n.read).length,
    [unifiedNotifications]
  );

  // Handle Mark All Read
  const handleMarkAllRead = useCallback(() => {
    markAllAsReadLocal();
    if (isAuthenticated) {
      markReadMutation.mutate(undefined);
    }
    toast.success("All notifications marked as read");
  }, [markAllAsReadLocal, isAuthenticated, markReadMutation]);

  // Handle Clear All
  const handleClearAll = useCallback(() => {
    clearNotificationsLocal();
    toast.info("Notifications cleared");
  }, [clearNotificationsLocal]);

  // Notification item click
  const handleNotificationPress = useCallback(
    (item: NotificationType) => {
      if (!item.read) {
        markAsReadLocal(item.id);
        if (isAuthenticated) {
          markReadMutation.mutate([item.id]);
        }
      }

      const screenName = item.additionalData?.screen_name;
      const orderId = item.additionalData?.order_id || item.additionalData?.order_number;

      if (typeof screenName === "string" && screenName.length > 0) {
        router.push(`/order-history/${screenName}` as any);
      } else if (orderId) {
        router.push("/order-history" as any);
      }
    },
    [markAsReadLocal, isAuthenticated, markReadMutation]
  );

  // Time formatter
  const formatTimestamp = (ms: number) => {
    try {
      return formatDistanceToNow(new Date(ms), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationType }) => {
    const category = item.category || "system";
    const meta = CATEGORY_MAP[category] || CATEGORY_MAP.system;

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.read && styles.notificationCardUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {/* Unread Indicator Bar */}
        {!item.read && <View style={styles.unreadIndicator} />}

        {/* Icon Pill */}
        <View style={[styles.categoryIconWrap, { backgroundColor: meta.bg }]}>
          <Icon name={meta.icon} size={20} color={meta.color} />
        </View>

        {/* Text Details */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.tagBadge}>
              <Text style={[styles.tagBadgeText, { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>
            <Text style={styles.timestampText}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>

          <Text
            style={[
              styles.notificationTitle,
              !item.read && styles.notificationTitleUnread,
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {item.body ? (
            <Text style={styles.notificationBody} numberOfLines={3}>
              {item.body}
            </Text>
          ) : null}

          {/* Action Row if Order Data exists */}
          {item.additionalData?.order_id || item.additionalData?.order_number ? (
            <View style={styles.orderPillRow}>
              <Icon name="receipt" size={12} color={colors.primary} />
              <Text style={styles.orderPillText}>
                Order #{item.additionalData.order_number || item.additionalData.order_id}
              </Text>
              <Icon name="chevron-right" size={12} color={colors.primary} />
            </View>
          ) : null}
        </View>

        {/* Dismiss single button */}
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => {
            removeNotificationLocal(item.id);
            toast.success("Notification dismissed");
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss notification"
        >
          <Icon name="close" size={14} color={colors.textSecondary || colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const isLoading = isAuthenticated && isBackendLoading && unifiedNotifications.length === 0;

  return (
    <View style={styles.container}>
      {/* Filter Tabs Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "all" && styles.filterTabActive]}
          onPress={() => setActiveFilter("all")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "all" && styles.filterTabTextActive,
            ]}
          >
            All
          </Text>
          {unifiedNotifications.length > 0 && (
            <View
              style={[
                styles.filterCountBadge,
                activeFilter === "all" && styles.filterCountBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  activeFilter === "all" && styles.filterCountTextActive,
                ]}
              >
                {unifiedNotifications.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "unread" && styles.filterTabActive]}
          onPress={() => setActiveFilter("unread")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "unread" && styles.filterTabTextActive,
            ]}
          >
            Unread
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "order" && styles.filterTabActive]}
          onPress={() => setActiveFilter("order")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "order" && styles.filterTabTextActive,
            ]}
          >
            Orders & Transit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeFilter === "clinical" && styles.filterTabActive]}
          onPress={() => setActiveFilter("clinical")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "clinical" && styles.filterTabTextActive,
            ]}
          >
            Offers & Tips
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Sub-Header */}
      {unifiedNotifications.length > 0 && (
        <View style={styles.subActionBar}>
          <Text style={styles.subActionCount}>
            {filteredNotifications.length}{" "}
            {filteredNotifications.length === 1 ? "notification" : "notifications"}
          </Text>

          <View style={styles.subActionButtons}>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllRead}
                style={styles.actionBtn}
                activeOpacity={0.7}
              >
                <Icon name="check-circle" size={14} color={colors.primary} />
                <Text style={styles.actionBtnText}>Mark all as read</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleClearAll}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              <Icon name="trash" size={14} color={colors.textSecondary || colors.text} />
              <Text style={styles.actionBtnSecondaryText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content */}
      {isLoading ? (
        <NotificationSkeleton />
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          contentContainerStyle={[
            styles.listContent,
            filteredNotifications.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                if (isAuthenticated) {
                  void refetch();
                }
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <NotificationEmptyState
              filter={activeFilter}
              onResetFilter={() => setActiveFilter("all")}
            />
          }
        />
      )}
    </View>
  );
};

export default NotificationsScreen;

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    filterBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      paddingHorizontal: SIZES.spacingMD,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 8,
    },
    filterTab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterTabText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary || colors.text,
    },
    filterTabTextActive: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    filterCountBadge: {
      backgroundColor: colors.border,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 10,
    },
    filterCountBadgeActive: {
      backgroundColor: "rgba(255, 255, 255, 0.25)",
    },
    filterCountText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.text,
    },
    filterCountTextActive: {
      color: "#FFFFFF",
    },
    unreadCountBadge: {
      backgroundColor: "#EF4444",
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 10,
    },
    unreadCountText: {
      fontSize: 10,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    subActionBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SIZES.spacingMD,
      paddingVertical: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    subActionCount: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary || colors.text,
    },
    subActionButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    actionBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    actionBtnSecondaryText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textSecondary || colors.text,
    },
    listContent: {
      padding: SIZES.spacingMD,
      gap: 10,
      paddingBottom: Math.max(bottomInset, 16) + 24,
    },
    listContentEmpty: {
      flexGrow: 1,
    },
    notificationCard: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
      gap: 12,
      position: "relative",
      overflow: "hidden",
    },
    notificationCardUnread: {
      borderColor: colors.primary + "44",
      backgroundColor: Platform.select({
        ios: colors.card,
        android: colors.card,
      }),
    },
    unreadIndicator: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: colors.primary,
    },
    categoryIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    cardContent: {
      flex: 1,
      gap: 4,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    tagBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    tagBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    timestampText: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.6,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 19,
    },
    notificationTitleUnread: {
      fontWeight: "700",
      color: colors.text,
    },
    notificationBody: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      lineHeight: 17,
      opacity: 0.85,
    },
    orderPillRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
      backgroundColor: "rgba(255, 111, 97, 0.08)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 4,
    },
    orderPillText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.primary,
    },
    dismissBtn: {
      padding: 4,
      alignSelf: "flex-start",
      opacity: 0.6,
    },
  });
