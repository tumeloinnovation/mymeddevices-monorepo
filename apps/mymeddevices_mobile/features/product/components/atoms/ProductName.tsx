import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useTheme } from "@react-navigation/native";
import { Colors } from "@/types/app";

type Size = "large" | "small";

type Props = {
  product: string;
  size?: Size;
};
const ProductName: React.FC<Props> = ({ product, size = "small" }) => {
  const { colors } = useTheme();

  const styles = createStyles(colors, size);
  return (
    <Text
      adjustsFontSizeToFit={true}
      numberOfLines={size === "large" ? 3 : 2}
      style={styles.productName}
    >
      {product}
    </Text>
  );
};

export default ProductName;

const createStyles = (colors: Colors, size: Size) =>
  StyleSheet.create({
    productName: {
      fontWeight: "500",
      fontSize: size === "large" ? 25 : 16,
      color: colors.text,
      marginBottom: 5,
    },
  });
