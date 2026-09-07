import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import * as Application from "expo-application";
import { useTheme } from "@react-navigation/native";
import CustomText from "@/components/common/CustomText";
import Icon from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";
import { openSocialMedia, socialLinks } from "@/utils/externalLinks";

const SOCIAL_LINKS: Array<{ platform: keyof typeof socialLinks; icon: string }> = [
  { platform: "instagram", icon: "instagram" },
  { platform: "facebook", icon: "facebook" },
  { platform: "x", icon: "x-twitter" },
  { platform: "tiktok", icon: "tiktok" },
  { platform: "whatsapp", icon: "whatsapp" },
  { platform: "linkedin", icon: "linkedin" },
];

export const DrawerSocialFooter: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: SIZES.paddingLG,
        paddingTop: SIZES.paddingLG,
        paddingBottom: SIZES.paddingLG,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <CustomText
        variant="caption"
        style={{
          fontSize: 11,
          fontWeight: "600",
          textTransform: "uppercase",
          color: colors.textSecondary,
          opacity: 0.7,
          marginBottom: SIZES.spacingSM,
        }}
      >
        Follow Us
      </CustomText>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: SIZES.spacingSM,
          marginBottom: SIZES.paddingMD,
        }}
      >
        {SOCIAL_LINKS.map((link) => (
          <Pressable
            key={link.platform}
            onPress={() => openSocialMedia(link.platform)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={link.icon as any} size={18} color={colors.primary} />
          </Pressable>
        ))}
      </View>

      <View style={{ alignItems: "center" }}>
        <CustomText
          variant="caption"
          style={{
            fontSize: 11,
            color: colors.textSecondary,
            opacity: 0.6,
          }}
        >
          {Application.applicationName} v{Application.nativeApplicationVersion}
        </CustomText>
      </View>
    </View>
  );
};

export default DrawerSocialFooter;
