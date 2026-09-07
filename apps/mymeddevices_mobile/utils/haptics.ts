import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const run = (promise: Promise<void> | void) => {
  if (Platform.OS === "web") return;
  Promise.resolve(promise).catch(() => {
    // Haptics may be unavailable if native module isn't linked
  });
};

export const triggerImpact = (
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
) => {
  run(Haptics.impactAsync(style));
};

export const triggerSelection = () => {
  run(Haptics.selectionAsync());
};

export const triggerNotification = (
  type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Error
) => {
  run(Haptics.notificationAsync(type));
};
