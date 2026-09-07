import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import Icon from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

export const OrderTrackingEmptyState: React.FC = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + "12" }]}>
        <Icon name="truck" size={38} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Enter an Order Number</Text>
      <Text style={styles.emptySubtitle}>
        Input the order ID from your SMS confirmation or checkout receipt to track your delivery in real-time.
      </Text>

      <TouchableOpacity
        style={styles.viewHistoryBtn}
        onPress={() => router.push("/order-history")}
        activeOpacity={0.8}
      >
        <Text style={styles.viewHistoryBtnText}>View My Order History</Text>
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(OrderTrackingEmptyState);

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    emptyState: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 30,
      alignItems: "center",
      marginTop: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
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
    viewHistoryBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 11,
      paddingHorizontal: 20,
      borderRadius: SIZES.radius_medium,
    },
    viewHistoryBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
