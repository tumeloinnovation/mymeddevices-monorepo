import { StyleSheet } from "react-native";
import React from "react";
import { router } from "expo-router";
import ColumnContainer from "./ColumnContainer";
import RowContainer from "./RowContainer";
import CustomButton from "../common/CustomButton";
import { SIZES } from "@/styles/sizes";
import { useAuth } from "@/context/AuthContext";
import { openWhatsAppOrderHistory } from "@/utils/externalLinks";

const ButtonSection = () => {
  const { isAuthenticated } = useAuth();

  const handleOrderHistory = () => {
    if (isAuthenticated) {
      return router.push("/order-history");
    }
    // Guest users - redirect to WhatsApp for order history
    return openWhatsAppOrderHistory();
  };

  return (
    <RowContainer marginTop={SIZES.marginSM}>
      <ColumnContainer width="50%" height={50} marginBottom={SIZES.marginMD}>
        <CustomButton
          type="default"
          size="large"
          title="Order History"
          onPress={handleOrderHistory}
        />
      </ColumnContainer>
      <ColumnContainer width="50%" height={50} marginBottom={SIZES.marginMD}>
        <CustomButton
          type="default"
          size="large"
          title="My Wishlist"
          onPress={() => router.push("/wishlist")}
        />
      </ColumnContainer>
    </RowContainer>
  );
};

export default ButtonSection;

const styles = StyleSheet.create({});
