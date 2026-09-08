import React from "react";
import { Stack } from "expo-router";

export default function OrderHistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    />
  );
}
