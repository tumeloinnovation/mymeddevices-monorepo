import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";

interface LoyaltyPointsRedemptionCardProps {
  availablePoints: number;
  userEnteredPoints: number;
  pointsDiscount: number;
  maxRedeemablePoints: number;
  pointsInput: string;
  onChangePointsInput: (val: string) => void;
  onApplyPoints: () => void;
  onClearPoints: () => void;
}

export const LoyaltyPointsRedemptionCard: React.FC<LoyaltyPointsRedemptionCardProps> = ({
  availablePoints,
  userEnteredPoints,
  pointsDiscount,
  maxRedeemablePoints,
  pointsInput,
  onChangePointsInput,
  onApplyPoints,
  onClearPoints,
}) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  if (availablePoints <= 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.pointsLeft}>
          <View style={styles.coinBadge}>
            <Icon name="award" size={16} color="#F59E0B" />
          </View>
          <View style={styles.pointsTextCol}>
            <Text style={styles.sectionHeader}>Redeem Loyalty Points</Text>
            <Text style={styles.pointsSubtitle}>
              {availablePoints.toLocaleString()} points available (2 points = KES 1)
            </Text>
          </View>
        </View>
        {userEnteredPoints > 0 && (
          <TouchableOpacity
            onPress={onClearPoints}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearPointsText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.pointsInputRow}>
        <TextInput
          style={styles.pointsInput}
          value={pointsInput}
          onChangeText={onChangePointsInput}
          keyboardType="numeric"
          placeholder={`Points to use (max ${maxRedeemablePoints.toLocaleString()})`}
          placeholderTextColor={colors.textSecondary || "#94A3B8"}
        />
        <TouchableOpacity
          style={[styles.pointsApplyBtn, !pointsInput.trim() && styles.pointsApplyBtnDisabled]}
          onPress={onApplyPoints}
          disabled={!pointsInput.trim()}
        >
          <Text style={styles.pointsApplyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>

      {userEnteredPoints > 0 && (
        <View style={styles.appliedPointsBadge}>
          <Icon name="check" size={12} color="#10B981" />
          <Text style={styles.appliedPointsBadgeText}>
            Using {userEnteredPoints.toLocaleString()} points for KES {pointsDiscount.toLocaleString()} discount
          </Text>
        </View>
      )}
    </View>
  );
};

export default React.memo(LoyaltyPointsRedemptionCard);

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
    pointsLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    coinBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(245, 158, 11, 0.14)",
      alignItems: "center",
      justifyContent: "center",
    },
    pointsTextCol: {
      flex: 1,
      gap: 1,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary || "#64748B",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    pointsSubtitle: {
      fontSize: 10,
      color: colors.textSecondary || "#64748B",
    },
    clearPointsText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#EF4444",
      paddingHorizontal: 4,
    },
    pointsInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 2,
    },
    pointsInput: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      backgroundColor: dark ? "#0F172A" : "#F8FAFC",
      paddingHorizontal: 10,
      fontSize: 12,
      color: colors.text,
    },
    pointsApplyBtn: {
      backgroundColor: colors.primary,
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    pointsApplyBtnDisabled: {
      opacity: 0.4,
    },
    pointsApplyBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },
    appliedPointsBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "rgba(16, 185, 129, 0.08)",
      padding: 6,
      borderRadius: 6,
    },
    appliedPointsBadgeText: {
      fontSize: 11,
      color: "#10B981",
      fontWeight: "600",
    },
  });
