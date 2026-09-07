import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useTheme } from "@react-navigation/native";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import RowContainer from "@/components/layout/RowContainer";
import { Product } from "@/types/product";
import CartAddedSection from "@/features/cart/components/CartAddedSection";
import CartSection from "@/features/cart/components/CartSection";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  isInCart: boolean;
  product: Product;
}

const ProductFooter = ({ isInCart, product }: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);

  return (
    <View style={styles.container}>
      {isInCart ? (
        <CartAddedSection item={product} />
      ) : (
        <CartSection item={product} />
      )}
    </View>
  );
};

export default ProductFooter;

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    container: {
      height: 65,
      flexDirection: "row",
      justifyContent: "space-between",
      alignSelf: "center",
      backgroundColor: colors.card,
      width: "94%",
      borderRadius: 25,
      padding: SIZES.paddingMD,
      paddingLeft: SIZES.paddingXL,
      elevation: 3,
      marginTop: SIZES.spacingSM,
      marginBottom: Math.max(bottomInset, SIZES.spacingSM),
    },
  });
