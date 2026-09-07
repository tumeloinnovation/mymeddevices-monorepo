import React from "react";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/types/app";
import useCartStore from "@/features/cart/stores/useCartStore";
import { SIZES } from "@/styles/sizes";
import { useCheckoutStore } from "../stores/useCheckoutStore";
import { PACKAGING_FEE, SERVICES_FEE } from "@/services/order.service";

const TotalCheckout = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const { getTotalCost, cart_list } = useCartStore();
  const { shipping } = useCheckoutStore();

  const subtotal = getTotalCost();
  const total = subtotal + shipping + PACKAGING_FEE + SERVICES_FEE;

  return (
    <View style={styles.priceContainer}>
      <View style={styles.checkoutPrice}>
        <Text style={styles.checkoutLabel}>
          Subtotal ({cart_list.length} product
          {cart_list.length > 1 ? "s" : ""})
        </Text>
        <Text style={styles.price}>
          <Text style={styles.currency}>Ksh.</Text> {subtotal.toLocaleString()}
        </Text>
      </View>
      <View style={styles.checkoutPrice}>
        <Text style={styles.checkoutLabel}>Delivery fee</Text>
        <Text style={styles.price}>
          <Text style={styles.currency}>Ksh.</Text> {shipping.toLocaleString()}
        </Text>
      </View>
      <View style={styles.checkoutPrice}>
        <Text style={styles.checkoutLabel}>Packaging Fee</Text>
        <Text style={styles.price}>
          <Text style={styles.currency}>Ksh.</Text> {PACKAGING_FEE.toLocaleString()}
        </Text>
      </View>
      <View style={styles.checkoutPrice}>
        <Text style={styles.checkoutLabel}>Services Fee</Text>
        <Text style={styles.price}>
          <Text style={styles.currency}>Ksh.</Text> {SERVICES_FEE.toLocaleString()}
        </Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.checkoutPrice}>
        <Text style={styles.checkoutLabel}>Total</Text>
        <Text style={styles.price}>
          <Text style={styles.currency}>Ksh.</Text> {total.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

export default TotalCheckout;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    separator: {
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: SIZES.paddingMD,
    },
    priceContainer: {
      padding: SIZES.paddingMD,
      backgroundColor: colors.card,
      margin: SIZES.paddingMD,
      borderWidth: 1,
      borderRadius: SIZES.radius_medium,
    },
    checkoutPrice: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SIZES.marginSM,
    },
    checkoutLabel: {
      fontWeight: "500",
      fontSize: 16,
      color: colors.text,
    },
    price: {
      fontWeight: "600",
      fontSize: 18,
      color: colors.text,
    },
    currency: {
      fontWeight: "500",
      fontSize: 14,
      color: colors.text,
    },
  });
