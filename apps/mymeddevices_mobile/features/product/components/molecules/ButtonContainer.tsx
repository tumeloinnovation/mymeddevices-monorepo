import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Product } from "@/types/product";
import CartButton from "../atoms/CartButton";
import CompareButton from "../atoms/CompareButton";
import LikeButton from "../atoms/LikeButton";

interface Props {
  data: Product;
}
const ButtonContainer: React.FC<Props> = ({ data }) => {
  return (
    <View style={styles.buttonContainer}>
      <CartButton item={data} />
      <LikeButton item={data} />
      <CompareButton item={data} />
    </View>
  );
};

export default ButtonContainer;

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 10,
    gap: 5,
  },
});
