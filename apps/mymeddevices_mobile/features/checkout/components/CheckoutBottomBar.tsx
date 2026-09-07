import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";

interface CheckoutBottomBarProps {
  finalTotal: number;
  isFormComplete: boolean;
  isPending: boolean;
  bottomInset: number;
  onPlaceOrder: () => void;
}

export const CheckoutBottomBar: React.FC<CheckoutBottomBarProps> = ({
  finalTotal,
  isFormComplete,
  isPending,
  bottomInset,
  onPlaceOrder,
}) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark, bottomInset);

  return (
    <View style={styles.bottomDockedBar}>
      <View style={styles.bottomTotalBlock}>
        <Text style={styles.bottomTotalLabel}>Total</Text>
        <Text style={styles.bottomTotalValue}>
          KES {finalTotal.toLocaleString()}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.placeOrderBtn,
          (!isFormComplete || isPending) && styles.placeOrderBtnDisabled,
        ]}
        onPress={onPlaceOrder}
        disabled={!isFormComplete || isPending}
        activeOpacity={0.88}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={styles.placeOrderBtnContent}>
            <Text style={styles.placeOrderBtnText}>
              {isFormComplete ? "Place Order" : "Complete Details"}
            </Text>
            <Icon name="chevron-right" size={14} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(CheckoutBottomBar);

const createStyles = (colors: Colors, dark: boolean, bottomInset: number) =>
  StyleSheet.create({
    bottomDockedBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: dark ? "#334155" : "#E2E8F0",
      paddingTop: 8,
      paddingBottom: Math.max(bottomInset, 8),
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 6,
    },
    bottomTotalBlock: {
      gap: 1,
    },
    bottomTotalLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    bottomTotalValue: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    placeOrderBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 22,
      height: 42,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    placeOrderBtnDisabled: {
      opacity: 0.5,
      backgroundColor: dark ? "#334155" : "#CBD5E1",
      shadowOpacity: 0,
    },
    placeOrderBtnContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    placeOrderBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
