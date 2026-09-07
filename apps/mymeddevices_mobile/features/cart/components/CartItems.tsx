import React from "react";
import { Image } from "expo-image";
import Icon from "@/components/common/Icon";
import { useTheme } from "@react-navigation/native";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { Product } from "@/types/product";
import { Colors } from "@/types/app";
import useCartStore from "../stores/useCartStore";

type Props = {
  item: Product;
};

const CartItems: React.FC<Props> = ({ item }) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const quantity = useCartStore((state) => state.getProductQuantity(item.id));
  const addToCart = useCartStore((state) => state.addToCart);
  const reduceFromCart = useCartStore((state) => state.reduceFromCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const handleNavigate = () => {
    router.push({
      pathname: "/product-view",
      params: { id: item.id },
    });
  };

  const itemPrice = Number(item.sale_price || item.price || item.regular_price || 0);
  const regularPrice = item.on_sale && item.regular_price ? Number(item.regular_price) : null;
  const categoryName =
    item.categories?.[0]?.name === "Uncategorized" || item.categories?.[0]?.name === "Pharma"
      ? "Medical"
      : item.categories?.[0]?.name;

  return (
    <View style={styles.itemRow}>
      {/* 1. Compact Thumbnail */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleNavigate}
        style={styles.imageContainer}
      >
        <Image
          style={styles.image}
          source={item?.images?.[0]?.src}
          contentFit="contain"
          placeholder={require("@/assets/images/placeholder.png")}
        />
      </TouchableOpacity>

      {/* 2. Info & Controls */}
      <View style={styles.details}>
        {/* Top: Category & Title + Delete Icon */}
        <View style={styles.topRow}>
          <View style={styles.titleWrapper}>
            {categoryName ? (
              <Text style={styles.categoryText} numberOfLines={1}>
                {categoryName}
              </Text>
            ) : null}
            <TouchableOpacity activeOpacity={0.7} onPress={handleNavigate}>
              <Text style={styles.title} numberOfLines={2}>
                {item.name}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              removeFromCart(item);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Icon name="trash" color={colors.textSecondary || "#94A3B8"} size={15} />
          </TouchableOpacity>
        </View>

        {/* Bottom: Price + Stepper */}
        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>
              KES {itemPrice.toLocaleString()}
            </Text>
            {regularPrice ? (
              <Text style={styles.regularPriceText}>
                KES {regularPrice.toLocaleString()}
              </Text>
            ) : null}
          </View>

          {/* Slim Stepper */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={[styles.stepBtn, quantity <= 1 && styles.stepBtnDisabled]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                reduceFromCart(item);
              }}
              disabled={quantity <= 1}
              activeOpacity={0.7}
            >
              <Icon
                name="minus"
                size={11}
                color={quantity <= 1 ? colors.textDisabled || "#CBD5E1" : colors.text}
              />
            </TouchableOpacity>

            <Text style={styles.quantityNumber}>{quantity}</Text>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                addToCart(item);
              }}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={11} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CartItems;

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    itemRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 12,
      alignItems: "center",
    },
    imageContainer: {
      width: 72,
      height: 72,
      borderRadius: 10,
      backgroundColor: dark ? colors.background : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      padding: 4,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    details: {
      flex: 1,
      justifyContent: "space-between",
      minHeight: 72,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
    },
    titleWrapper: {
      flex: 1,
      gap: 2,
    },
    categoryText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    title: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 18,
    },
    deleteButton: {
      padding: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    bottomRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 6,
    },
    priceContainer: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
    },
    priceText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    regularPriceText: {
      fontSize: 11,
      color: colors.textSecondary || "#94A3B8",
      textDecorationLine: "line-through",
      fontWeight: "500",
    },
    stepperContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 2,
      height: 28,
    },
    stepBtn: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
    },
    stepBtnDisabled: {
      opacity: 0.3,
    },
    quantityNumber: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
      minWidth: 24,
      textAlign: "center",
    },
  });
