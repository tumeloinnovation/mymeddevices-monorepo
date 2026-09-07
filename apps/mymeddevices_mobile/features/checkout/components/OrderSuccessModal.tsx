import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Share,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";

interface OrderSuccessModalProps {
  visible: boolean;
  orderId: string | number;
  totalAmount: number;
  paymentMethod: string;
  customerPhone?: string;
  estimatedDelivery?: string;
  onTrackOrder: () => void;
  onContinueShopping: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  visible,
  orderId,
  totalAmount,
  paymentMethod,
  customerPhone,
  estimatedDelivery = "1 - 2 Business Days",
  onTrackOrder,
  onContinueShopping,
}) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);
  const isMpesa = paymentMethod === "mpesa";

  const handleShareOrderId = async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      await Share.share({
        message: `MyMedDevices Consignment Reference #${orderId}`,
        title: `Consignment #${orderId}`,
      });
    } catch {
      toast.info(`Consignment #${orderId}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheetCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Top Success Badge */}
            <View style={styles.badgeRing}>
              <View style={styles.badgeInner}>
                <Icon name="badge-check" size={38} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.title}>Order Confirmed!</Text>
            <Text style={styles.subtitle}>
              Thank you for shopping with MyMedDevices. Your order has been placed and we are preparing your delivery.
            </Text>

            {/* Order ID Card */}
            <View style={styles.consignmentCard}>
              <View style={styles.consignmentLeft}>
                <Text style={styles.consignmentLabel}>Order Number</Text>
                <Text style={styles.consignmentId}>#{orderId}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleShareOrderId}
                activeOpacity={0.7}
              >
                <Icon name="share" size={14} color={colors.primary} />
                <Text style={styles.copyBtnText}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionGroup}>
              <TouchableOpacity
                style={styles.trackOrderBtn}
                onPress={onTrackOrder}
                activeOpacity={0.88}
              >
                <Icon name="truck" size={16} color="#FFFFFF" />
                <Text style={styles.trackOrderBtnText}>Track Order</Text>
                <Icon name="chevron-right" size={14} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={onContinueShopping}
                activeOpacity={0.7}
              >
                <Text style={styles.continueBtnText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    sheetCard: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderRadius: 24,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 12,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
    },
    scrollBody: {
      padding: 22,
      alignItems: "center",
    },
    badgeRing: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: "rgba(16, 185, 129, 0.16)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    badgeInner: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: "#10B981",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#10B981",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      marginBottom: 6,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary || "#64748B",
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 18,
    },
    consignmentCard: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: dark ? "#0F172A" : "#F8FAFC",
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 14,
    },
    consignmentLeft: {
      gap: 2,
    },
    consignmentLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    consignmentId: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: 0.5,
    },
    copyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primary + "14",
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    copyBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    actionGroup: {
      width: "100%",
      marginTop: 6,
      gap: 10,
    },
    trackOrderBtn: {
      backgroundColor: colors.primary,
      height: 48,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    trackOrderBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    continueBtn: {
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    continueBtnText: {
      color: colors.textSecondary || "#64748B",
      fontSize: 13,
      fontWeight: "600",
    },
  });

export default OrderSuccessModal;
