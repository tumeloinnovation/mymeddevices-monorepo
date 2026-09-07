import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "@react-navigation/native";

import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";
import { OrderHistorySkeleton } from "@/features/user/components/AccountSkeleton";
import ErrorState from "@/components/common/ErrorState";
import { useAuth } from "@/context/AuthContext";
import { useHistoryOrder } from "@/features/order/services/query.service";
import OrderItem from "@/features/order/components/OrderItem";
import { Order } from "@/types/order";
import { openWhatsAppOrderHistory } from "@/utils/externalLinks";

const MemoizedOrderItem = memo(OrderItem);

export interface OrderHistoryListProps {
  status: string;
  title: string;
  subtitle: string;
  emptyTitle?: string;
  emptyDesc?: string;
}

export const OrderHistoryList: React.FC<OrderHistoryListProps> = ({
  status,
  title,
  subtitle,
  emptyTitle = "No orders in this category",
  emptyDesc = "When you place orders matching this status, they will appear here.",
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { isAuthenticated, user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // If not authenticated, redirect to WhatsApp for order history
  useEffect(() => {
    if (!isAuthenticated) {
      openWhatsAppOrderHistory();
      router.back();
    }
  }, [isAuthenticated]);

  const fetchOrders = useHistoryOrder(
    {
      customer: authUser?.id,
      orderby: "date",
      order: "desc",
      status,
      per_page: 30,
      page: 1,
    },
    { enabled: isAuthenticated && !!authUser }
  );

  const remoteOrders = fetchOrders.data ?? [];

  // Filter orders by search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return remoteOrders;
    const q = searchQuery.toLowerCase().trim();
    return remoteOrders.filter((o) => {
      const matchId = String(o.id).toLowerCase().includes(q);
      const matchCity = (o.shipping?.city || "").toLowerCase().includes(q);
      const matchItems = o.line_items?.some((it) =>
        (it.name || "").toLowerCase().includes(q)
      );
      return matchId || matchCity || matchItems;
    });
  }, [remoteOrders, searchQuery]);

  const onRefresh = useCallback(async () => {
    await fetchOrders.refetch();
  }, [fetchOrders]);

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => <MemoizedOrderItem item={item} />,
    []
  );

  if (!isAuthenticated) {
    return null;
  }

  if (fetchOrders.isPending) {
    return (
      <View style={styles.container}>
        <View style={styles.headerArea}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
        <OrderHistorySkeleton count={4} />
      </View>
    );
  }

  if (fetchOrders.isError) {
    return (
      <View style={styles.container}>
        <ErrorState
          title="Couldn't Load Orders"
          message={
            fetchOrders.error?.message ??
            "Please check your connection and tap retry to load your orders."
          }
          onRetry={fetchOrders.refetch}
          retryText="Retry Loading Orders"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        windowSize={5}
        maxToRenderPerBatch={5}
        initialNumToRender={10}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={fetchOrders.isFetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.sectionSubtitle}>{subtitle}</Text>
              </View>
              {remoteOrders.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {remoteOrders.length} {remoteOrders.length === 1 ? "order" : "orders"}
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Search Bar */}
            {remoteOrders.length > 1 && (
              <View style={styles.searchBar}>
                <Icon name="search" size={16} color={colors.textSecondary || colors.text} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Filter by Order #, item or city..."
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
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="package" size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No matching orders found" : emptyTitle}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No orders matching "${searchQuery}" in this tab.`
                : emptyDesc}
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => (searchQuery ? setSearchQuery("") : router.navigate("/(shop)"))}
              activeOpacity={0.85}
            >
              <Text style={styles.shopButtonText}>
                {searchQuery ? "Clear Filter" : "Explore Medical Catalog"}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

export default OrderHistoryList;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: SIZES.spacingMD,
      paddingBottom: 36,
    },
    headerArea: {
      marginBottom: 14,
      gap: 10,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.2,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    countBadge: {
      backgroundColor: colors.primary + "15",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      height: 40,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      paddingVertical: 0,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
      marginTop: 20,
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyIconCircle: {
      width: 74,
      height: 74,
      borderRadius: 37,
      backgroundColor: colors.primary + "12",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 18,
      opacity: 0.75,
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    shopButton: {
      backgroundColor: colors.primary,
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
