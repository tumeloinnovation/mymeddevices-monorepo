import { useEffect, useRef } from "react";
import type {
  NotificationClickEvent,
  NotificationWillDisplayEvent,
  PushSubscriptionChangedState,
} from "react-native-onesignal";
import Constants from "expo-constants";
import { toast } from "sonner-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  NotificationType,
  NotificationCategory,
  useNotificationStore,
} from "@/stores/useNotificationStore";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

type OneSignalModule = typeof import("react-native-onesignal");

const PLAYER_ID_TOKEN_KEY = "playerIdToken";

export const PlayerStorage = {
  setPlayerIdToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(PLAYER_ID_TOKEN_KEY, token);
    } catch (error) {
      console.error("Error setting player ID token:", error);
    }
  },

  getPlayerIdToken: async () => {
    try {
      return await AsyncStorage.getItem(PLAYER_ID_TOKEN_KEY);
    } catch (error) {
      console.error("Error getting player ID token:", error);
      return null;
    }
  },
};

export const syncOneSignalUser = async (userId: string | number, email?: string) => {
  if (Constants.appOwnership === "expo") return;
  try {
    const { OneSignal } = await import("react-native-onesignal");
    OneSignal.login(String(userId));
    if (email) {
      OneSignal.User.addEmail(email);
    }
  } catch (err) {
    console.warn("Could not sync user with OneSignal:", err);
  }
};

export const logoutOneSignalUser = async () => {
  if (Constants.appOwnership === "expo") return;
  try {
    const { OneSignal } = await import("react-native-onesignal");
    OneSignal.logout();
  } catch (err) {
    console.warn("Could not logout OneSignal user:", err);
  }
};

export const syncOneSignalPreferences = async (preferences: Record<string, boolean>) => {
  if (Constants.appOwnership === "expo") return;
  try {
    const { OneSignal } = await import("react-native-onesignal");
    const tags: Record<string, string> = {};
    Object.entries(preferences).forEach(([key, val]) => {
      tags[key] = val ? "true" : "false";
    });
    OneSignal.User.addTags(tags);
  } catch (err) {
    console.warn("Could not sync OneSignal tags:", err);
  }
};

function inferCategory(title: string, body: string, rawData?: any): NotificationCategory {
  const combined = `${title} ${body} ${JSON.stringify(rawData || {})}`.toLowerCase();
  if (combined.includes("mpesa") || combined.includes("payment") || combined.includes("paid") || combined.includes("refund")) {
    return "payment";
  }
  if (combined.includes("dispatch") || combined.includes("courier") || combined.includes("transit") || combined.includes("shipped") || combined.includes("delivered") || combined.includes("driver")) {
    return "delivery";
  }
  if (combined.includes("order") || combined.includes("item") || combined.includes("invoice") || rawData?.order_id || rawData?.order_number) {
    return "order";
  }
  if (combined.includes("safety") || combined.includes("recall") || combined.includes("regulatory") || combined.includes("clinical") || combined.includes("ppb")) {
    return "clinical";
  }
  if (combined.includes("deal") || combined.includes("discount") || combined.includes("offer") || combined.includes("sale") || combined.includes("price")) {
    return "promo";
  }
  return "system";
}

