import { StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import React from "react";
import { Product } from "@/types/product";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";
import useCartStore from "@/features/cart/stores/useCartStore";
import type { StyleProp, ViewStyle } from "react-native";
import { useWishlistStore } from "@/features/wishlist/stores/useWishlistStore";
import ProductItemPrice from "../atoms/ProductItemPrice";

interface Props {
  data: Product;
  style?: StyleProp<ViewStyle>;
}

const ProductItem: React.FC<Props> = ({ data, style }) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const isInCart = useCartStore((state) => state.isInCart(data?.id));
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const isInWishlist = useWishlistStore((state) => state.isInWishlist(data?.id));
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);

  if (!data) {
    return null;
  }

  const handleNavigation = () => {
    router.push({
      pathname: "/product-view",
      params: { id: data?.id },
    });
  };

  const handleCartToggle = (e: any) => {
    e?.stopPropagation?.();
    if (isInCart) {
      removeFromCart(data);
    } else {
      addToCart(data);
    }
  };

  const handleWishlistToggle = (e: any) => {
    e?.stopPropagation?.();
    if (isInWishlist) {
      removeFromWishlist(data);
    } else {
      addToWishlist(data);
    }
  };

  const categoryName =
    data?.categories?.[0]?.name === "Uncategorized" || data?.categories?.[0]?.name === "Pharma"
      ? "Medical"
      : data?.categories?.[0]?.name;

  const discountPercent =
    data?.on_sale && data?.regular_price && data?.sale_price
      ? Math.round(
          ((Number(data.regular_price) - Number(data.sale_price)) /
            Number(data.regular_price)) *
            100
        )
      : null;

  const isOutOfStock = data?.stock_status === "outofstock";

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handleNavigation}
      style={[styles.card, style]}
    >
      {/* Image Container with Badge and Wishlist Button */}
      <View style={styles.imageContainer}>
        {discountPercent && discountPercent > 0 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleWishlistToggle}
          style={styles.wishlistButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon
            name={isInWishlist ? "heart-filled" : "heart"}
            size={16}
            color={isInWishlist ? "#EF4444" : colors.textSecondary || colors.text}
          />
        </TouchableOpacity>

        <Image
          style={styles.image}
          source={data?.images?.[0]?.src}
          contentFit="contain"
          placeholder={require("@/assets/images/placeholder.png")}
          transition={200}
        />
      </View>

      {/* Product Information */}
      <View style={styles.content}>
        {categoryName ? (
          <Text style={styles.categoryLabel} numberOfLines={1}>
            {categoryName}
          </Text>
        ) : null}

        <Text style={styles.productName} numberOfLines={2}>
          {data?.name}
        </Text>

        {/* Pricing */}
        <ProductItemPrice product={data} colors={colors} />

        {/* Option B: Bottom Full-Width Add To Cart Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isOutOfStock}
          onPress={handleCartToggle}
          style={[
            styles.actionButton,
            isInCart && styles.actionButtonInCart,
            isOutOfStock && styles.actionButtonDisabled,
          ]}
        >
          <Icon
            name={isInCart ? "shopping-bag" : "cart"}
            size={14}
            color={isInCart ? colors.primary : "#FFFFFF"}
          />
          <Text
            style={[
              styles.actionButtonText,
              isInCart && styles.actionButtonTextInCart,
              isOutOfStock && styles.actionButtonTextDisabled,
            ]}
          >
            {isOutOfStock ? "Out of Stock" : isInCart ? "In Cart" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default ProductItem;

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      margin: 5,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    imageContainer: {
      position: "relative",
      width: "100%",
      height: 140,
      backgroundColor: dark ? colors.background : "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      padding: 10,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    discountBadge: {
      position: "absolute",
      bottom: 8,
      left: 8,
      zIndex: 2,
      backgroundColor: "#EF4444",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    discountBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
    },
    wishlistButton: {
      position: "absolute",
      top: 8,
      right: 8,
      zIndex: 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    content: {
      padding: 10,
      gap: 4,
      justifyContent: "space-between",
    },
    categoryLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    productName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 18,
      minHeight: 36, // Ensures alignment for 1 vs 2 lines
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 10,
      marginTop: 2,
    },
    actionButtonInCart: {
      backgroundColor: colors.primary + "18",
      borderWidth: 1,
      borderColor: colors.primary,
    },
    actionButtonDisabled: {
      backgroundColor: colors.border,
      opacity: 0.6,
    },
    actionButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
    },
    actionButtonTextInCart: {
      color: colors.primary,
      fontWeight: "700",
    },
    actionButtonTextDisabled: {
      color: colors.textSecondary || colors.text,
    },
  });
