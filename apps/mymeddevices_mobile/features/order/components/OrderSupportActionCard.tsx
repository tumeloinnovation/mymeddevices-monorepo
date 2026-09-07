import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import Icon from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import { openWhatsApp } from "@/utils/externalLinks";

interface OrderSupportActionCardProps {
  trackedOrderNumber: string;
  onReorder: () => void;
}

export const OrderSupportActionCard: React.FC<OrderSupportActionCardProps> = ({
  trackedOrderNumber,
  onReorder,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.bottomActionsCard}>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.reorderBottomBtn}
          onPress={onReorder}
          activeOpacity={0.85}
        >
          <Icon name="repeat" size={16} color="#FFFFFF" />
          <Text style={styles.reorderBottomBtnText}>Reorder Items</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueShopBtn}
          onPress={() => router.replace("/(shop)")}
          activeOpacity={0.85}
        >
          <Icon name="shopping-bag" size={16} color={colors.text} />
          <Text style={styles.continueShopBtnText}>Browse Store</Text>
        </TouchableOpacity>
      </View>

      {/* Dedicated WhatsApp & Logistics Support Strip */}
      <TouchableOpacity
        style={styles.whatsappSupportBar}
        onPress={() =>
          openWhatsApp(
            `Hello MyMedDevices Support, I need assistance tracking my order #${trackedOrderNumber}`
          )
        }
        activeOpacity={0.85}
      >
        <View style={styles.whatsappIconCircle}>
          <Icon name="whatsapp" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.whatsappSupportContent}>
          <Text style={styles.whatsappSupportTitle}>Need Help with Delivery?</Text>
          <Text style={styles.whatsappSupportSubtitle}>
            Chat with our customer care team on WhatsApp
          </Text>
        </View>
        <Icon name="chevron-right" size={16} color="#25D366" />
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(OrderSupportActionCard);

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    bottomActionsCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      gap: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
    },
    reorderBottomBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingVertical: 12,
      borderRadius: SIZES.radius_medium,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    reorderBottomBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
    continueShopBtn: {
      flex: 1,
      backgroundColor: colors.background,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingVertical: 12,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
    },
    continueShopBtnText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },
    whatsappSupportBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#25D36610",
      borderWidth: 1,
      borderColor: "#25D36630",
      borderRadius: SIZES.radius_medium,
      padding: 10,
    },
    whatsappIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#25D366",
      alignItems: "center",
      justifyContent: "center",
    },
    whatsappSupportContent: {
      flex: 1,
    },
    whatsappSupportTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    whatsappSupportSubtitle: {
      fontSize: 10.5,
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      marginTop: 1,
    },
  });
