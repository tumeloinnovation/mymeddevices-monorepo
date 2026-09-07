import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { CheckoutCoupon } from "@/types/checkout";

interface CheckoutCouponCardProps {
  coupon: CheckoutCoupon | null;
  onPress: () => void;
}

export const CheckoutCouponCard: React.FC<CheckoutCouponCardProps> = ({
  coupon,
  onPress,
}) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowBetween}>
        <View style={styles.promoLeft}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(245, 158, 11, 0.14)" }]}>
            <Icon name="tag" size={15} color="#F59E0B" />
          </View>
          <View>
            <Text style={styles.sectionHeader}>Coupons & Promotions</Text>
            <Text style={styles.promoSub}>
              {coupon ? "Discount applied to order" : "Tap to enter code or select coupon"}
            </Text>
          </View>
        </View>
        <View style={styles.promoRight}>
          <Text
            style={[
              styles.promoValue,
              coupon ? { color: "#10B981", fontWeight: "700" } : {},
            ]}
          >
            {coupon
              ? `${coupon.code} (-KES ${coupon.discount.toLocaleString()})`
              : "Apply coupon"}
          </Text>
          <Icon name="chevron-right" size={14} color={colors.textSecondary || "#94A3B8"} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(CheckoutCouponCard);

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
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    promoLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary || "#64748B",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    promoSub: {
      fontSize: 11,
      color: colors.textSecondary || "#64748B",
    },
    promoRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    promoValue: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
    },
  });
