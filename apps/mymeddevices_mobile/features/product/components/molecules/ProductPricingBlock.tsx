import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";

import { Product } from "@/types/product";
import { Colors } from "@/types/app";

interface ProductPricingBlockProps {
  product: Product;
}

export const ProductPricingBlock: React.FC<ProductPricingBlockProps> = ({ product }) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const priceNum = Number(product.sale_price || product.price || product.regular_price || 0);
  const regularNum = Number(product.regular_price || 0);
  const isOnSale = Boolean(product.on_sale && regularNum > priceNum);
  const savings = isOnSale ? regularNum - priceNum : 0;
  const savingsPercent = isOnSale ? Math.round((savings / regularNum) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* 1. Main Current Price */}
      <View style={styles.mainPriceGroup}>
        <Text style={styles.currency}>KES</Text>
        <Text style={styles.currentPrice}>{priceNum.toLocaleString()}</Text>
      </View>

      {/* 2. Strikethrough Regular Price & Savings Badge Beneath */}
      {isOnSale && (
        <View style={styles.subPriceRow}>
          <Text style={styles.regularLabel}>Regular:</Text>
          <Text style={styles.regularPrice}>
            KES {regularNum.toLocaleString()}
          </Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>
              Save {savingsPercent}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default ProductPricingBlock;

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 12,
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 3,
    },
    mainPriceGroup: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 3,
    },
    currency: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
    },
    currentPrice: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.primary,
      letterSpacing: -0.3,
    },
    subPriceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    regularLabel: {
      fontSize: 12,
      color: colors.textSecondary || "#64748B",
    },
    regularPrice: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textSecondary || "#94A3B8",
      textDecorationLine: "line-through",
    },
    discountBadge: {
      backgroundColor: dark ? "#7F1D1D33" : "#FEF2F2",
      borderWidth: 1,
      borderColor: dark ? "#991B1B" : "#FECACA",
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 4,
    },
    discountBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: dark ? "#F87171" : "#DC2626",
    },
  });
