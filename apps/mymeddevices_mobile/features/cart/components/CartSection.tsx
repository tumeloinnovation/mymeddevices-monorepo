import React from "react";
import { Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "@react-navigation/native";

import { Product } from "@/types/product";
import useCartStore from "../stores/useCartStore";
import ColumnContainer from "@/components/layout/ColumnContainer";
import SalePrice from "@/features/product/components/molecules/SalePrice";
import CustomButton from "@/components/common/CustomButton";

const CartSection = ({ item }: { item: Product }) => {
  const { colors } = useTheme();

  const handleAddToCart = useCartStore((state) => state.addToCart);

  const handleEnquireNow = async () => {
    await WebBrowser.openBrowserAsync(item.permalink);
  };

  return (
    <>
      <ColumnContainer width="35%">
        <View>
          <Text style={{ color: colors.text }}>Total Price</Text>
          <SalePrice product={item} />
        </View>
      </ColumnContainer>
      <ColumnContainer width="50%">
        {item.stock_status.toUpperCase() === "OUTOFSTOCK" ? (
          <CustomButton onPress={handleEnquireNow} title={"Enquire Now"} />
        ) : (
          <CustomButton
            onPress={() => handleAddToCart(item)}
            title={"Add To Cart"}
          />
        )}
      </ColumnContainer>
    </>
  );
};

export default CartSection;
