import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Colors } from "@/types/app";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import ProductName from "../atoms/ProductName";
import { Image } from "expo-image";
import { LineItem } from "@/types/order";
import { SIZES } from "@/styles/sizes";

interface Props {
  data: LineItem;
}
const OrderProductItem: React.FC<Props> = ({ data }) => {
  const { colors } = useTheme();

  const styles = createStyles(colors);

  const handleNavigation = () => {
    router.push({
      pathname: "/product-view",
      params: { id: data?.id },
    });
  };
  return (
    <TouchableOpacity onPress={handleNavigation} style={styles.container}>
      <Image
        style={styles.image}
        source={data?.image?.src}
        contentFit="contain"
        placeholder={require("@/assets/images/placeholder.png")}
      />
      <View style={{ paddingLeft: SIZES.paddingLG }}>
        <ProductName product={data?.name} />
        <Text
          style={{
            color: colors.text,
            fontWeight: "800",
            marginVertical: SIZES.paddingSM,
          }}
        >
          Quantity: <Text style={{ color: colors.text }}>{data?.quantity}</Text>
        </Text>
        <Text
          style={{
            color: colors.text,
            fontWeight: "800",
            marginVertical: SIZES.paddingSM,
          }}
        >
          Price: <Text style={{ color: colors.text }}>{data?.price}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default OrderProductItem;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: colors.card,
      margin: 5,
      padding: 10,
      borderRadius: 10,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    image: {
      width: 100,
      height: 100,
    },
  });
