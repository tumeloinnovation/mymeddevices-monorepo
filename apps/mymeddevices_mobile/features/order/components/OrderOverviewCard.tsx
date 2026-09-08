import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import { Order } from "@/types/order";

interface OrderOverviewCardProps {
  order: Order | null;
  trackedOrderNumber: string;
  statusLabel: string;
  statusBadgeColor: string;
  statusBadgeBg: string;
  estimatedArrival: string;
  destinationCity: string;
  canPay: boolean;
  isDelivered: boolean;
  onPayNow: () => void;
  onViewDetails: () => void;
  onShare: () => void;
}

export const OrderOverviewCard: React.FC<OrderOverviewCardProps> = ({
  order,
  trackedOrderNumber,
  statusLabel,
  statusBadgeColor,
  statusBadgeBg,
  estimatedArrival,
  destinationCity,
  canPay,
  isDelivered,
  onPayNow,
  onViewDetails,
  onShare,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.overviewCard}>
      <View style={styles.overviewHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.consignmentNumber}>Order #{trackedOrderNumber}</Text>
          <Text style={styles.carrierName}>Delivery: Doorstep Delivery</Text>
        </View>
        <View style={[styles.livePill, { backgroundColor: statusBadgeBg }]}>
          <View style={[styles.pulsingDot, { backgroundColor: statusBadgeColor }]} />
          <Text style={[styles.livePillText, { color: statusBadgeColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Delivery Window & Destination Matrix */}
      <View style={styles.etaContainer}>
        <View style={styles.etaItem}>
          <View style={styles.etaLabelRow}>
            <Icon name="clock" size={12} color={colors.textSecondary || colors.text} />
            <Text style={styles.etaLabel}>Delivery Window</Text>
          </View>
          <Text style={styles.etaValue}>{estimatedArrival}</Text>
        </View>
        <View style={styles.etaDivider} />
        <View style={styles.etaItem}>
          <View style={styles.etaLabelRow}>
            <Icon name="map-pin" size={12} color={colors.primary} />
            <Text style={styles.etaLabel}>Destination</Text>
          </View>
          <Text style={styles.etaValue} numberOfLines={1}>
            {destinationCity}
          </Text>
        </View>
      </View>

      {/* Financial & Payment Highlight Strip */}
      {order && order.total && parseFloat(order.total) > 0 ? (
        <View style={styles.orderSummaryStrip}>
          <View style={styles.orderSummaryCol}>
            <Text style={styles.orderSummaryLabel}>ORDER TOTAL</Text>
            <Text style={styles.orderSummaryAmount}>
              KES {parseFloat(order.total).toLocaleString()}
            </Text>
          </View>
          <View
            style={[
              styles.paymentStatusBadge,
              {
                backgroundColor: canPay ? "#F59E0B18" : "#10B98118",
                borderColor: canPay ? "#F59E0B40" : "#10B98140",
              },
            ]}
          >
            <Icon
              name={canPay ? "alert-circle" : "badge-check"}
              size={12}
              color={canPay ? "#F59E0B" : "#10B981"}
            />
            <Text
              style={[
                styles.paymentStatusBadgeText,
                { color: canPay ? "#D97706" : "#059669" },
              ]}
            >
              {canPay ? "Payment Due" : "Paid & Verified"}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Pay Now Callout Banner (when payment is required) */}
      {canPay && (
        <View style={styles.paymentPromptBanner}>
          <View style={styles.paymentPromptIconBox}>
            <Icon name="credit-card" size={18} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentPromptTitle}>Complete Payment</Text>
            <Text style={styles.paymentPromptSubtitle}>
              Pay via M-Pesa STK push to clear dispatch immediately
            </Text>
          </View>
        </View>
      )}

      {/* Overview Actions */}
      <View style={styles.overviewActions}>
        {canPay ? (
          <TouchableOpacity
            style={styles.payNowBtn}
            onPress={onPayNow}
            activeOpacity={0.85}
          >
            <Icon name="credit-card" size={16} color="#FFFFFF" />
            <Text style={styles.payNowBtnText}>
              {order?.total && parseFloat(order.total) > 0
                ? `Pay KES ${parseFloat(order.total).toLocaleString()} Now`
                : "Pay Now"}
            </Text>
            <Icon name="chevron-right" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.viewDetailsBtn}
            onPress={onViewDetails}
            activeOpacity={0.8}
          >
            <Icon name="receipt" size={15} color={colors.primary} />
            <Text style={styles.viewDetailsBtnText}>View Receipt & Items</Text>
          </TouchableOpacity>
        )}

        {isDelivered && (
          <TouchableOpacity
            style={styles.detailsOutlineBtn}
            onPress={onViewDetails}
            activeOpacity={0.8}
          >
            <Icon name="file-text" size={14} color={colors.primary} />
            <Text style={styles.detailsOutlineBtnText}>Invoice</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.shareIconBtn}
          onPress={onShare}
          activeOpacity={0.8}
          accessibilityLabel="Share order status"
        >
          <Icon name="share" size={15} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default React.memo(OrderOverviewCard);

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    overviewCard: {
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
    overviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    consignmentNumber: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    carrierName: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    livePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    pulsingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    livePillText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    etaContainer: {
      flexDirection: "row",
      paddingVertical: 12,
    },
    etaItem: {
      flex: 1,
    },
    etaLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    etaLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      fontWeight: "600",
    },
    etaValue: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginTop: 4,
    },
    etaDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginHorizontal: 12,
    },
    orderSummaryStrip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.background,
      borderRadius: SIZES.radius_medium,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 4,
    },
    orderSummaryCol: {
      gap: 2,
    },
    orderSummaryLabel: {
      fontSize: 9,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      fontWeight: "700",
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
    },
    orderSummaryAmount: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
    },
    paymentStatusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 5,
      paddingHorizontal: 9,
      borderRadius: 12,
      borderWidth: 1,
    },
    paymentStatusBadgeText: {
      fontSize: 11,
      fontWeight: "700",
    },
    paymentPromptBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#FEF3C7",
      borderWidth: 1,
      borderColor: "#FCD34D",
      borderRadius: SIZES.radius_medium,
      padding: 10,
      marginTop: 4,
    },
    paymentPromptIconBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#FDE68A",
      alignItems: "center",
      justifyContent: "center",
    },
    paymentPromptTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: "#92400E",
    },
    paymentPromptSubtitle: {
      fontSize: 10.5,
      color: "#B45309",
      marginTop: 1,
      lineHeight: 14,
    },
    overviewActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    payNowBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: SIZES.radius_medium,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    payNowBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    viewDetailsBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: SIZES.radius_medium,
      backgroundColor: colors.primary + "12",
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    viewDetailsBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    detailsOutlineBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: SIZES.radius_medium,
      backgroundColor: colors.primary + "12",
      borderWidth: 1,
      borderColor: colors.primary + "25",
    },
    detailsOutlineBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    shareIconBtn: {
      width: 42,
      height: 42,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
  });
