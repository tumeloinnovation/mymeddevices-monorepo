import React from "react";
import { View, Text, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Colors } from "@/types/app";

interface OrderProcessingModalProps {
  visible: boolean;
}

export const OrderProcessingModal: React.FC<OrderProcessingModalProps> = ({ visible }) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.processingOverlay}>
        <View style={styles.processingCard}>
          <View style={styles.processingSpinnerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.processingTitle}>Placing Your Order</Text>
          <Text style={styles.processingSubtitle}>
            Confirming your items, setting up Lipa na M-Pesa, and preparing your delivery...
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(OrderProcessingModal);

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    processingOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    processingCard: {
      width: "100%",
      maxWidth: 300,
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderRadius: 18,
      paddingVertical: 24,
      paddingHorizontal: 18,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    processingSpinnerContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + "18",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },
    processingTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      marginBottom: 6,
      letterSpacing: -0.2,
    },
    processingSubtitle: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      textAlign: "center",
      lineHeight: 16,
    },
  });
