import React from "react";
import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import CustomText from "@/components/common/CustomText";
import Icon from "@/components/common/Icon";
import { AuthUser } from "@/types/auth";
import { Customer } from "@/types/user";
import { SIZES } from "@/styles/sizes";
import { getGreeting } from "@/utils/greetings";

interface DrawerUserProfileProps {
  isAuthenticated: boolean;
  user: AuthUser | null;
  customer: Customer | null;
  guestName?: string;
  guestPhone?: string;
  onPressProfile: () => void;
  onPressSignIn: () => void;
}

export const DrawerUserProfile: React.FC<DrawerUserProfileProps> = ({
  isAuthenticated,
  user,
  customer,
  guestName,
  guestPhone,
  onPressProfile,
  onPressSignIn,
}) => {
  const { colors } = useTheme();

  const displayName = isAuthenticated && user
    ? user.first_name || user.display_name || "User"
    : guestName || "Guest";

  const subtitle = isAuthenticated && user
    ? user.email || user.phone || ""
    : guestPhone || "";

  const avatarUrl = user?.avatar_url || customer?.avatar_url;
  const avatarSource = avatarUrl
    ? { uri: avatarUrl }
    : require("@/assets/images/avatar.png");

  return (
    <Pressable
      onPress={onPressProfile}
      android_ripple={{ color: colors.border }}
      style={{
        paddingHorizontal: SIZES.paddingLG,
        paddingTop: SIZES.paddingMD,
        paddingBottom: SIZES.paddingLG,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: SIZES.spacingSM,
        }}
      >
        <Image
          source={avatarSource}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            borderWidth: 2,
            borderColor: colors.primary,
          }}
          contentFit="cover"
        />
        <View style={{ flex: 1, marginLeft: SIZES.spacingSM }}>
          <CustomText
            variant="caption"
            style={{
              color: colors.textSecondary,
              fontSize: 11,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {getGreeting()}
          </CustomText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: SIZES.spacingXS,
            }}
          >
            <CustomText
              variant="h3"
              style={{
                fontSize: SIZES.fontMD,
                fontWeight: "700",
                color: colors.text,
                flexShrink: 1,
              }}
              numberOfLines={1}
            >
              {displayName}
            </CustomText>
          </View>
          {subtitle ? (
            <CustomText
              variant="caption"
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {subtitle}
            </CustomText>
          ) : null}
        </View>
        <Icon name="chevron-right" size={18} color={colors.textSecondary} />
      </View>

      {!isAuthenticated ? (
        <Pressable
          onPress={onPressSignIn}
          style={{
            marginTop: SIZES.spacingSM,
            paddingVertical: 8,
            paddingHorizontal: SIZES.paddingMD,
            borderRadius: SIZES.radius_small,
            backgroundColor: colors.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: SIZES.spacingXS,
          }}
        >
          <Icon name="login" size={16} color="#FFFFFF" />
          <CustomText
            variant="body"
            style={{
              color: "#FFFFFF",
              fontSize: SIZES.fontSM,
              fontWeight: "600",
            }}
          >
            Sign In / Register
          </CustomText>
        </Pressable>
      ) : null}
    </Pressable>
  );
};

export default DrawerUserProfile;
