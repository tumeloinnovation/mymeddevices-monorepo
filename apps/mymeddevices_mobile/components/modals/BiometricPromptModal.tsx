import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Linking,
  Pressable,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import * as IntentLauncher from "expo-intent-launcher";
import * as Haptics from "expo-haptics";
import CustomText from "@/components/common/CustomText";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";

interface BiometricPromptModalProps {
  visible: boolean;
  onClose: () => void;
  biometricLabel?: string;
  onSettingsOpened?: () => void;
}

export const BiometricPromptModal: React.FC<BiometricPromptModalProps> = ({
  visible,
  onClose,
  biometricLabel = "Biometrics",
  onSettingsOpened,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const handleOpenSettings = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onClose();
    onSettingsOpened?.();

    if (Platform.OS === "android") {
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.SECURITY_SETTINGS
        );
      } catch {
        Linking.openSettings().catch(() => {});
      }
    } else {
      Linking.openSettings().catch(() => {});
    }
  };

  const handleDismiss = () => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
  };

  const isFaceId = biometricLabel.toLowerCase().includes("face");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.overlay} onPress={handleDismiss}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* Decorative Top Pill Handle */}
          <View style={styles.handle} />

          {/* Biometric Icon Pill / Badge */}
          <View style={styles.iconCircle}>
            <View style={styles.innerIconCircle}>
              <Icon
                name={isFaceId ? "face-id" : "fingerprint"}
                size={34}
                color={colors.primary}
              />
            </View>
          </View>

          {/* Heading */}
          <CustomText style={styles.title}>
            {biometricLabel} Not Set Up
          </CustomText>

          {/* Body Description */}
          <CustomText style={styles.description}>
            Enable {biometricLabel} in your device settings to securely log in and authorize medical orders with a single tap.
          </CustomText>

          {/* Primary Action Button - Open Settings */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleOpenSettings}
          >
            <Icon name="settings" size={18} color="#FFFFFF" />
            <CustomText style={styles.primaryButtonText}>
              Open Device Settings
            </CustomText>
          </TouchableOpacity>

          {/* Secondary Action - Dismiss */}
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={handleDismiss}
          >
            <CustomText style={styles.secondaryButtonText}>
              Maybe Later
            </CustomText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    container: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: colors.card,
      borderRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 22,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border + "60",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 16,
      opacity: 0.8,
    },
    iconCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: colors.primary + "12",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    innerIconCircle: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.primary + "22",
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary || colors.text,
      opacity: 0.8,
      textAlign: "center",
      marginBottom: 24,
      paddingHorizontal: 6,
    },
    primaryButton: {
      width: "100%",
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 14,
      borderRadius: 14,
      marginBottom: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    secondaryButton: {
      width: "100%",
      paddingVertical: 11,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
    },
    secondaryButtonText: {
      color: colors.textSecondary || colors.text,
      fontSize: 14,
      fontWeight: "500",
      opacity: 0.8,
    },
  });

export default BiometricPromptModal;
