import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";

import { Product } from "@/types/product";
import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";

interface ProductHeaderInfoProps {
  product: Product;
  onReviewPress?: () => void;
}

export const ProductHeaderInfo: React.FC<ProductHeaderInfoProps> = ({
  product,
  onReviewPress,
}) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const brandAttr = product?.attributes?.find((a) => a.name.toLowerCase() === "brand");
  const brandName = brandAttr?.options?.[0] || null;

  const category = product?.categories?.[0];
  const categoryName =
    category?.name === "Uncategorized" || category?.name === "Pharma"
      ? "Medical Devices"
      : category?.name || "Medical Equipment";

  const ratingNum = parseFloat(product?.average_rating || "0");
  const reviewCount = product?.rating_count || 0;
  const isRated = ratingNum > 0 && reviewCount > 0;
  const isOutOfStock = product?.stock_status === "outofstock";

  const handleCategoryPress = () => {
    if (category) {
      router.push({
        pathname: "/products-category",
        params: { id: category.id, name: category.name },
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Category & Brand Eyebrow */}
      <View style={styles.eyebrowRow}>
        {category ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleCategoryPress}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text style={styles.eyebrowCategory}>{categoryName.toUpperCase()}</Text>
          </TouchableOpacity>
        ) : null}

        {brandName ? (
          <Text style={styles.eyebrowBrand}>
            {category ? " • " : ""}{brandName}
          </Text>
        ) : null}
      </View>

      {/* 2. Product Title (Clear, 17px, Legible without shouting) */}
      <Text style={styles.title}>{product?.name}</Text>

      {/* 3. Single-Line Meta Strip (Rating • Stock • SKU) */}
      <View style={styles.metaStrip}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onReviewPress}
          style={styles.ratingInline}
        >
          <Icon
            name={isRated ? "star-filled" : "star"}
            size={12}
            color={isRated ? "#F59E0B" : colors.textSecondary || "#94A3B8"}
          />
          <Text style={styles.ratingText}>
            {isRated ? `${ratingNum.toFixed(1)} (${reviewCount})` : "Unrated"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.dot}>•</Text>

        <View style={styles.stockInline}>
          <View
            style={[
              styles.stockDot,
              { backgroundColor: isOutOfStock ? "#EF4444" : "#10B981" },
            ]}
          />
          <Text style={styles.stockText}>
            {isOutOfStock
              ? "Out of Stock"
              : product?.stock_quantity
              ? `In Stock (${product.stock_quantity})`
              : "In Stock"}
          </Text>
        </View>

        {product?.sku ? (
          <>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.skuText}>SKU: {product.sku}</Text>
          </>
        ) : null}
      </View>
    </View>
  );
};

export default ProductHeaderInfo;

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 4,
      backgroundColor: dark ? colors.card : "#FFFFFF",
      gap: 6,
    },
    eyebrowRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
    },
    eyebrowCategory: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 0.6,
    },
    eyebrowBrand: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
      letterSpacing: 0.2,
    },
    title: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 23,
      letterSpacing: -0.1,
    },
    metaStrip: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
      paddingTop: 2,
    },
    ratingInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    ratingText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
    },
    dot: {
      fontSize: 12,
      color: colors.textSecondary || "#94A3B8",
    },
    stockInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    stockDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    stockText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
    },
    skuText: {
      fontSize: 11,
      color: colors.textSecondary || "#94A3B8",
      fontWeight: "500",
    },
  });
