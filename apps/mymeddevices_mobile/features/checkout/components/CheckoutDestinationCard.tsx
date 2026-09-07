import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";

interface CheckoutDestinationCardProps {
  effectiveAddress: string | null;
  effectiveRegion?: string;
  onPress: () => void;
}

export const CheckoutDestinationCard: React.FC<CheckoutDestinationCardProps> = ({
  effectiveAddress,
  effectiveRegion,
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
        <View style={styles.addressLeftRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + "14" }]}>
            <Icon name="location" size={16} color={colors.primary} />
          </View>
          <View style={styles.addressInfo}>
            <View style={styles.headerLabelRow}>
              <Text style={styles.sectionHeader}>Delivery Destination</Text>
              <View style={styles.actionPill}>
                <Text style={styles.actionPillText}>{effectiveAddress ? "Change" : "Add"}</Text>
              </View>
            </View>
            {effectiveAddress ? (
              <Text style={styles.addressTitle} numberOfLines={2}>
                {effectiveAddress}
                {effectiveRegion && !effectiveAddress.toLowerCase().includes(effectiveRegion.toLowerCase())
                  ? ` (${effectiveRegion})`
                  : ""}
              </Text>
            ) : (
              <Text style={styles.placeholderText}>
                Tap to set destination address or town
              </Text>
            )}
          </View>
        </View>
        <Icon name="chevron-right" size={15} color={colors.textSecondary || "#94A3B8"} />
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(CheckoutDestinationCard);

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
    addressLeftRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
      paddingRight: 6,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    addressInfo: {
      flex: 1,
      gap: 1,
    },
    headerLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 1,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary || "#64748B",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    actionPill: {
      backgroundColor: colors.primary + "14",
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
    },
    actionPillText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primary,
    },
    addressTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      lineHeight: 18,
    },
    placeholderText: {
      fontSize: 12,
      color: colors.textSecondary || "#94A3B8",
      fontStyle: "italic",
    },
  });
