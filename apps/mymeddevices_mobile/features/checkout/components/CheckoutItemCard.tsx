import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";

interface CheckoutItemCardProps {
  items: any[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const CheckoutItemCard: React.FC<CheckoutItemCardProps> = ({
  items,
  isExpanded,
  onToggleExpand,
}) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.cardTitle}>Order Items</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {totalCount} {totalCount === 1 ? "item" : "items"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onToggleExpand();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.toggleBtnText}>
            {isExpanded ? "Hide Details" : "View Breakdown"}
          </Text>
          <Icon
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={12}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Horizontal Compact Preview Thumbnails */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailList}
      >
        {items.map((item, index) => {
          const imageUri =
            item.images?.[0]?.src ||
            (typeof item.images?.[0] === "string" ? item.images[0] : null) ||
            item.image?.src ||
            (typeof item.image === "string" ? item.image : null) ||
            item.featured_image ||
            item.thumbnail;

          return (
            <View key={item.id || index} style={styles.thumbWrap}>
              <View style={styles.thumbBox}>
                <Image
                  source={imageUri || require("@/assets/images/placeholder.png")}
                  style={styles.thumbImage}
                  contentFit="contain"
                  placeholder={require("@/assets/images/placeholder.png")}
                  transition={150}
                />
              </View>
              {(item.quantity || 1) > 1 && (
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyBadgeText}>×{item.quantity}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Collapsible Detailed List */}
      {isExpanded && (
        <View style={styles.expandedBreakdown}>
          {items.map((item, index) => {
            const imageUri =
              item.images?.[0]?.src ||
              (typeof item.images?.[0] === "string" ? item.images[0] : null) ||
              item.image?.src ||
              (typeof item.image === "string" ? item.image : null) ||
              item.featured_image ||
              item.thumbnail;

            const unitPrice = Number(item.price || 0);
            const lineTotal = unitPrice * (item.quantity || 1);

            return (
              <View key={item.id || index} style={styles.breakdownRow}>
                <Image
                  source={imageUri || require("@/assets/images/placeholder.png")}
                  style={styles.breakdownThumb}
                  contentFit="contain"
                  placeholder={require("@/assets/images/placeholder.png")}
                />
                <View style={styles.breakdownInfo}>
                  <Text style={styles.breakdownName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.breakdownMeta}>
                    KES {unitPrice.toLocaleString()} × {item.quantity || 1}
                  </Text>
                </View>
                <Text style={styles.breakdownPrice}>
                  KES {lineTotal.toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      gap: 10,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.2,
    },
    countBadge: {
      backgroundColor: colors.primary + "14",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
    },
    countBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primary,
    },
    toggleBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    toggleBtnText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.primary,
    },
    thumbnailList: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 1,
    },
    thumbWrap: {
      position: "relative",
    },
    thumbBox: {
      width: 44,
      height: 44,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      backgroundColor: dark ? "#0F172A" : "#F8FAFC",
      padding: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    thumbImage: {
      width: "100%",
      height: "100%",
      borderRadius: 6,
    },
    qtyBadge: {
      position: "absolute",
      top: -3,
      right: -3,
      backgroundColor: colors.primary,
      borderRadius: 7,
      paddingHorizontal: 4,
      paddingVertical: 0.5,
      minWidth: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    qtyBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "800",
    },
    expandedBreakdown: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: dark ? "#334155" : "#E2E8F0",
      paddingTop: 8,
      gap: 8,
    },
    breakdownRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    breakdownThumb: {
      width: 32,
      height: 32,
      borderRadius: 6,
      backgroundColor: dark ? "#0F172A" : "#F8FAFC",
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
    },
    breakdownInfo: {
      flex: 1,
      gap: 1,
    },
    breakdownName: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 15,
    },
    breakdownMeta: {
      fontSize: 11,
      color: colors.textSecondary || "#64748B",
    },
    breakdownPrice: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
  });

export default CheckoutItemCard;
