import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import useCartStore from "@/features/cart/stores/useCartStore";
import useAppStore from "@/stores/useAppStore";

const CAPSULE_HEIGHT = 60;
const CAPSULE_SHRUNK_HEIGHT = 46;
export const FLOATING_TABBAR_CLEARANCE = 96;

type TabName = "index" | "category" | "ai" | "cart" | "account";

const TAB_CONFIG: Record<
  TabName,
  { label: string; icon: string; badge?: boolean; isAi?: boolean }
> = {
  index: { label: "Home", icon: "home" },
  category: { label: "Categories", icon: "check-list" },
  ai: { label: "Ask AI", icon: "bot", isAi: true },
  cart: { label: "Cart", icon: "cart", badge: true },
  account: { label: "Account", icon: "user-round" },
};

type TabRoute = { key: string; name: string };

export type FloatingTabBarProps = {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: {
      type: "tabPress";
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean } | undefined;
  };
  insets: { bottom: number };
};

function withAlpha(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function FloatingTabBar({
  state,
  navigation,
  insets,
}: FloatingTabBarProps) {
  const { colors, dark } = useTheme();
  const reducedMotion = useReducedMotion();
  const cartCount = useCartStore((s) => s.cart_items);
  const tabBarVisible = useAppStore((s) => s.tabBarVisible);
  const setTabBarVisible = useAppStore((s) => s.setTabBarVisible);

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Animated progress: 0 = expanded, 1 = shrunk (Instagram style)
  const shrinkProgress = useSharedValue(0);
  const keyboardOffset = useSharedValue(0);

  useEffect(() => {
    shrinkProgress.value = withSpring(tabBarVisible ? 0 : 1, {
      damping: 18,
      stiffness: 170,
      mass: 0.8,
    });
  }, [tabBarVisible, shrinkProgress]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      keyboardOffset.value = withTiming(CAPSULE_HEIGHT + 60, { duration: 180 });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      keyboardOffset.value = withTiming(0, { duration: 220 });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffset]);

  const focusedKey = state.routes[state.index]?.key;

  const routes = state.routes.filter(
    (route) => TAB_CONFIG[route.name as TabName] !== undefined
  );

  const handlePress = React.useCallback(
    (route: TabRoute) => {
      const isFocused = route.key === focusedKey;

      // Navigate immediately without waiting for any other work
      if (!isFocused) {
        navigation.navigate(route.name);
      }

      // Expand the dock back to full size
      setTabBarVisible(true);

      navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      // Fire haptics non-blocking
      const isAi = route.name === "ai";
      if (isAi) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    },
    [focusedKey, navigation, setTabBarVisible]
  );

  const animatedCapsuleContainerStyle = useAnimatedStyle(() => {
    const paddingH = interpolate(
      shrinkProgress.value,
      [0, 1],
      [16, 52],
      Extrapolation.CLAMP
    );
    return {
      paddingHorizontal: paddingH,
      transform: [{ translateY: keyboardOffset.value }],
      opacity: interpolate(
        keyboardOffset.value,
        [0, 60],
        [1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  const animatedCapsuleStyle = useAnimatedStyle(() => {
    const height = interpolate(
      shrinkProgress.value,
      [0, 1],
      [CAPSULE_HEIGHT, CAPSULE_SHRUNK_HEIGHT],
      Extrapolation.CLAMP
    );
    const radius = interpolate(
      shrinkProgress.value,
      [0, 1],
      [CAPSULE_HEIGHT / 2, CAPSULE_SHRUNK_HEIGHT / 2],
      Extrapolation.CLAMP
    );
    const paddingHorizontal = interpolate(
      shrinkProgress.value,
      [0, 1],
      [6, 12],
      Extrapolation.CLAMP
    );

    return {
      height,
      borderRadius: radius,
      paddingHorizontal,
    };
  });

  return (
    <View
      pointerEvents={keyboardVisible ? "none" : "box-none"}
      style={[
        styles.root,
        { paddingBottom: Math.max(insets.bottom, 10) + 8 },
      ]}
    >
      <Animated.View
        pointerEvents="box-none"
        style={[styles.keyboardShift, animatedCapsuleContainerStyle]}
      >
        <View
          style={[
            styles.capsuleShadow,
            {
              shadowColor: "#000",
              shadowOpacity: dark ? 0.45 : 0.12,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.capsule,
              {
                backgroundColor: dark
                  ? "rgba(30, 41, 59, 0.82)"
                  : "rgba(255, 255, 255, 0.88)",
                borderColor: withAlpha(colors.border, dark ? 0.35 : 0.55),
              },
              animatedCapsuleStyle,
            ]}
          >
            <BlurView
              intensity={65}
              tint={dark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.row}>
              {routes.map((route) => {
                const config = TAB_CONFIG[route.name as TabName];
                const isActive = route.key === focusedKey;
                return (
                  <TabItem
                    key={route.key}
                    label={config.label}
                    icon={config.icon}
                    isAi={config.isAi}
                    active={isActive}
                    reducedMotion={reducedMotion}
                    shrinkProgress={shrinkProgress}
                    badge={
                      config.badge && cartCount > 0 ? cartCount : undefined
                    }
                    color={isActive ? colors.primary : colors.textSecondary}
                    onPress={() => handlePress(route)}
                  />
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

type TabItemProps = {
  label: string;
  icon: string;
  isAi?: boolean;
  active: boolean;
  reducedMotion: boolean;
  shrinkProgress: SharedValue<number>;
  badge?: number;
  color: string;
  onPress: () => void;
};

const TabItem = React.memo(function TabItem({
  label,
  icon,
  isAi,
  active,
  reducedMotion,
  shrinkProgress,
  badge,
  color,
  onPress,
}: TabItemProps) {
  const { colors, dark } = useTheme();
  const prevBadge = useRef(badge);
  const badgeScale = useSharedValue(1);

  useEffect(() => {
    if (
      badge !== undefined &&
      (prevBadge.current === undefined || badge !== prevBadge.current)
    ) {
      badgeScale.value = withSequence(
        withSpring(1.3, { damping: 5, stiffness: 220 }),
        withSpring(1, { damping: 10, stiffness: 160 })
      );
    }
    prevBadge.current = badge;
  }, [badge, badgeScale]);

  const animatedBadgeScale = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shrinkProgress.value,
      [0, 0.4],
      [1, 0],
      Extrapolation.CLAMP
    );
    const height = interpolate(
      shrinkProgress.value,
      [0, 0.7],
      [13, 0],
      Extrapolation.CLAMP
    );
    const marginTop = interpolate(
      shrinkProgress.value,
      [0, 0.7],
      [2, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      shrinkProgress.value,
      [0, 0.5],
      [1, 0.8],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      height,
      marginTop,
      transform: [{ scale }],
    };
  });

  const animatedDotStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shrinkProgress.value,
      [0, 0.35],
      [active ? 1 : 0, 0],
      Extrapolation.CLAMP
    );
    const height = interpolate(
      shrinkProgress.value,
      [0, 0.5],
      [4, 0],
      Extrapolation.CLAMP
    );
    const marginTop = interpolate(
      shrinkProgress.value,
      [0, 0.5],
      [2, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      height,
      marginTop,
    };
  });

  const aiIconColor = isAi ? (active ? "#FFFFFF" : colors.primary) : color;

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={0.7}
      delayPressIn={0}
      hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
    >
      <View style={styles.itemContent}>
        <Animated.View
          style={[
            styles.iconWrap,
            isAi && [
              styles.aiIconWrap,
              {
                backgroundColor: active
                  ? colors.primary
                  : withAlpha(colors.primary, 0.15),
              },
            ],
            reducedMotion
              ? null
              : {
                  transform: [{ scale: active ? 1.05 : 1 }],
                },
          ]}
        >
          <Icon name={icon} size={isAi ? 18 : 21} color={aiIconColor} />
          {badge !== undefined && badge > 0 && (
            <Animated.View
              key={badge}
              entering={FadeIn.duration(160)}
              exiting={FadeOut.duration(120)}
              style={styles.badge}
            >
              <Animated.View
                style={[
                  styles.badgeSurface,
                  {
                    backgroundColor: "#EF4444",
                    borderColor: dark ? "#1E293B" : "#FFFFFF",
                  },
                  animatedBadgeScale,
                ]}
              >
                <Text style={styles.badgeText}>
                  {badge > 99 ? "99+" : badge}
                </Text>
              </Animated.View>
            </Animated.View>
          )}
        </Animated.View>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.label,
            {
              color,
              fontWeight: active ? "700" : "500",
            },
            animatedLabelStyle,
          ]}
        >
          {label}
        </Animated.Text>
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: colors.primary,
            },
            animatedDotStyle,
          ]}
        />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
  },
  keyboardShift: {
    width: "100%",
  },
  capsuleShadow: {
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
  },
  capsule: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    elevation: 8,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  item: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  aiIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  label: {
    fontSize: 10,
    maxWidth: "100%",
    overflow: "hidden",
  },
  dot: {
    width: 4,
    borderRadius: 2,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeSurface: {
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    paddingHorizontal: 3,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
    textAlign: "center",
    includeFontPadding: false,
  },
});

