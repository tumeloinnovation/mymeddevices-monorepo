import React from "react";
import { Text } from "react-native";
import { useTheme } from "@react-navigation/native";

import { Product } from "@/types/product";
import RowContainer from "@/components/layout/RowContainer";

const SalePrice = ({
  product,
  size = "sm",
}: {
  product: Product;
  size?: "lg" | "sm";
}) => {
  const { colors } = useTheme();

  if (product.on_sale) {
    return (
      <RowContainer justifyContent="space-between">
        <Text
          style={{
            fontWeight: "bold",
            fontSize: size === "lg" ? 28 : 18,
            color: colors.primary,
          }}
        >
          Ksh. {Number(product.sale_price).toLocaleString()}{" "}
          <Text
            style={{
              fontWeight: "500",
              fontStyle: "italic",
              fontSize: 14,
              color: colors.textSecondary,
              textDecorationLine: "line-through",
            }}
          >
            Ksh. {product.regular_price}
          </Text>
        </Text>
      </RowContainer>
    );
  }

  return (
    <RowContainer justifyContent="space-between">
      <Text style={{ fontWeight: "bold", fontSize: 18, color: colors.text }}>
        Ksh. {Number(product.regular_price).toLocaleString()}
      </Text>
    </RowContainer>
  );
};

export default SalePrice;
