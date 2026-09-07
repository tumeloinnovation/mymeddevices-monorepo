import Icon from "@/components/common/Icon";
import { Alert, Linking, TouchableOpacity } from "react-native";
import React from "react";
import { useTheme } from "@react-navigation/native";

import { Product } from "@/types/product";
import useCartStore from "@/features/cart/stores/useCartStore";

interface Props {
  item: Product;
  detail?: boolean;
}

const CartButton: React.FC<Props> = ({ item, detail }) => {
  const { colors } = useTheme();
  const isInCart = useCartStore((state) => state.isInCart(item.id));

  const handleAddToCart = useCartStore((state) => state.addToCart);
  const handleRemoveFromCart = useCartStore((state) => state.removeFromCart);

  const handleOutOfStockAlert = (url: string) => {
    Alert.alert(
      "Out of Stock",
      "This item is currently out of stock. Would you like to inquire about the product?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Inquire",
          onPress: () => Linking.openURL(url),
        },
      ],
      { cancelable: true }
    );
  };
  const handleButton = () => {
    if (isInCart) {
      handleRemoveFromCart(item);
    } else if (item.stock_status === "outofstock") {
      handleOutOfStockAlert(item.permalink);
    } else {
      handleAddToCart(item);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleButton}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {isInCart ? (
        <Icon
          name="cart"
          size={20}
          color={detail ? colors.text : colors.primary}
        />
      ) : item.stock_status === "outofstock" ? (
        <Icon
          name="cart"
          size={22}
          color={detail ? colors.text : colors.primary}
        />
      ) : (
        <Icon
          name="cart"
          size={20}
          color={detail ? colors.text : colors.primary}
        />
      )}
    </TouchableOpacity>
  );
};

export default CartButton;
