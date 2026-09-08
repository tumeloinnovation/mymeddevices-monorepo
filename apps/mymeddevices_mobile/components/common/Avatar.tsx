import React from "react";
import { Image } from "expo-image";
import { StyleSheet, StyleProp, ImageStyle } from "react-native";
import { SIZES } from "@/styles/sizes";

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

const Avatar: React.FC<AvatarProps> = ({ source, size = 40, style }) => {
  return (
    <Image
      source={source || undefined}
      style={[
        styles.userImage,
        size ? { height: size, width: size, borderRadius: size } : null,
        style,
      ]}
      placeholder={require("@/assets/images/avatar.png")}
      contentFit="contain"
      placeholderContentFit="contain"
    />
  );
};

export default Avatar;

const styles = StyleSheet.create({
  userImage: {
    height: 40,
    width: 40,
    borderRadius: 40,
    marginRight: SIZES.marginMD,
    position: "relative",
    left: 5,
    bottom: 2,
  },
});
