import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/components/common/Icon";
import { formatCurrency } from "@/utils/formatTime";

interface CheckoutSummaryPanelProps {
  total?: number;
  itemCount?: number;
  onCheckout: () => void;
  isPending: boolean;
  disabled: boolean;
  isShippingLoading?: boolean;
}

const CheckoutSummaryPanel: React.FC<CheckoutSummaryPanelProps> = ({
  total = 0,
  itemCount = 0,
  onCheckout,
  isPending,
  disabled,
  isShippingLoading = false,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const getButtonText = () => {
    if (isPending) return "Placing Order...";
    if (isShippingLoading) return "Calculating...";
    return "Place Order";
  };

  return (
    <View
      style={[
        styles.summaryPanel,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Total Info */}
        <View style={styles.totalInfo}>
          <View style={styles.securityRow}>
            <Icon name="shield-check" size={13} color="#10B981" />
            <Text style={styles.securityText}>Secure Checkout</Text>
          </View>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
            Total Payable {itemCount > 0 ? `(${itemCount} items)` : ""}
          </Text>
          <Text style={[styles.totalAmount, { color: colors.text }]}>
            {formatCurrency(total)}
          </Text>
        </View>

        {/* Right CTA Button */}
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            {
              backgroundColor: disabled || isPending ? colors.border : colors.primary,
            },
          ]}
          onPress={onCheckout}
          disabled={disabled || isPending}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text
                style={[
                  styles.checkoutButtonText,
                  { color: disabled ? colors.textSecondary : "#FFFFFF" },
                ]}
              >
                {getButtonText()}
              </Text>
              {!disabled && <Icon name="chevron-right" size={16} color="#FFFFFF" />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  totalInfo: {
    flex: 1,
    gap: 1,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  securityText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 19,
    fontWeight: "800",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    gap: 6,
    minWidth: 150,
  },
  checkoutButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});

export default CheckoutSummaryPanel;
