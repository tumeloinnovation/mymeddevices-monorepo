import React from "react";
import Icon from "@/components/common/Icon";
import { useTheme } from "@react-navigation/native";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { Product } from "@/types/product";
import { Colors } from "@/types/app";
import useCartStore from "@/features/cart/stores/useCartStore";

type Props = {
  item: Product;
};

const CheckoutItems: React.FC<Props> = ({ item }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const quantity = useCartStore((state) => state.getProductQuantity(item.id));
  const handleAddToCart = useCartStore((state) => state.addToCart);
  const handleReduceFromCart = useCartStore((state) => state.reduceFromCart);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        disabled={quantity <= 1}
        onPress={() => handleReduceFromCart(item)}
        style={[styles.button, quantity <= 1 && styles.disabledButton]}
      >
        <Icon name="minus" size={14} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.quantityText}>{quantity}</Text>
      <TouchableOpacity
        onPress={() => handleAddToCart(item)}
        style={styles.button}
      >
        <Icon name="plus" size={14} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 15,
      justifyContent: "space-between",
      paddingVertical: 5,
      paddingHorizontal: 8,
    },
    button: {
      height: 30,
      width: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderColor: colors.border,
      backgroundColor: colors.textDisabled,
    },
    disabledButton: {
      backgroundColor: colors.border,
    },
    quantityText: {
      fontWeight: "500",
      fontSize: 14,
      color: colors.text,
      width: 30,
      textAlign: "center",
    },
  });

export default CheckoutItems;
