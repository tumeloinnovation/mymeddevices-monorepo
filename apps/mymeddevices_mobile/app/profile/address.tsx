import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import DeliveryOptionsModal from "@/components/sheets/DeliveryOptionsModal";

const AddressScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <DeliveryOptionsModal
        visible={true}
        onClose={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/profile");
          }
        }}
      />
    </View>
  );
};

export default AddressScreen;
