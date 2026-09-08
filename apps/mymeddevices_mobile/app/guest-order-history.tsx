import React, { useLayoutEffect, useState } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";

import Icon from "@/components/common/Icon";
import { useGuestOrderHistory } from "@/features/order/services/query.service";
import { Order } from "@/types/order";
import { SIZES } from "@/styles/sizes";
import { useUserStore } from "@/features/user/stores/useUserStore";
import { Colors } from "@/types/app";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openWhatsAppOrderHistory } from "@/utils/externalLinks";

const getStatusBadge = (status: string) => {
  const s = status.toLowerCase();
  if (s === "completed" || s === "delivered") return { color: "#10B981", bg: "#10B98118", label: "Completed" };
  if (s === "processing" || s === "paid") return { color: "#3B82F6", bg: "#3B82F618", label: "Processing" };
  if (s === "shipped") return { color: "#8B5CF6", bg: "#8B5CF618", label: "Shipped" };
  if (s === "pending" || s === "on-hold") return { color: "#F59E0B", bg: "#F59E0B18", label: "Pending" };
  return { color: "#EF4444", bg: "#EF444418", label: status.toUpperCase() };
};

const GuestOrderHistoryPage = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);
  const navigation = useNavigation();
  const { guest, setGuest } = useUserStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Guest Orders",
      headerBackTitle: "Back",
      headerShown: true,
    });
  }, [navigation]);

  const [phoneInput, setPhoneInput] = useState(guest?.phone_number || "");
  const [activePhone, setActivePhone] = useState(guest?.phone_number || "");

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useGuestOrderHistory({ phone: activePhone });

  const handleSearch = () => {
    const trimmed = phoneInput.trim();
    if (trimmed) {
      setActivePhone(trimmed);
      setGuest({
        first_name: guest?.first_name || "Guest",
        last_name: guest?.last_name || "User",
        phone_number: trimmed,
      });
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const badge = getStatusBadge(item.status);
    const dateFormatted = item.date_created
      ? new Date(item.date_created).toLocaleDateString("en-KE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Recent";

    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>Order #{item.id}</Text>
            <Text style={styles.orderDate}>{dateFormatted}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: badge.color }]} />
            <Text style={[styles.statusLabel, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Line items preview */}
        {item.line_items && item.line_items.length > 0 && (
          <View style={styles.lineItemsContainer}>
            {item.line_items.map((line, idx) => (
              <View key={idx} style={styles.lineItemRow}>
                <Icon name="package" size={14} color={colors.primary} />
                <Text style={styles.lineItemName} numberOfLines={1}>
                  {line.name}
                </Text>
                <Text style={styles.lineItemQty}>x{line.quantity}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>KSh {Number(item.total || 0).toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => router.push({ pathname: "/order-tracking", params: { orderId: String(item.id) } })}
            activeOpacity={0.8}
          >
            <Icon name="truck" size={14} color="#FFFFFF" />
            <Text style={styles.trackBtnText}>Track Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header Banner */}
      <View style={styles.lookupCard}>
        <View style={styles.lookupHeader}>
          <View style={[styles.iconPill, { backgroundColor: colors.primary + "14" }]}>
            <Icon name="receipt" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lookupTitle}>Guest Order Lookup</Text>
            <Text style={styles.lookupSubtitle}>Enter the M-Pesa phone number used at checkout</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.inputWrapper}>
            <Icon name="phone" size={16} color={colors.textSecondary || colors.text} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 0712345678"
              placeholderTextColor={colors.textDisabled}
              keyboardType="phone-pad"
              value={phoneInput}
              onChangeText={setPhoneInput}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.8}>
            <Text style={styles.searchButtonText}>Find</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Content */}
      <View style={styles.bodyWrapper}>
        {!activePhone ? (
          <ScrollView
            style={styles.scrollFlex}
            contentContainerStyle={styles.centerContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.emptyCard}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + "12" }]}>
                <Icon name="bag" size={36} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Track Your Guest Orders</Text>
              <Text style={styles.emptySubtitle}>
                Look up order confirmations, shipment updates, and item receipts without signing in.
              </Text>

              <View style={styles.actionButtonsCol}>
                <TouchableOpacity style={styles.whatsappHelpBtn} onPress={openWhatsAppOrderHistory} activeOpacity={0.8}>
                  <Icon name="whatsapp" size={16} color="#FFFFFF" />
                  <Text style={styles.whatsappHelpBtnText}>Need Help? WhatsApp Support</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.loginCTA} onPress={() => router.push("/(auth)/login")} activeOpacity={0.7}>
                  <Text style={styles.loginCTAText}>Have an account? Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : isLoading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Retrieving your guest orders...</Text>
          </View>
        ) : isError ? (
          <View style={styles.centerContainer}>
            <Icon name="alert" size={40} color="#EF4444" />
            <Text style={styles.errorTitle}>Unable to Load Orders</Text>
            <Text style={styles.errorDesc}>Could not reach the server. Please check connection.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : orders && orders.length === 0 ? (
          <ScrollView
            style={styles.scrollFlex}
            contentContainerStyle={styles.centerContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.emptyCard}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.border }]}>
                <Icon name="package" size={36} color={colors.textSecondary || colors.text} />
              </View>
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySubtitle}>
                We couldn't find any orders placed under "{activePhone}". Check your phone number or contact support.
              </Text>
              <TouchableOpacity style={styles.whatsappHelpBtn} onPress={openWhatsAppOrderHistory} activeOpacity={0.8}>
                <Icon name="whatsapp" size={16} color="#FFFFFF" />
                <Text style={styles.whatsappHelpBtnText}>Check via WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
          />
        )}
      </View>
    </View>
  );
};

