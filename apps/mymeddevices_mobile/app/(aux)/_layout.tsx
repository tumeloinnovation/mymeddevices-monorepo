import React from "react";
import { Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";

export default function AuxLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerShown: true,
      }}
    >
      <Stack.Screen name="about-us" options={{ title: "About Us" }} />
      <Stack.Screen name="help-center" options={{ title: "Help Center" }} />
      <Stack.Screen name="connect-with-us" options={{ title: "Connect With Us" }} />
      <Stack.Screen name="privacy-policy" options={{ title: "Privacy Policy" }} />
      <Stack.Screen name="check-updates" options={{ title: "Check for Updates" }} />
    </Stack>
  );
}
