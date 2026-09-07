import React from "react";

import { Product } from "@/types/product";
import useCartStore from "../stores/useCartStore";
import ColumnContainer from "@/components/layout/ColumnContainer";
import CheckoutItems from "@/features/checkout/components/CheckOutItems";
import CustomButton from "@/components/common/CustomButton";

const CartAddedSection = ({ item }: { item: Product }) => {
  const handleRemoveFromCart = useCartStore((state) => state.removeFromCart);

  return (
    <>
      <ColumnContainer width="35%">
        <CheckoutItems item={item} />
      </ColumnContainer>
      <ColumnContainer width="55%">
        <CustomButton
          size="small"
          style={{
            margin: 2
          }}
          onPress={() => handleRemoveFromCart(item)}
          title={"Remove from Cart"}
        />
      </ColumnContainer>
    </>
  );
};

export default CartAddedSection;
