import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Colors } from "@/types/app";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import Icon from "@/components/common/Icon";

import useCartStore from "@/features/cart/stores/useCartStore";

const CartIcon = () => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const cart_items = useCartStore((state) => state.cart_items);
  const displayCount = cart_items > 99 ? "99+" : cart_items;

  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={() => router.push("/cart")}
      activeOpacity={0.7}
    >
      <Icon name="cart" size={20} color={colors.text} />
      {cart_items > 0 && (
        <View style={styles.actionButtonIcon}>
          <Text style={styles.actionButtonText}>{displayCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CartIcon;

const createStyles = (colors: Colors, dark?: boolean) =>
  StyleSheet.create({
    actionButton: {
      padding: 10,
      marginHorizontal: 5,
      position: "relative",
    },
    actionButtonIcon: {
      position: "absolute",
      top: 4,
      right: 4,
      minWidth: 17,
      height: 17,
      paddingHorizontal: 3,
      backgroundColor: "#EF4444",
      borderRadius: 8.5,
      borderWidth: 1.5,
      borderColor: dark ? "#1E293B" : "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#EF4444",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3,
    },
    actionButtonText: {
      fontWeight: "800",
      fontSize: 9.5,
      color: "#FFFFFF",
      includeFontPadding: false,
    },
  });

