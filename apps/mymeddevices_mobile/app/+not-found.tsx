import React from "react";
import { Image } from "expo-image";
import { Stack, router } from "expo-router";

import { StyleSheet } from "react-native";
import ContainerView from "@/components/common/ContainerView";
import CustomText from "@/components/common/CustomText";
import { SIZES } from "@/styles/sizes";
import CustomButton from "@/components/common/CustomButton";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ContainerView style={styles.container}>
        <Image
          source={require("@/assets/illustrations/warning.svg")}
          style={styles.image}
          contentFit="contain"
        />
        <CustomText variant="h4"> This screen doesn't exist. </CustomText>
        <CustomButton
          title="Go Back"
          size="large"
          style={styles.button}
          onPress={() => router.back()}
        />
      </ContainerView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    height: 250,
    width: 250,
    marginBottom: SIZES.marginLG,
  },
  button: {
    marginTop: 20,
  },
});
