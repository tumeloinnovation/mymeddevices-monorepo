import React from "react";
import { Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BackIcon from "@/components/common/BackIcon";

export default function AuthLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const headerStyle = {
    backgroundColor: colors.card,
  };

  return (
    <Stack
      screenOptions={{
        headerStyle,
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerLeft: () => <BackIcon />,
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
