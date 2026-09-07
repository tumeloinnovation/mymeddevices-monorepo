import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type NotificationCategory =
  | "order"
  | "payment"
  | "delivery"
  | "clinical"
  | "promo"
  | "system";

export type additionalObject = {
  order_id?: number | string;
  order_number?: number | string;
  status?: string;
  screen_name?: string;
  tracking_number?: string | null;
  product_id?: string | number;
  url?: string;
};

// Define the notification structure
export type NotificationType = {
  id: string; // Unique ID for each notification
  title: string; // Notification title
  body: string; // Notification body
  category?: NotificationCategory;
  additionalData?: additionalObject;
  read: boolean; // Flag to mark if notification is read
  timestamp: number; // Timestamp of when notification was received (ms)
};

export interface NotificationPreferences {
  orderUpdates: boolean;
  deliveryAlerts: boolean;
  mpesaReceipts: boolean;
  priceDrops: boolean;
  clinicalAdvisories: boolean;
  newsletter: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}

// Define the notification store
type NotificationStore = {
  notifications: NotificationType[]; // List of notifications
  preferences: NotificationPreferences;
  addNotification: (notification: NotificationType) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  updatePreference: (key: keyof NotificationPreferences, value: boolean) => void;
  resetPreferences: () => void;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  orderUpdates: true,
  deliveryAlerts: true,
  mpesaReceipts: true,
  priceDrops: true,
  clinicalAdvisories: true,
  newsletter: false,
  soundEnabled: true,
  vibrateEnabled: true,
};

// Create the zustand store with persistence using AsyncStorage
export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      preferences: DEFAULT_PREFERENCES,

      addNotification: (notification: NotificationType) => {
        set((state) => {
          // Deduplicate by ID
          const existingIndex = state.notifications.findIndex((n) => n.id === notification.id);
          let newNotifications: NotificationType[];
          if (existingIndex >= 0) {
            newNotifications = [...state.notifications];
            newNotifications[existingIndex] = {
              ...newNotifications[existingIndex],
              ...notification,
            };
          } else {
            newNotifications = [notification, ...state.notifications];
          }
          // Cap at 50 notifications
          return { notifications: newNotifications.slice(0, 50) };
        });
      },

      markAsRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notif) => ({
            ...notif,
            read: true,
          })),
        }));
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((notif) => notif.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      updatePreference: (key, value) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: value,
          },
        }));
      },

      resetPreferences: () => {
        set({ preferences: DEFAULT_PREFERENCES });
      },
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
