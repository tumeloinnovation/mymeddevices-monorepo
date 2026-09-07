import React from "react";
import { Image, StyleSheet, useWindowDimensions, View } from "react-native";
import { SIZES } from "@/styles/sizes";

const landscapeLogo = require("@/assets/images/landscape_logo.png");
const portraitLogo = require("@/assets/images/light_icon.png");

export default function AuthBranding() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <View style={[styles.container, isLandscape ? styles.row : styles.column]}>
      <Image
        source={landscapeLogo}
        style={[
          styles.landscape,
          isLandscape ? styles.landscapeSpacingRow : styles.landscapeSpacingColumn,
        ]}
        resizeMode="contain"
        accessibilityLabel="MyMedDevices primary logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SIZES.paddingXL,
  },
  row: {
    flexDirection: "row",
  },
  column: {
    flexDirection: "column",
  },
  landscape: {
    width: 180,
    height: 56,
  },
  portrait: {
    width: 48,
    height: 48,
  },
  landscapeSpacingRow: {
    marginRight: SIZES.spacingSM,
  },
  landscapeSpacingColumn: {
    marginBottom: SIZES.spacingSM,
  },
  portraitSpacingRow: {
    marginLeft: SIZES.spacingSM,
  },
  portraitSpacingColumn: {
    marginTop: SIZES.spacingSM,
  },
});
