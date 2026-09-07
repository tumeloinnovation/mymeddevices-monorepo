import React, { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import * as Updates from "expo-updates";
import * as Application from "expo-application";
import { toast } from "sonner-native";

import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { SIZES } from "@/styles/sizes";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const UpdateCheck = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "App Updates",
      headerBackTitle: "Back",
    });
  }, [navigation]);

  const {
    isUpdateAvailable,
    isChecking,
    isDownloading,
  } = Updates.useUpdates();

  const onFetchUpdateAsync = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        toast.info("Downloading update...", { description: "Installing latest build." });
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } else {
        toast.success("Up to date", {
          description: "You're running the latest version of MyMedDevices.",
        });
      }
    } catch (error) {
      toast.error("Update check failed", { description: "Please check your internet connection." });
    }
  };

  const currentVersion = Application.nativeApplicationVersion || "1.0.0";
  const buildNumber = Application.nativeBuildVersion || "1";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Hero Status Card */}
      <View style={styles.statusCard}>
        <View
          style={[
            styles.statusIconCircle,
            { backgroundColor: isUpdateAvailable ? colors.primary + "18" : "#10B98118" },
          ]}
        >
          <Icon
            name={isUpdateAvailable ? "sparkles" : "badge-check"}
            size={36}
            color={isUpdateAvailable ? colors.primary : "#10B981"}
          />
        </View>

        <Text style={styles.statusTitle}>
          {isUpdateAvailable ? "New Update Available!" : "You're on the Latest Version"}
        </Text>

        <Text style={styles.statusSubtitle}>
          {isUpdateAvailable
            ? "A newer build with medical device enhancements and security improvements is available."
            : `MyMedDevices v${currentVersion} (${buildNumber}) is fully up to date.`}
        </Text>

        <View style={styles.versionBadgeRow}>
          <View style={styles.versionPill}>
            <Text style={styles.versionPillLabel}>Installed Version</Text>
            <Text style={styles.versionPillValue}>v{currentVersion}</Text>
          </View>
          <View style={styles.versionPill}>
            <Text style={styles.versionPillLabel}>Environment</Text>
            <Text style={styles.versionPillValue}>Production (Kenya)</Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionCard}>
        {isUpdateAvailable ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => Updates.reloadAsync()}
            disabled={isDownloading}
            activeOpacity={0.8}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Install & Restart</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={onFetchUpdateAsync}
            disabled={isChecking}
            activeOpacity={0.8}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Check for Updates Now</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* What's New & Security Notes */}
      <View style={styles.releaseNotesCard}>
        <View style={styles.releaseHeader}>
          <Icon name="shield-check" size={18} color={colors.primary} />
          <Text style={styles.releaseTitle}>Automatic Over-The-Air (OTA) Updates</Text>
        </View>
        <Text style={styles.releaseBody}>
          Critical catalog synchronizations, M-Pesa payment optimizations, and regulatory updates are automatically deployed seamlessly without requiring a full store download.
        </Text>
      </View>
    </ScrollView>
  );
};

export default UpdateCheck;

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: SIZES.spacingMD,
      gap: 14,
      paddingBottom: Math.max(bottomInset, 16) + 24,
    },
    statusCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    statusIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    statusTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 6,
      textAlign: "center",
    },
    statusSubtitle: {
      fontSize: 13,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 18,
      opacity: 0.75,
      marginBottom: 20,
    },
    versionBadgeRow: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    versionPill: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      alignItems: "center",
    },
    versionPillLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.textSecondary || colors.text,
      opacity: 0.65,
    },
    versionPillValue: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginTop: 2,
    },
    actionCard: {
      gap: 10,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: SIZES.radius_medium,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    primaryBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    releaseNotesCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    releaseHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    releaseTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    releaseBody: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      lineHeight: 18,
      opacity: 0.75,
    },
  });
