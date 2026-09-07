import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";
import { OrderHistorySkeleton } from "@/features/user/components/AccountSkeleton";
import ErrorState from "@/components/common/ErrorState";
import { useAuth } from "@/context/AuthContext";
import { useMyAllOrders } from "@/features/order/services/query.service";
import OrderItem from "@/features/order/components/OrderItem";
import { Order } from "@/types/order";
import { openWhatsAppOrderHistory } from "@/utils/externalLinks";

export type OrderTabKey =
  | "all"
  | "pending"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "retry";

interface TabDef {
  key: OrderTabKey;
  label: string;
  statuses: string[];
}

const TABS: TabDef[] = [
  { key: "all", label: "All", statuses: [] },
  { key: "pending", label: "Pending", statuses: ["pending", "on-hold"] },
  { key: "processing", label: "Processing", statuses: ["processing", "paid"] },
  { key: "shipped", label: "In Transit", statuses: ["shipped", "in_transit", "transit"] },
  { key: "completed", label: "Delivered", statuses: ["completed", "delivered"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled", "refunded"] },
  { key: "retry", label: "Needs Payment", statuses: ["failed", "pending"] },
];

interface OrderHistoryScreenProps {
  initialTab?: OrderTabKey;
}

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({
  initialTab = "all",
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isAuthenticated, user: authUser } = useAuth();
  const params = useLocalSearchParams<{ tab?: string; status?: string }>();

  // Determine starting tab from prop or query param
  const startTab = useMemo<OrderTabKey>(() => {
    if (params.tab && TABS.some((t) => t.key === params.tab)) {
      return params.tab as OrderTabKey;
    }
    if (params.status && TABS.some((t) => t.key === params.status)) {
      return params.status as OrderTabKey;
    }
    return initialTab;
  }, [params.tab, params.status, initialTab]);

  const [activeTab, setActiveTab] = useState<OrderTabKey>(startTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync if prop/param changes
  useEffect(() => {
    if (startTab && startTab !== activeTab) {
      setActiveTab(startTab);
    }
  }, [startTab]);

  // If not authenticated, redirect to WhatsApp for order history
  useEffect(() => {
    if (!isAuthenticated) {
      openWhatsAppOrderHistory();
      router.back();
    }
  }, [isAuthenticated]);

  // Master unified cached orders query
  const {
    data: allOrders = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMyAllOrders(authUser?.id, { enabled: isAuthenticated && !!authUser });

  // Compute live counts per tab in memory (instant)
  const tabCounts = useMemo(() => {
    const counts: Record<OrderTabKey, number> = {
      all: allOrders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0,
      retry: 0,
    };

    allOrders.forEach((o) => {
      const s = (o.status || "").toLowerCase();
      if (s === "pending" || s === "on-hold") counts.pending++;
      if (s === "processing" || s === "paid") counts.processing++;
      if (s === "shipped" || s === "in_transit" || s === "transit") counts.shipped++;
      if (s === "completed" || s === "delivered") counts.completed++;
      if (s === "cancelled" || s === "refunded") counts.cancelled++;
      if (s === "failed" || s === "pending") counts.retry++;
    });

    return counts;
  }, [allOrders]);

  // Filter orders for active tab and search query (instantaneous, 0ms)
  const displayedOrders = useMemo(() => {
    let filtered = allOrders;

    const currentTabDef = TABS.find((t) => t.key === activeTab);
    if (currentTabDef && currentTabDef.statuses.length > 0) {
      filtered = filtered.filter((o) =>
        currentTabDef.statuses.includes((o.status || "").toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((o) => {
        const matchId = String(o.id).toLowerCase().includes(q);
        const matchCity = (o.shipping?.city || "").toLowerCase().includes(q);
        const matchItems = o.line_items?.some((it) =>
          (it.name || "").toLowerCase().includes(q)
        );
        return matchId || matchCity || matchItems;
      });
    }

    return filtered;
  }, [allOrders, activeTab, searchQuery]);

  const handleTabPress = (tabKey: OrderTabKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActiveTab(tabKey);
  };

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => <OrderItem item={item} />,
    []
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header with Safe Area */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top > 0 ? insets.top : 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(shop)"))}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              My Orders
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary || colors.text }]}>
              {allOrders.length} total orders recorded
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onRefresh}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isFetching ? (
              <Icon name="refresh" size={18} color={colors.primary} />
            ) : (
              <Icon name="refresh" size={18} color={colors.text} />
            )}
          </TouchableOpacity>
        </View>

        {/* Horizontal Instant-Switch Pill Tabs */}
        <View style={styles.tabScrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = tabCounts[tab.key];

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabPill,
                    isActive
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  onPress={() => handleTabPress(tab.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isActive ? "#FFFFFF" : colors.textSecondary || colors.text },
                    ]}
                  >
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.tabCountBadge,
                      {
                        backgroundColor: isActive
                          ? "rgba(255,255,255,0.25)"
                          : colors.primary + "14",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        { color: isActive ? "#FFFFFF" : colors.primary },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Main Content List */}
      {isLoading && allOrders.length === 0 ? (
        <View style={styles.loadingPadding}>
          <OrderHistorySkeleton count={4} />
        </View>
      ) : isError ? (
        <View style={styles.errorPadding}>
          <ErrorState
            title="Couldn't Load Orders"
            message={
              error?.message ??
              "Please check your internet connection and retry."
            }
            onRetry={refetch}
            retryText="Retry Loading"
          />
        </View>
      ) : (
        <FlatList
          data={displayedOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          windowSize={7}
          maxToRenderPerBatch={8}
          initialNumToRender={10}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            allOrders.length > 0 ? (
              <View style={styles.searchBarWrapper}>
                <View
                  style={[
                    styles.searchBar,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Icon name="search" size={16} color={colors.textSecondary || colors.text} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search by Order #, product name, city..."
                    placeholderTextColor={colors.textDisabled}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Icon name="x" size={16} color={colors.textSecondary || colors.text} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View
              style={[
                styles.emptyContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: colors.primary + "12" },
                ]}
              >
                <Icon name="package" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery ? "No matching orders found" : `No ${TABS.find((t) => t.key === activeTab)?.label} Orders`}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary || colors.text }]}>
                {searchQuery
                  ? `No orders matching "${searchQuery}".`
                  : activeTab === "all"
                  ? "You haven't placed any medical device orders yet."
                  : `You currently have no orders in ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} status.`}
              </Text>
              <TouchableOpacity
                style={[styles.shopButton, { backgroundColor: colors.primary }]}
                onPress={() => (searchQuery ? setSearchQuery("") : router.navigate("/(shop)"))}
                activeOpacity={0.85}
              >
                <Text style={styles.shopButtonText}>
                  {searchQuery ? "Clear Search Filter" : "Explore Medical Catalog"}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

export default OrderHistoryScreen;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerContainer: {
      borderBottomWidth: 1,
    },
    headerBar: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
    },
    headerBtn: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 19,
    },
    headerCenter: {
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: -0.2,
    },
    headerSubtitle: {
      fontSize: 11,
      opacity: 0.7,
      marginTop: 1,
    },
    tabScrollWrapper: {
      paddingBottom: 10,
      paddingTop: 4,
    },
    tabScrollContent: {
      paddingHorizontal: 14,
      gap: 8,
    },
    tabPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: "700",
    },
    tabCountBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 10,
      minWidth: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    tabCountText: {
      fontSize: 10,
      fontWeight: "800",
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: SIZES.spacingMD,
      paddingBottom: 40,
    },
    searchBarWrapper: {
      marginBottom: 12,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      height: 42,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      paddingVertical: 0,
    },
    loadingPadding: {
      padding: SIZES.spacingMD,
    },
    errorPadding: {
      flex: 1,
      padding: SIZES.spacingMD,
      justifyContent: "center",
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
      marginTop: 20,
      borderRadius: 16,
      borderWidth: 1,
    },
    emptyIconCircle: {
      width: 74,
      height: 74,
      borderRadius: 37,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 18,
      opacity: 0.75,
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    shopButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: SIZES.radius_medium,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    shopButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
