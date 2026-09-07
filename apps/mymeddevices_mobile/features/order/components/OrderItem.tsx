import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { toast } from "sonner-native";

import Icon from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";
import { Order } from "@/types/order";
import { Colors } from "@/types/app";
import { useRetryOrderPayment } from "../hooks/useRetryOrderPayment";
import { useCartStore } from "@/features/cart/stores/useCartStore";
import OrderDetailsModal from "./OrderDetailsModal";

import RetryPaymentModal from "./RetryPaymentModal";

type Props = {
  item: Order;
};

const getStatusTheme = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "completed":
    case "delivered":
      return {
        color: "#10B981",
        bg: "#10B98115",
        borderColor: "#10B98135",
        label: "Delivered",
        icon: "badge-check" as const,
      };
    case "processing":
    case "paid":
      return {
        color: "#8B5CF6",
        bg: "#8B5CF615",
        borderColor: "#8B5CF635",
        label: "Processing",
        icon: "package" as const,
      };
    case "shipped":
    case "in_transit":
    case "transit":
      return {
        color: "#3B82F6",
        bg: "#3B82F615",
        borderColor: "#3B82F635",
        label: "In Transit",
        icon: "truck" as const,
      };
    case "cancelled":
    case "refunded":
      return {
        color: "#EF4444",
        bg: "#EF444415",
        borderColor: "#EF444435",
        label: "Cancelled",
        icon: "x-circle" as const,
      };
    case "failed":
      return {
        color: "#EF4444",
        bg: "#EF444415",
        borderColor: "#EF444435",
        label: "Payment Failed",
        icon: "alert-circle" as const,
      };
    default:
      return {
        color: "#F59E0B",
        bg: "#F59E0B15",
        borderColor: "#F59E0B35",
        label: "Pending Payment",
        icon: "clock" as const,
      };
  }
};

const OrderItem: React.FC<Props> = ({ item }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const addToCart = useCartStore((state) => state.addToCart);

  const canRetryPayment = ["failed", "cancelled", "pending", "on-hold"].includes(
    (item.status || "").toLowerCase()
  );

  const lineItemsTotal =
    item?.line_items?.reduce(
      (acc, curr) => acc + curr.quantity * curr.price,
      0
    ) || 0;
  const displayTotal = item.total ? parseFloat(item.total) : lineItemsTotal;
  const statusTheme = getStatusTheme(item.status);

  const primaryItem = item.line_items?.[0];
  const otherItemsCount = (item.line_items?.length || 0) - 1;

  const handleQuickReorder = () => {
    if (!item.line_items || item.line_items.length === 0) {
      toast.error("No items to reorder");
      return;
    }

    item.line_items.forEach((lineItem) => {
      const mockProduct: any = {
        id: lineItem.product_id,
        name: lineItem.name,
        price: lineItem.price,
        stock_quantity: 99,
        sku: lineItem.sku || "",
        images: lineItem.image?.src ? [{ url: lineItem.image.src }] : [],
        image_url: lineItem.image?.src || "",
        categories: [],
      };
      for (let i = 0; i < lineItem.quantity; i++) {
        addToCart(mockProduct);
      }
    });

    toast.success(`Items from Order #${item.id} added to cart!`);
    router.navigate("/(shop)/cart");
  };

  const formattedDate = useMemo(() => {
    if (!item.date_created) return "Recent Order";
    const d = new Date(item.date_created);
    return d.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [item.date_created]);

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setShowDetailsModal(true)}
        activeOpacity={0.92}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.orderNumber}>Order #{item.id}</Text>
            <Text style={styles.orderDate}>{formattedDate}</Text>
          </View>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: statusTheme.bg,
                borderColor: statusTheme.borderColor,
              },
            ]}
          >
            <Icon name={statusTheme.icon} size={13} color={statusTheme.color} />
            <Text style={[styles.statusText, { color: statusTheme.color }]}>
              {statusTheme.label}
            </Text>
          </View>
        </View>

        {/* Product Items Summary Row */}
        <View style={styles.itemSummaryRow}>
          {/* Thumbnails list with fallback */}
          <View style={styles.thumbnailsContainer}>
            {item.line_items && item.line_items.length > 0 ? (
              item.line_items.slice(0, 3).map((lineItem, idx) => (
                <View
                  key={lineItem.id || idx}
                  style={[
                    styles.thumbnailBox,
                    idx > 0 && { marginLeft: -10 },
                    { zIndex: 10 - idx },
                  ]}
                >
                  {lineItem.image?.src ? (
                    <Image
                      source={lineItem.image.src}
                      style={styles.thumbnailImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.thumbnailFallback}>
                      <Icon name="package" size={18} color={colors.primary} />
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.thumbnailBox}>
                <View style={styles.thumbnailFallback}>
                  <Icon name="package" size={18} color={colors.primary} />
                </View>
              </View>
            )}

            {otherItemsCount > 2 && (
              <View style={[styles.thumbnailMore, { marginLeft: -10, zIndex: 5 }]}>
                <Text style={styles.thumbnailMoreText}>+{otherItemsCount - 2}</Text>
              </View>
            )}
          </View>

          {/* Item Description */}
          <View style={styles.itemDescCol}>
            <Text style={styles.primaryItemName} numberOfLines={1}>
              {primaryItem?.name || "Medical Equipment Shipment"}
            </Text>
            <Text style={styles.itemMetaText}>
              {item.line_items?.reduce((sum, i) => sum + i.quantity, 0) || 1} unit(s) •{" "}
              {otherItemsCount > 0
                ? `+ ${otherItemsCount} other item${otherItemsCount > 1 ? "s" : ""}`
                : "Single Item"}
            </Text>
          </View>
        </View>

        {/* Total & Destination Summary Block */}
        <View style={styles.totalRow}>
          <View style={styles.totalBlockLeft}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={[styles.totalAmount, { color: colors.text }]}>
              KES {displayTotal.toLocaleString()}
            </Text>
          </View>

          <View style={styles.totalDivider} />

          <View style={styles.destCol}>
            <Text style={styles.destLabel}>DESTINATION</Text>
            <View style={styles.destInline}>
              <Icon name="map-pin" size={11} color={colors.primary} />
              <Text style={styles.destValue} numberOfLines={1}>
                {item.shipping?.city || item.shipping?.address_1 || "Nairobi, KE"}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions Bar */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => setShowDetailsModal(true)}
            activeOpacity={0.8}
          >
            <Icon name="file-text" size={14} color={colors.text} />
            <Text style={styles.detailsBtnText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() =>
              router.push({
                pathname: "/order-tracking",
                params: { orderId: item.id.toString() },
              })
            }
            activeOpacity={0.8}
          >
            <Icon name="truck" size={14} color={colors.primary} />
            <Text style={styles.trackBtnText}>Track</Text>
          </TouchableOpacity>

          {canRetryPayment ? (
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowRetryModal(true)}
              activeOpacity={0.85}
            >
              <Icon name="credit-card" size={14} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>Pay Now</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.reorderQuickBtn}
              onPress={handleQuickReorder}
              activeOpacity={0.85}
            >
              <Icon name="refresh" size={14} color="#FFFFFF" />
              <Text style={styles.reorderQuickBtnText}>Reorder</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Full Order Details Modal */}
      <OrderDetailsModal
        order={item}
        visible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      {/* Retry Payment Modal */}
      <RetryPaymentModal
        order={item}
        visible={showRetryModal}
        onClose={() => setShowRetryModal(false)}
      />
    </>
  );
};

