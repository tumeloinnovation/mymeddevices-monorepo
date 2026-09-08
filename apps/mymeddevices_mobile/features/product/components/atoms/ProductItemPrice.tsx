import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Product } from "@/types/product";
import { Colors } from "@/types/app";

interface ProductItemPriceProps {
  product: Product;
  colors: Colors;
}

export const ProductItemPrice: React.FC<ProductItemPriceProps> = ({
  product,
  colors,
}) => {
  const styles = createStyles(colors);

  if (product?.on_sale) {
    const saleVal = Number(product?.sale_price || product?.price || 0).toLocaleString();
    const regularVal = product?.regular_price
      ? Number(product.regular_price).toLocaleString()
      : null;

    return (
      <View style={styles.priceRow}>
        <View style={styles.priceGroup}>
          <Text style={styles.salePrice}>Ksh {saleVal}</Text>
          {regularVal ? (
            <Text style={styles.regularPrice}>Ksh {regularVal}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  const normalVal = Number(
    product?.regular_price || product?.price || 0
  ).toLocaleString();

  return (
    <View style={styles.priceRow}>
      <Text style={styles.normalPrice}>Ksh {normalVal}</Text>
    </View>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    priceRow: {
      marginVertical: 2,
      minHeight: 22,
      justifyContent: "center",
    },
    priceGroup: {
      flexDirection: "row",
      alignItems: "baseline",
      flexWrap: "wrap",
      gap: 5,
    },
    salePrice: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
    },
    regularPrice: {
      fontSize: 11,
      color: colors.textSecondary || "#94A3B8",
      textDecorationLine: "line-through",
      fontWeight: "500",
    },
    normalPrice: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
  });

export default ProductItemPrice;
