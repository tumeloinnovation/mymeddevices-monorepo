import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { InfoFeeType } from "@/features/checkout/components/CostBreakdownSheet";
import { PACKAGING_FEE, SERVICES_FEE } from "@/services/order.service";

interface CheckoutCostBreakdownCardProps {
  subtotal: number;
  vatAmount: number;
  shipping: number;
  isShippingLoading: boolean;
  effectiveRegion?: string;
  couponDiscount: number;
  couponCode?: string;
  pointsDiscount: number;
  userEnteredPoints: number;
  finalTotal: number;
  onOpenFeeInfo: (type: InfoFeeType) => void;
}

export const CheckoutCostBreakdownCard: React.FC<CheckoutCostBreakdownCardProps> = ({
  subtotal,
  vatAmount,
  shipping,
  isShippingLoading,
  effectiveRegion,
  couponDiscount,
  couponCode,
  pointsDiscount,
  userEnteredPoints,
  finalTotal,
  onOpenFeeInfo,
}) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  return (
    <View style={styles.card}>
      <Text style={styles.summaryCardTitle}>Order Cost Breakdown</Text>

      {/* Subtotal */}
      <View style={styles.summaryLineRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>KES {subtotal.toLocaleString()}</Text>
      </View>

      {/* 16% VAT */}
      <View style={styles.summaryLineRow}>
        <TouchableOpacity
          style={styles.feeWithTooltip}
          onPress={() => onOpenFeeInfo("vat")}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.summaryLabel}>VAT (16% Standard Rate)</Text>
          <Icon name="info" size={12} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.summaryValue}>KES {vatAmount.toLocaleString()}</Text>
      </View>

      {/* Safe Packaging Fee */}
      <View style={styles.summaryLineRow}>
        <TouchableOpacity
          style={styles.feeWithTooltip}
          onPress={() => onOpenFeeInfo("packaging")}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.summaryLabel}>Safe Packaging Fee</Text>
          <Icon name="info" size={12} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.summaryValue}>KES {PACKAGING_FEE.toLocaleString()}</Text>
      </View>

      {/* Handling & Safety Fee */}
      <View style={styles.summaryLineRow}>
        <TouchableOpacity
          style={styles.feeWithTooltip}
          onPress={() => onOpenFeeInfo("service")}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.summaryLabel}>Handling & Safety Check</Text>
          <Icon name="info" size={12} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.summaryValue}>KES {SERVICES_FEE.toLocaleString()}</Text>
      </View>

      {/* Delivery Fee */}
      <View style={styles.summaryLineRow}>
        <TouchableOpacity
          style={styles.feeWithTooltip}
          onPress={() => onOpenFeeInfo("shipping")}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.summaryLabel}>
            Delivery Fee {effectiveRegion ? `(${effectiveRegion})` : ""}
          </Text>
          {isShippingLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 4 }} />
          ) : (
            <Icon name="info" size={12} color={colors.primary} />
          )}
        </TouchableOpacity>
        <Text style={styles.summaryValue}>
          {shipping === 0 ? "Calculating..." : `KES ${shipping.toLocaleString()}`}
        </Text>
      </View>

      {/* Applied Coupon Discount */}
      {couponDiscount > 0 && (
        <View style={styles.summaryLineRow}>
          <Text style={styles.summaryLabel}>Coupon ({couponCode})</Text>
          <Text style={styles.discountValue}>
            -KES {couponDiscount.toLocaleString()}
          </Text>
        </View>
      )}

      {/* Points Redemption Discount */}
      {pointsDiscount > 0 && (
        <View style={styles.summaryLineRow}>
          <Text style={styles.summaryLabel}>Points ({userEnteredPoints.toLocaleString()} pts)</Text>
          <Text style={styles.discountValue}>
            -KES {pointsDiscount.toLocaleString()}
          </Text>
        </View>
      )}

      {/* Divider */}
      <View style={styles.summaryDivider} />

      {/* Grand Total */}
      <View style={styles.summaryTotalRow}>
        <View>
          <Text style={styles.totalTitle}>Total Payable</Text>
          <Text style={styles.totalInclusive}>Includes all taxes & delivery fees</Text>
        </View>
        <Text style={styles.totalAmount}>
          KES {finalTotal.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

export default React.memo(CheckoutCostBreakdownCard);

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      gap: 8,
    },
    summaryCardTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.2,
      marginBottom: 1,
    },
    summaryLineRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 3,
    },
    feeWithTooltip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary || "#64748B",
    },
    summaryValue: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
    discountValue: {
      fontSize: 12,
      fontWeight: "700",
      color: "#10B981",
    },
    summaryDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: dark ? "#334155" : "#E2E8F0",
      marginVertical: 4,
    },
    summaryTotalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 1,
    },
    totalTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.text,
    },
    totalInclusive: {
      fontSize: 10,
      color: colors.textSecondary || "#64748B",
      marginTop: 1,
    },
    totalAmount: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
    },
  });