export default OrderItem;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + "60",
    },
    headerLeft: {
      flex: 1,
    },
    orderNumber: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.2,
    },
    orderDate: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 4,
      paddingHorizontal: 9,
      borderRadius: 12,
      borderWidth: 1,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "700",
    },
    itemSummaryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
    thumbnailsContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    thumbnailBox: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.card,
      overflow: "hidden",
    },
    thumbnailImage: {
      width: "100%",
      height: "100%",
    },
    thumbnailFallback: {
      width: "100%",
      height: "100%",
      backgroundColor: colors.primary + "12",
      alignItems: "center",
      justifyContent: "center",
    },
    thumbnailMore: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    thumbnailMoreText: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.textSecondary || colors.text,
    },
    itemDescCol: {
      flex: 1,
      gap: 2,
    },
    primaryItemName: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    itemMetaText: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border + "60",
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 10,
    },
    totalBlockLeft: {
      flex: 1,
    },
    totalLabel: {
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.textSecondary || colors.text,
      opacity: 0.65,
    },
    totalAmount: {
      fontSize: 14,
      fontWeight: "800",
      marginTop: 2,
    },
    totalDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
      marginHorizontal: 10,
    },
    destCol: {
      flex: 1,
      alignItems: "flex-end",
    },
    destLabel: {
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.textSecondary || colors.text,
      opacity: 0.65,
    },
    destInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginTop: 2,
    },
    destValue: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    actionsBar: {
      flexDirection: "row",
      gap: 8,
      paddingTop: 4,
    },
    detailsBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 9,
      borderRadius: 9,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailsBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    trackBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 9,
      borderRadius: 9,
      backgroundColor: colors.primary + "12",
      borderWidth: 1,
      borderColor: colors.primary + "25",
    },
    trackBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    retryBtn: {
      flex: 1.15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 9,
      borderRadius: 9,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
    },
    retryBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    reorderQuickBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 9,
      borderRadius: 9,
      backgroundColor: colors.primary,
    },
    reorderQuickBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
