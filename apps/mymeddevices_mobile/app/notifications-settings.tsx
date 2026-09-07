import React, { useLayoutEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { toast } from "sonner-native";

import Icon, { IconName } from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { SIZES } from "@/styles/sizes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNotificationStore,
  NotificationPreferences,
} from "@/stores/useNotificationStore";
import { syncOneSignalPreferences } from "@/services/notification.service";

interface SettingToggleItem {
  id: keyof NotificationPreferences;
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
}

const ORDER_SETTINGS: SettingToggleItem[] = [
  {
    id: "orderUpdates",
    title: "Order & Packing Updates",
    subtitle: "Get notified when your order is confirmed and packed.",
    icon: "receipt",
    color: "#2563EB",
  },
  {
    id: "deliveryAlerts",
    title: "Delivery & Arrival Alerts",
    subtitle: "Real-time updates when your package is out for delivery.",
    icon: "truck",
    color: "#8B5CF6",
  },
  {
    id: "mpesaReceipts",
    title: "M-Pesa Payment Confirmations",
    subtitle: "Instant notifications for M-Pesa receipts and payment status.",
    icon: "hand-coins",
    color: "#10B981",
  },
];

const CLINICAL_SETTINGS: SettingToggleItem[] = [
  {
    id: "clinicalAdvisories",
    title: "Device Safety & Usage Tips",
    subtitle: "Helpful advice on how to use and maintain your devices.",
    icon: "shield-check",
    color: "#059669",
  },
  {
    id: "priceDrops",
    title: "Offers & Price Drops",
    subtitle: "Special discounts and sales on popular health monitors and items.",
    icon: "sparkles",
    color: "#EC4899",
  },
  {
    id: "newsletter",
    title: "Health & New Arrivals",
    subtitle: "Updates on new health devices and wellness essentials.",
    icon: "stethoscope",
    color: "#F59E0B",
  },
];

const DEVICE_SETTINGS: SettingToggleItem[] = [
  {
    id: "soundEnabled",
    title: "App Sounds",
    subtitle: "Play alert tones when notifications arrive.",
    icon: "bell-ring",
    color: "#3B82F6",
  },
  {
    id: "vibrateEnabled",
    title: "Vibration",
    subtitle: "Vibrate your phone for important delivery alerts.",
    icon: "repeat",
    color: "#6B7280",
  },
];

const NotificationSettingsPage = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);
  const navigation = useNavigation();

  const { preferences, updatePreference, resetPreferences } = useNotificationStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Notification Settings",
      headerBackTitle: "Back",
    });
  }, [navigation]);

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    updatePreference(key, value);
    const updated = { ...preferences, [key]: value };
    void syncOneSignalPreferences(updated);
    toast.success("Preferences updated");
  };

  const handleReset = () => {
    resetPreferences();
    void syncOneSignalPreferences({
      orderUpdates: true,
      deliveryAlerts: true,
      mpesaReceipts: true,
      priceDrops: true,
      clinicalAdvisories: true,
      newsletter: false,
      soundEnabled: true,
      vibrateEnabled: true,
    });
    toast.info("Reset to default notification preferences");
  };

  const renderSection = (title: string, items: SettingToggleItem[]) => (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={[styles.cardGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {items.map((item, index) => {
          const isEnabled = preferences[item.id];
          const isLast = index === items.length - 1;

          return (
            <View
              key={item.id}
              style={[
                styles.settingRow,
                !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + "14" }]}>
                <Icon name={item.icon} size={18} color={item.color} />
              </View>

              <View style={styles.textWrap}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.itemSubtitle, { color: colors.textSecondary || colors.text }]}>
                  {item.subtitle}
                </Text>
              </View>

              <Switch
                value={isEnabled}
                onValueChange={(val) => handleToggle(item.id, val)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === "ios" ? "#FFFFFF" : isEnabled ? "#FFFFFF" : "#F4F3F4"}
              />
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Hero Overview */}
      <View style={styles.heroCard}>
        <View style={[styles.heroIconBox, { backgroundColor: colors.primary + "14" }]}>
          <Icon name="bell-ring" size={26} color={colors.primary} />
        </View>
        <Text style={styles.heroTitle}>Notification Preferences</Text>
        <Text style={styles.heroSubtitle}>
          Choose the order, delivery, and discount notifications you'd like to receive.
        </Text>
      </View>

      {/* Sections */}
      {renderSection("Order & Delivery Updates", ORDER_SETTINGS)}
      {renderSection("Discounts & Health Updates", CLINICAL_SETTINGS)}
      {renderSection("Sound & Vibration", DEVICE_SETTINGS)}

      {/* Reset Button */}
      <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
        <Icon name="refresh" size={14} color={colors.textSecondary || colors.text} />
        <Text style={[styles.resetBtnText, { color: colors.textSecondary || colors.text }]}>
          Reset to Default
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default NotificationSettingsPage;

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: SIZES.spacingMD,
      gap: 16,
      paddingBottom: Math.max(bottomInset, 16) + 24,
    },
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    heroIconBox: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 6,
    },
    heroSubtitle: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 18,
      opacity: 0.8,
    },
    sectionBlock: {
      gap: 8,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary || colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      opacity: 0.75,
      paddingHorizontal: 4,
    },
    cardGroup: {
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    textWrap: {
      flex: 1,
      gap: 2,
      paddingRight: 6,
    },
    itemTitle: {
      fontSize: 13,
      fontWeight: "600",
    },
    itemSubtitle: {
      fontSize: 11,
      lineHeight: 15,
      opacity: 0.7,
    },
    resetBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      marginTop: 4,
    },
    resetBtnText: {
      fontSize: 13,
      fontWeight: "600",
    },
  });
