import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from "react-native";
import Icon from "@/components/common/Icon";
import CustomText from "@/components/common/CustomText";
import { useTheme } from "@react-navigation/native";
import { Colors } from "@/types/app";
import {
  useResponsiveDimensions,
  ResponsiveDimensions,
} from "@/hooks/useResponsiveDimensions";

interface RegisterStepOtpProps {
  email: string;
  otp: string[];
  otpInputRefs: React.MutableRefObject<(TextInput | null)[]>;
  countdown: number;
  isLoading: boolean;
  onOtpChange: (value: string, index: number) => void;
  onKeyPress: (e: { nativeEvent: { key: string } }, index: number) => void;
  onResend: () => void;
  onChangeEmail: () => void;
  onVerify: () => void;
}

export const RegisterStepOtp: React.FC<RegisterStepOtpProps> = ({
  email,
  otp,
  otpInputRefs,
  countdown,
  isLoading,
  onOtpChange,
  onKeyPress,
  onResend,
  onChangeEmail,
  onVerify,
}) => {
  const { colors, dark } = useTheme();
  const responsive = useResponsiveDimensions();
  const styles = createStyles(colors, responsive, dark);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const otpComplete = otp.join("").length === 6;

  return (
    <View style={styles.container}>
      {/* Header Block */}
      <View style={styles.headerBlock}>
        <CustomText style={styles.kicker}>STEP 2 OF 3</CustomText>
        <CustomText variant="h2" style={styles.heading}>
          Verify your email
        </CustomText>
        <View style={styles.identifierRow}>
          <CustomText variant="body" style={styles.subheading}>
            We sent a 6-digit verification code to{" "}
            <CustomText style={styles.identifierEmail}>
              {email.trim()}
            </CustomText>
          </CustomText>
        </View>
      </View>

      {/* OTP Input Boxes */}
      <View style={styles.formContainer}>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => {
            const isFilled = !!digit;
            const isFocused = focusedIndex === index;

            return (
              <TextInput
                key={index}
                ref={(ref) => {
                  otpInputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpBox,
                  isFocused && styles.otpBoxFocused,
                  isFilled && styles.otpBoxFilled,
                  {
                    borderColor: isFocused
                      ? colors.primary
                      : isFilled
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                value={digit}
                onChangeText={(value) => onOtpChange(value, index)}
                onKeyPress={(e) => onKeyPress(e, index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
                accessibilityLabel={`Digit ${index + 1}`}
              />
            );
          })}
        </View>

        {/* Resend & Change Email Actions */}
        <View style={styles.actionsRow}>
          <View style={styles.resendWrapper}>
            <CustomText style={styles.resendPrompt}>
              Didn't receive code?{" "}
            </CustomText>
            {countdown > 0 ? (
              <CustomText style={styles.countdownText}>
                Resend in {countdown}s
              </CustomText>
            ) : (
              <TouchableOpacity
                onPress={onResend}
                disabled={isLoading}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <CustomText style={styles.resendLink}>Resend Code</CustomText>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={onChangeEmail}
            disabled={isLoading}
            style={styles.changeEmailBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <CustomText style={styles.changeEmailText}>Change Email</CustomText>
          </TouchableOpacity>
        </View>

        {/* Verify CTA */}
        <View style={styles.buttonSpacing}>
          <Pressable
            style={[
              styles.primaryButton,
              !otpComplete && !isLoading && styles.primaryButtonInactive,
              isLoading && styles.primaryButtonLoading,
            ]}
            onPress={onVerify}
            disabled={!otpComplete || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Verify code"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.primaryButtonContent}>
                <CustomText variant="button" style={styles.primaryButtonText}>
                  Verify & Continue
                </CustomText>
                <Icon name="chevron-right" size={18} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default RegisterStepOtp;

const createStyles = (
  colors: Colors,
  responsive: ResponsiveDimensions,
  dark: boolean
) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },
    headerBlock: {
      marginBottom: responsive.getSpacing(24),
    },
    kicker: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      color: colors.primary,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    heading: {
      fontSize: responsive.getFontSize(28),
      fontWeight: "800",
      color: colors.text,
      marginBottom: responsive.getSpacing(8),
      letterSpacing: -0.5,
    },
    subheading: {
      fontSize: responsive.getFontSize(14),
      color: colors.textSecondary,
      lineHeight: responsive.getFontSize(20),
    },
    identifierRow: {
      marginTop: 2,
    },
    identifierEmail: {
      fontWeight: "700",
      color: colors.text,
    },
    formContainer: {
      gap: responsive.getSpacing(20),
    },
    otpContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    otpBox: {
      flex: 1,
      height: 54,
      borderRadius: responsive.getBorderRadius(12),
      borderWidth: 1.5,
      textAlign: "center",
      fontSize: responsive.getFontSize(22),
      fontWeight: "700",
      color: colors.text,
      backgroundColor: colors.card,
    },
    otpBoxFocused: {
      borderColor: colors.primary,
      backgroundColor: dark ? colors.card : "#FFFFFF",
    },
    otpBoxFilled: {
      backgroundColor: dark ? colors.card : "#FFFFFF",
    },
    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12,
    },
    resendWrapper: {
      flexDirection: "row",
      alignItems: "center",
    },
    resendPrompt: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    countdownText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    resendLink: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
    },
    changeEmailBtn: {
      paddingVertical: 2,
    },
    changeEmailText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
    buttonSpacing: {
      marginTop: responsive.getSpacing(8),
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: responsive.getBorderRadius(14),
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    primaryButtonInactive: {
      opacity: 0.5,
      shadowOpacity: 0,
      elevation: 0,
    },
    primaryButtonLoading: {
      opacity: 0.85,
    },
    primaryButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 16,
    },
  });
