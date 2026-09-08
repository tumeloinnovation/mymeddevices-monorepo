import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import useCartStore from "@/features/cart/stores/useCartStore";
import { Colors } from "@/types/app";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import { Product } from "@/types/product";

interface Props {
  product: Product;
}

const InCartButton: React.FC<Props> = ({ product }) => {
  const { colors } = useTheme();

  const styles = createStyles(colors);

  const [isInCart, setIsInCart] = useState(false);

  const handleAddToCart = useCartStore((state) => state.addToCart);
  const handleRemoveFromCart = useCartStore((state) => state.reduceFromCart);

  useEffect(() => {
    if (product) {
      const unsubscribe = useCartStore.subscribe((newCart) => {
        return setIsInCart(newCart.isInCart(product.id));
      });

      return unsubscribe;
    }
  }, [product]);

  return (
    <View style={{ width: "90%", marginTop: 15 }}>
      {isInCart ? (
        <TouchableOpacity
          style={styles.disableButton}
          onPress={() => handleRemoveFromCart(product)}
        >
          <Icon
            name="cart"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleAddToCart(product)}
        >
          <Icon
            name="cart"
            size={20}
            color={colors.background}
          />
          <Text style={styles.buttonText}>ADD</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default InCartButton;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.primary,
      gap: 10,
    },
    disableButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.primary,
      gap: 10,
    },
    buttonText: {
      fontWeight: "500",
      fontSize: 16,
      color: colors.background,
    },
  });
