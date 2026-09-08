import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/types/app";
import useCartStore from "@/features/cart/stores/useCartStore";
import BackIcon from "@/components/common/BackIcon";
import NotificationIcon from "@/components/common/NotificationIcon";
import { SIZES } from "@/styles/sizes";

interface CartHeaderProps {
  back?: boolean;
}

const CartHeader: React.FC<CartHeaderProps> = ({ back = false }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.top);

  const cart_items = useCartStore((state) => state.cart_items);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {back ? (
          <View style={styles.backWrapper}>
            <BackIcon />
          </View>
        ) : null}
        <View style={styles.center}>
          <Text style={styles.title}>Shopping Cart</Text>
          <Text style={styles.subTitle}>
            {cart_items} {cart_items === 1 ? "item" : "items"} in cart
          </Text>
        </View>
        <NotificationIcon />
      </View>
    </View>
  );
};

const createStyles = (colors: Colors, topInset: number) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.card,
      paddingTop: topInset + 6,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 4,
    },
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SIZES.spacingMD,
    },
    backWrapper: {
      marginRight: 8,
    },
    center: {
      flex: 1,
      justifyContent: "center",
    },
    title: {
      fontWeight: "700",
      fontSize: SIZES.fontMD,
      color: colors.text,
    },
    subTitle: {
      color: colors.textSecondary,
      fontWeight: "400",
      fontSize: SIZES.fontXS,
      marginTop: 2,
    },
  });

export default CartHeader;
