import React from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

interface OrderTrackingSearchHeaderProps {
  orderQuery: string;
  isLoading: boolean;
  onChangeQuery: (val: string) => void;
  onClearQuery: () => void;
  onSubmit: () => void;
}

export const OrderTrackingSearchHeader: React.FC<OrderTrackingSearchHeaderProps> = ({
  orderQuery,
  isLoading,
  onChangeQuery,
  onClearQuery,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.searchCard}>
      <View style={styles.searchCardHeader}>
        <View style={[styles.iconPill, { backgroundColor: colors.primary + "14" }]}>
          <Icon name="truck" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.searchTitle}>Track Your Order</Text>
          <Text style={styles.searchSubtitle}>Real-time updates and doorstep delivery across Kenya</Text>
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputBox}>
          <Icon name="search" size={16} color={colors.textSecondary || colors.text} />
          <TextInput
            style={styles.textInput}
            placeholder="Enter Order # or Tracking ID"
            placeholderTextColor={colors.textSecondary || "#94A3B8"}
            value={orderQuery}
            onChangeText={onChangeQuery}
            onSubmitEditing={onSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {orderQuery.length > 0 && (
            <TouchableOpacity
              onPress={onClearQuery}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close" size={14} color={colors.textSecondary || colors.text} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={onSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.trackButtonText}>Track</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default React.memo(OrderTrackingSearchHeader);

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    searchCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SIZES.spacingMD,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    searchCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    iconPill: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    searchTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    searchSubtitle: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 1,
    },
    inputRow: {
      flexDirection: "row",
      gap: 8,
    },
    inputBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.background,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      height: 42,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 0,
    },
    trackButton: {
      backgroundColor: colors.primary,
      borderRadius: SIZES.radius_medium,
      paddingHorizontal: 18,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
    },
    trackButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 13,
    },
  });
