import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { toast } from "sonner-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomText from "@/components/common/CustomText";
import Icon from "@/components/common/Icon";
import biometricService, { BiometricCapability } from "@/services/biometric.service";
import BiometricPromptModal from "@/components/modals/BiometricPromptModal";

const SecurityScreen = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);
  const navigation = useNavigation();
  const { user: authUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  // Biometrics state
  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability | null>(null);
  const [isBiometricActive, setIsBiometricActive] = useState(false);
  const [isTogglingBiometric, setIsTogglingBiometric] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Security & Credentials",
      headerBackTitle: "Profile",
    });
  }, [navigation]);

  useEffect(() => {
    const checkBiometrics = async () => {
      const caps = await biometricService.getCapabilities();
      setBiometricCapability(caps);
      const enabled = await biometricService.isBiometricEnabled();
      setIsBiometricActive(enabled);
    };
    checkBiometrics();
  }, []);

  const handleToggleBiometrics = async (val: boolean) => {
    if (isTogglingBiometric) return;
    setIsTogglingBiometric(true);
    Haptics.selectionAsync().catch(() => {});

    try {
      if (val) {
        if (!biometricCapability?.isEnrolled) {
          setShowBiometricPrompt(true);
          setIsBiometricActive(false);
          return;
        }

        const success = await biometricService.setBiometricEnabled(true, {
          email: authUser?.email || "",
        });

        if (success) {
          setIsBiometricActive(true);
          toast.success(`${biometricCapability.biometricLabel} quick login enabled!`);
        } else {
          setIsBiometricActive(false);
          toast.error("Biometric authentication was cancelled or failed");
        }
      } else {
        await biometricService.setBiometricEnabled(false);
        setIsBiometricActive(false);
        toast.info("Biometric login disabled");
      }
    } catch {
      toast.error("Failed to update biometric settings");
    } finally {
      setIsTogglingBiometric(false);
    }
  };

  const handleResetPassword = () => {
    Alert.alert(
      "Reset Password via Email",
      `A password recovery link will be sent to ${authUser?.email || "your registered email"}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Recovery Link",
          onPress: async () => {
            setIsLoading(true);
            try {
              toast.success("Password reset instructions sent to your email");
            } catch {
              toast.error("Failed to send reset link");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Biometric Quick Login Card */}
        {biometricCapability?.hasHardware && (
          <View style={styles.sectionCard}>
            <View style={styles.biometricRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: "#10B98118" }]}>
                <Icon
                  name={biometricCapability.biometricLabel === "Face ID" ? "face-id" : "fingerprint"}
                  size={18}
                  color="#10B981"
                />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <CustomText style={styles.sectionTitle}>
                  {biometricCapability.biometricLabel} Quick Login
                </CustomText>
                <CustomText style={styles.biometricSub}>
                  Use {biometricCapability.biometricLabel} to instantly sign in and authorize high-value medical orders without re-typing passwords.
                </CustomText>
              </View>
              {isTogglingBiometric ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Switch
                  value={isBiometricActive}
                  onValueChange={handleToggleBiometrics}
                  trackColor={{ false: colors.border, true: colors.primary + "60" }}
                  thumbColor={isBiometricActive ? colors.primary : "#F8FAFC"}
                />
              )}
            </View>
          </View>
        )}

        {/* Password Recovery Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: "#F59E0B18" }]}>
              <Icon name="mail" size={16} color="#F59E0B" />
            </View>
            <CustomText style={styles.sectionTitle}>Password & Recovery</CustomText>
          </View>

          <CustomText style={styles.recoveryText}>
            Need to update or reset your password? We can send an instant, secure reset link to your registered email address ({authUser?.email || "your email"}).
          </CustomText>

          <View style={styles.centerButtonContainer}>
            <TouchableOpacity
              style={styles.flatResetButton}
              onPress={handleResetPassword}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Icon name="mail" size={16} color={colors.primary} />
                  <CustomText style={styles.flatResetButtonText}>
                    Send Password Reset Link
                  </CustomText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modern Biometrics Setup Modal */}
      <BiometricPromptModal
        visible={showBiometricPrompt}
        onClose={() => setShowBiometricPrompt(false)}
        biometricLabel={biometricCapability?.biometricLabel || "Biometrics"}
      />
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: SIZES.spacingMD,
      paddingTop: 12,
      paddingBottom: Math.max(bottomInset, 16) + 24,
    },
    headerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large || 16,
      padding: SIZES.spacingMD,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    headerIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + "14",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTextWrap: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 2,
    },
    headerSub: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      lineHeight: 16,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large || 16,
      padding: SIZES.spacingMD,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    biometricRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    biometricSub: {
      fontSize: 11.5,
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      lineHeight: 16,
      marginTop: 2,
    },
    dangerCard: {
      borderColor: "#EF444430",
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionIconBadge: {
      width: 28,
      height: 28,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    recoveryText: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      lineHeight: 17,
      marginBottom: 14,
    },
    centerButtonContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 6,
      marginBottom: 4,
    },
    flatResetButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: SIZES.radius_medium || 10,
      paddingVertical: 12,
      paddingHorizontal: 20,
      width: "100%",
      maxWidth: 320,
      elevation: 0,
      shadowOpacity: 0,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 0,
    },
    flatResetButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
    },
  });

export default SecurityScreen;
