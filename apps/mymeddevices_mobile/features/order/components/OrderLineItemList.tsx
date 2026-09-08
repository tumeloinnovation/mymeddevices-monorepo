import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import { LineItem } from "@/types/order";
import { Colors } from "@/types/app";

interface OrderLineItemListProps {
  lineItems: LineItem[];
}

const { width } = Dimensions.get("window");

export const OrderLineItemList: React.FC<OrderLineItemListProps> = ({
  lineItems,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <>
      {lineItems.map((product, index) => (
        <View style={styles.container} key={`${product.id}-${index}`}>
          <Image
            style={styles.image}
            source={product?.image?.src}
            contentFit="contain"
            placeholder={require("@/assets/images/placeholder.png")}
          />
          <View style={styles.details}>
            <Text style={[styles.name, { color: colors.textSecondary }]}>
              {product.name}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              Quantity: {product.quantity}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              Price: Ksh.{Number(product.price).toLocaleString()}
            </Text>
            {product.sku ? (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                SKU: {product.sku}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: 10,
      marginTop: 10,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 8,
      paddingLeft: 0,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    image: {
      height: "35%",
      width: width / 2.8,
      aspectRatio: 1 / 0.8,
    },
    details: {
      flex: 1,
      justifyContent: "space-around",
      alignItems: "flex-start",
    },
    name: {
      fontWeight: "500",
      fontSize: 16,
    },
    meta: {
      fontWeight: "400",
      fontSize: 13,
    },
  });

export default OrderLineItemList;