export default GuestOrderHistoryPage;

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    lookupCard: {
      backgroundColor: colors.card,
      padding: SIZES.spacingMD,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    lookupHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    iconPill: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    lookupTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    lookupSubtitle: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 1,
    },
    searchRow: {
      flexDirection: "row",
      gap: 8,
    },
    inputWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.background,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      height: 42,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 0,
    },
    searchButton: {
      backgroundColor: colors.primary,
      borderRadius: SIZES.radius_medium,
      paddingHorizontal: 18,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
    },
    searchButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 13,
    },
    listContainer: {
      padding: SIZES.spacingMD,
      gap: 12,
      paddingBottom: Math.max(bottomInset, 16) + 24,
    },
    orderCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    orderNumber: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    orderDate: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.65,
      marginTop: 2,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusLabel: {
      fontSize: 11,
      fontWeight: "700",
    },
    lineItemsContainer: {
      paddingVertical: 10,
      gap: 6,
    },
    lineItemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    lineItemName: {
      flex: 1,
      fontSize: 12,
      color: colors.text,
      fontWeight: "500",
    },
    lineItemQty: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      fontWeight: "600",
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalLabel: {
      fontSize: 10,
      color: colors.textSecondary || colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      opacity: 0.7,
    },
    totalAmount: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
      marginTop: 2,
    },
    trackBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: SIZES.radius_small,
    },
    trackBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },
    bodyWrapper: {
      flex: 1,
    },
    scrollFlex: {
      flex: 1,
    },
    centerContainer: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: SIZES.spacingMD,
    },
    loadingText: {
      fontSize: 13,
      color: colors.textSecondary || colors.text,
    },
    errorTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginTop: 10,
    },
    errorDesc: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      marginTop: 4,
      marginBottom: 14,
    },
    retryBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: SIZES.radius_small,
    },
    retryBtnText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 12,
    },
    emptyCard: {
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 6,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 18,
      opacity: 0.75,
      marginBottom: 20,
    },
    actionButtonsCol: {
      width: "100%",
      gap: 10,
    },
    whatsappHelpBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#25D366",
      paddingVertical: 12,
      borderRadius: SIZES.radius_medium,
    },
    whatsappHelpBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
    loginCTA: {
      paddingVertical: 10,
      alignItems: "center",
    },
    loginCTAText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
  });
