import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useTheme } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";

export const DeliveryAndReturnsSection: React.FC = () => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const [isReturnModalVisible, setReturnModalVisible] = useState(false);

  const deliveryItems = [
    {
      title: "Nairobi & Environs",
      time: "Same Day / Next Day",
      icon: "zap" as const,
      color: "#059669",
    },
    {
      title: "Other Counties",
      time: "24 – 48 Hours",
      icon: "truck" as const,
      color: "#0284C7",
    },
  ];

  const handleOpenReturns = () => {
    Haptics.selectionAsync().catch(() => {});
    setReturnModalVisible(true);
  };

  const handleCloseReturns = () => {
    Haptics.selectionAsync().catch(() => {});
    setReturnModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Compact Delivery Speed Rows */}
      <View style={styles.deliveryRow}>
        {deliveryItems.map((item) => (
          <View key={item.title} style={styles.deliveryChip}>
            <Icon name={item.icon} size={13} color={item.color} />
            <Text style={styles.deliveryTitle}>{item.title}:</Text>
            <Text style={[styles.deliveryTime, { color: item.color }]}>
              {item.time}
            </Text>
          </View>
        ))}
      </View>

      {/* Subtle Return & Guarantee Clickable Row */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleOpenReturns}
        style={styles.returnRow}
      >
        <View style={styles.returnLeft}>
          <Icon name="refresh" size={13} color="#059669" />
          <Text style={styles.returnText}>
            7-Day Return & Replacement Guarantee
          </Text>
        </View>
        <Icon
          name="chevron-right"
          size={14}
          color={colors.textSecondary || "#64748B"}
        />
      </TouchableOpacity>

      {/* Return Policy Pop-up Modal */}
      <Modal
        visible={isReturnModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseReturns}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCloseReturns}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Icon name="refresh" size={18} color="#059669" />
                <Text style={styles.modalTitle}>7-Day Return & Replacement Policy</Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseReturns}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="x" size={18} color={colors.textSecondary || "#64748B"} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalIntro}>
              Every item is tested and inspected before dispatch. If your order arrives damaged or faulty:
            </Text>

            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepHeading}>Request in App</Text>
                  <Text style={styles.stepDesc}>
                    Submit a return or exchange request within 7 days of delivery.
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepHeading}>Doorstep Pickup</Text>
                  <Text style={styles.stepDesc}>
                    We will arrange a quick pickup directly from your doorstep or clinic.
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepHeading}>Quick Replacement or Refund</Text>
                  <Text style={styles.stepDesc}>
                    Get a brand-new replacement or instant M-Pesa refund once checked.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCloseReturns}
              style={styles.modalActionBtn}
            >
              <Text style={styles.modalActionText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DeliveryAndReturnsSection;

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    container: {
      gap: 8,
    },
    deliveryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    deliveryChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 7,
      backgroundColor: dark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      flexGrow: 1,
    },
    deliveryTitle: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.text,
    },
    deliveryTime: {
      fontSize: 11,
      fontWeight: "700",
    },
    returnRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: dark ? "#05966914" : "#ECFDF5",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: dark ? "#05966930" : "#A7F3D0",
    },
    returnLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    returnText: {
      fontSize: 12,
      fontWeight: "600",
      color: dark ? "#34D399" : "#065F46",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    modalCard: {
      width: "100%",
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderRadius: 16,
      padding: 18,
      gap: 14,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 10,
    },
    modalHeaderTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    modalTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    closeBtn: {
      padding: 4,
    },
    modalIntro: {
      fontSize: 12,
      color: colors.textSecondary || "#64748B",
      lineHeight: 18,
    },
    stepsList: {
      gap: 10,
    },
    stepItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    stepBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    stepNum: {
      fontSize: 11,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    stepContent: {
      flex: 1,
      gap: 2,
    },
    stepHeading: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    stepDesc: {
      fontSize: 11,
      color: colors.textSecondary || "#64748B",
      lineHeight: 15,
    },
    modalActionBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 4,
    },
    modalActionText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
