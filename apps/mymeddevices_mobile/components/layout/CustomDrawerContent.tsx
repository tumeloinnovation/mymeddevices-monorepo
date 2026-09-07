import React, { useCallback, useContext, useState } from "react";
import { Pressable, View, Switch, StyleSheet } from "react-native";
import { triggerImpact } from "@/utils/haptics";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import {
  useTheme,
  CommonActions,
  DrawerActions,
} from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeContext } from "@/context/ThemeContext";
import CustomText from "@/components/common/CustomText";
import Icon from "@/components/common/Icon";
import LoadingModal from "@/components/modals/LoadingModal";
import { useAuth } from "@/context/AuthContext";
import { openWhatsAppOrderHistory, shareLink } from "@/utils/externalLinks";
import { SIZES } from "@/styles/sizes";
import { useUserStore } from "@/features/user/stores/useUserStore";
import { router } from "expo-router";
import DrawerUserProfile from "@/components/drawer/DrawerUserProfile";
import DrawerSocialFooter from "@/components/drawer/DrawerSocialFooter";

const triggerHaptic = () => {
  triggerImpact();
};

const SectionHeader = ({ label }: { label: string }) => {
  const { colors } = useTheme();
  return (
    <CustomText
      variant="caption"
      accessibilityRole="text"
      style={{
        fontSize: 13,
        fontWeight: "600",
        textTransform: "uppercase",
        color: colors.textSecondary,
        opacity: 0.7,
        paddingHorizontal: SIZES.paddingLG,
        paddingVertical: SIZES.spacingSM,
        marginTop: SIZES.spacingSM,
      }}
    >
      {label}
    </CustomText>
  );
};

interface DrawerRowProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  active?: boolean;
}

const DrawerRow = ({ icon, label, onPress, right, active }: DrawerRowProps) => {
  const { colors } = useTheme();

  const content = (
    <>
      {icon}
      <CustomText
        variant="body"
        style={{
          flex: 1,
          marginLeft: SIZES.spacingSM,
          fontSize: SIZES.fontSM,
          fontWeight: "600",
          color: active ? colors.primary : colors.text,
        }}
        numberOfLines={1}
      >
        {label}
      </CustomText>
      {right ??
        (onPress ? (
          <Icon
            name="chevron-right"
            size={18}
            color={active ? colors.primary : colors.textSecondary}
          />
        ) : null)}
    </>
  );

  if (!onPress && right) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: SIZES.paddingLG,
          paddingVertical: 12,
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => {
        triggerHaptic();
        onPress?.();
      }}
      android_ripple={{ color: colors.border }}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: SIZES.paddingLG,
          paddingVertical: 12,
          backgroundColor: active ? colors.card : "transparent",
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      {content}
    </Pressable>
  );
};

const CustomDrawerContent = ({
  state,
  navigation,
  descriptors,
}: DrawerContentComponentProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { isAuthenticated, user, customer, logout } = useAuth();
  const { guest } = useUserStore();
  const { theme, changeTheme } = useContext(ThemeContext);
  const isDarkMode = theme === "dark";

  const handleOrders = useCallback(() => {
    triggerHaptic();
    if (isAuthenticated) {
      router.navigate("/order-history");
      return;
    }
    openWhatsAppOrderHistory();
  }, [isAuthenticated]);

  const handleWishlist = useCallback(() => {
    triggerHaptic();
    router.navigate("/wishlist");
  }, []);

  const handleInviteFriends = useCallback(() => {
    triggerHaptic();
    shareLink();
  }, []);

  const handleProfile = useCallback(() => {
    triggerHaptic();
    if (isAuthenticated) {
      router.navigate("/profile");
    } else {
      router.navigate("/(auth)/login");
    }
  }, [isAuthenticated]);

  const handleSignIn = useCallback(() => {
    triggerHaptic();
    router.navigate("/(auth)/login");
  }, []);

  const handleDrawerSignOut = useCallback(async () => {
    triggerHaptic();
    setIsSigningOut(true);
    try {
      await logout();
    } finally {
      setIsSigningOut(false);
    }
  }, [logout]);

  const toggleTheme = useCallback(() => {
    changeTheme(isDarkMode ? "light" : "dark");
  }, [isDarkMode, changeTheme]);

  const navItems = state.routes.map((route, index) => {
    const options = descriptors[route.key]?.options ?? {};
    const itemStyle = StyleSheet.flatten(options.drawerItemStyle);
    if (itemStyle?.display === "none") return null;

    const focused = index === state.index;
    const rawLabel = options.drawerLabel ?? options.title ?? route.name;
    const label = typeof rawLabel === "string" ? rawLabel : route.name;
    const iconNode = options.drawerIcon
      ? options.drawerIcon({
          color: focused ? colors.primary : colors.textSecondary,
          size: 24,
          focused,
        })
      : null;

    const onPress = () => {
      if (focused) {
        navigation.dispatch(DrawerActions.closeDrawer());
      } else {
        navigation.dispatch({
          ...CommonActions.navigate(route.name, route.params),
          target: state.key,
        });
      }
    };

    return (
      <DrawerRow
        key={route.key}
        icon={iconNode}
        label={label}
        active={focused}
        onPress={onPress}
      />
    );
  });

  const isSignOut = isAuthenticated;
  const authBg = isSignOut ? colors.card : colors.primary;
  const authFg = isSignOut ? colors.error : colors.background;
  const authBorder = isSignOut ? colors.error : colors.primary;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LoadingModal visible={isSigningOut} message="Signing out..." />
      <DrawerContentScrollView
        contentContainerStyle={{ flexGrow: 1, paddingVertical: SIZES.spacingSM }}
        style={{ backgroundColor: colors.background }}
      >
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <View>
            <DrawerUserProfile
              isAuthenticated={isAuthenticated}
              user={user}
              customer={customer}
              guestName={guest?.first_name}
              guestPhone={guest?.phone_number}
              onPressProfile={handleProfile}
              onPressSignIn={handleSignIn}
            />

            <SectionHeader label="Menu" />
            {navItems}

            <SectionHeader label="Account" />
            <DrawerRow
              icon={<Icon name="bag" size={24} color={colors.textSecondary} />}
              label="My Orders"
              onPress={handleOrders}
            />
            <DrawerRow
              icon={<Icon name="heart" size={24} color={colors.textSecondary} />}
              label="Wishlist"
              onPress={handleWishlist}
            />

            <SectionHeader label="More" />
            <DrawerRow
              icon={<Icon name="users" size={24} color={colors.textSecondary} />}
              label="Invite Friends"
              onPress={handleInviteFriends}
            />
            <DrawerRow
              icon={<Icon name="moon" size={24} color={colors.textSecondary} />}
              label="Dark Mode"
              right={
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  thumbColor={colors.primary}
                  trackColor={{
                    false: colors.textDisabled,
                    true: "#E64A19",
                  }}
                />
              }
            />
          </View>

          <View style={{ paddingBottom: insets.bottom }}>
            <DrawerSocialFooter />
            {isAuthenticated ? (
              <Pressable
                onPress={handleDrawerSignOut}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 44,
                    borderRadius: SIZES.radius_large,
                    marginHorizontal: SIZES.paddingLG,
                    backgroundColor: authBg,
                    borderWidth: 1,
                    borderColor: authBorder,
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Icon
                  name="logout"
                  size={20}
                  color={authFg}
                  style={{ marginRight: SIZES.spacingSM }}
                />
                <CustomText variant="button" style={{ color: authFg }}>
                  Sign Out
                </CustomText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
};

export default React.memo(CustomDrawerContent);
