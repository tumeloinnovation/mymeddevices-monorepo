import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";

interface CheckoutRecipientCardProps {
  name: string;
  phone: string;
  email?: string;
  onPress: () => void;
}

export const CheckoutRecipientCard: React.FC<CheckoutRecipientCardProps> = ({
  name,
  phone,
  email,
  onPress,
}) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const hasContact = Boolean(name.trim() && phone.trim());

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowBetween}>
        <View style={styles.addressLeftRow}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(59, 130, 246, 0.12)" }]}>
            <Icon name="user" size={16} color="#3B82F6" />
          </View>
          <View style={styles.addressInfo}>
            <View style={styles.headerLabelRow}>
              <Text style={styles.sectionHeader}>Recipient & Contact</Text>
              <View style={styles.actionPill}>
                <Text style={styles.actionPillText}>{hasContact ? "Change" : "Add"}</Text>
              </View>
            </View>
            {hasContact ? (
              <>
                <Text style={styles.addressTitle} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.addressSubtitle} numberOfLines={1}>
                  {phone} {email ? `• ${email}` : ""}
                </Text>
              </>
            ) : (
              <Text style={styles.placeholderText}>
                Tap to provide recipient name and phone number
              </Text>
            )}
          </View>
        </View>
        <Icon name="chevron-right" size={15} color={colors.textSecondary || "#94A3B8"} />
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(CheckoutRecipientCard);

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
    addressSubtitle: {
      fontSize: 11,
      color: colors.textSecondary || "#64748B",
      lineHeight: 15,
    },
    placeholderText: {
      fontSize: 12,
      color: colors.textSecondary || "#94A3B8",
      fontStyle: "italic",
    },
  });