export const usePushNotifications = () => {
  const queryClient = useQueryClient();
  const oneSignalRef = useRef<OneSignalModule | null>(null);

  const loadOneSignal = async () => {
    if (Constants.appOwnership === "expo") {
      return null;
    }

    try {
      return await import("react-native-onesignal");
    } catch (error) {
      console.warn("OneSignal is unavailable in this build:", error);
      return null;
    }
  };

  const onPermissionChange = (granted: boolean) => {
    const OneSignal = oneSignalRef.current?.OneSignal;
    if (!OneSignal) return;

    if (!granted) {
      OneSignal.Notifications.requestPermission(true);
    }
  };

  const onSubscriptionChange = (subscription: PushSubscriptionChangedState) => {
    if (!oneSignalRef.current?.OneSignal) return;

    if (subscription.current.id) {
      PlayerStorage.setPlayerIdToken(subscription.current.id);
    }
  };

  const onNotificationClick = async (event: NotificationClickEvent) => {
    const title = event.notification.title || "Order Update";
    const body = event.notification.body || "Your order status has changed.";
    const additionalData = event.notification.additionalData as any;

    const notification: NotificationType = {
      id: event.notification.notificationId || `notif-${Date.now()}`,
      title,
      body,
      category: inferCategory(title, body, additionalData),
      read: true,
      timestamp: Date.now(),
      additionalData,
    };

    useNotificationStore.getState().addNotification(notification);

    await queryClient.invalidateQueries({
      queryKey: ["orders"],
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.all,
    });

    const screenName = notification.additionalData?.screen_name;
    const orderId = notification.additionalData?.order_id;

    if (typeof screenName === "string" && screenName.length > 0) {
      router.navigate(`/order-history/${screenName}` as any);
    } else if (orderId) {
      router.navigate("/order-history" as any);
    } else {
      router.navigate("/notifications" as any);
    }
  };

  const onForegroundWillDisplay = async (
    event: NotificationWillDisplayEvent
  ) => {
    const title = event.notification.title || "Medical Alert";
    const body = event.notification.body || "You have a new update.";
    const additionalData = event.notification.additionalData as any;

    const notification: NotificationType = {
      id: event.notification.notificationId || `notif-${Date.now()}`,
      title,
      body,
      category: inferCategory(title, body, additionalData),
      read: false,
      timestamp: Date.now(),
      additionalData,
    };

    const isSuccess =
      additionalData?.status === "completed" ||
      additionalData?.status === "paid" ||
      additionalData?.status === "shipped";
    const notify = isSuccess ? toast.success : toast.info;

    notify(title, {
      description: body || "Tap to view the notification details.",
    });

    await queryClient.invalidateQueries({
      queryKey: ["orders"],
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.all,
    });

    useNotificationStore.getState().addNotification(notification);
  };

  const initializeEventListeners = () => {
    const OneSignal = oneSignalRef.current?.OneSignal;
    if (!OneSignal) return;

    OneSignal.User.pushSubscription.addEventListener(
      "change",
      onSubscriptionChange
    );
    OneSignal.Notifications.addEventListener("click", onNotificationClick);
    OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      onForegroundWillDisplay
    );
    OneSignal.Notifications.addEventListener(
      "permissionChange",
      onPermissionChange
    );
  };

  const removeEventListeners = () => {
    const OneSignal = oneSignalRef.current?.OneSignal;
    if (!OneSignal) return;

    OneSignal.User.pushSubscription.removeEventListener(
      "change",
      onSubscriptionChange
    );
    OneSignal.Notifications.removeEventListener("click", onNotificationClick);
    OneSignal.Notifications.removeEventListener(
      "foregroundWillDisplay",
      onForegroundWillDisplay
    );
    OneSignal.Notifications.removeEventListener(
      "permissionChange",
      onPermissionChange
    );
  };

  useEffect(() => {
    const setupNotifications = async () => {
      const oneSignalModule = await loadOneSignal();
      if (!oneSignalModule) return;

      oneSignalRef.current = oneSignalModule;
      const { OneSignal, LogLevel } = oneSignalModule;

      OneSignal.Debug.setLogLevel(LogLevel.Debug);
      OneSignal.initialize(Constants.expoConfig?.extra?.oneSignalAppId || "");

      const permission = await OneSignal.Notifications.getPermissionAsync();

      if (permission) {
        initializeEventListeners();
      } else {
        const permissionGranted =
          await OneSignal.Notifications.requestPermission(true);

        if (permissionGranted) {
          initializeEventListeners();
        } else {
          toast.info("Push notifications permissions denied", {
            description: "Enable push notifications in settings to stay updated.",
          });
        }
      }
    };

    setupNotifications();

    return () => {
      removeEventListeners();
    };
  }, []);
};
