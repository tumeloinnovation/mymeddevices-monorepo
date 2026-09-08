import React from "react";
import { View, StyleSheet, TextInput } from "react-native";
import CustomText from "@/components/common/CustomText";
import { useTheme } from "@react-navigation/native";
import { Colors } from "@/types/app";
import {
  useResponsiveDimensions,
  ResponsiveDimensions,
} from "@/hooks/useResponsiveDimensions";
import OtpInputForm from "@/features/auth/components/molecules/OtpInputForm";

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
  const { colors } = useTheme();
  const responsive = useResponsiveDimensions();
  const styles = createStyles(colors, responsive);

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

      <OtpInputForm
        otp={otp}
        otpInputRefs={otpInputRefs}
        isLoading={isLoading}
        countdown={countdown}
        onOtpChange={onOtpChange}
        onKeyPress={onKeyPress}
        onVerify={onVerify}
        onResend={onResend}
        onChangeEmail={onChangeEmail}
        verifyButtonLabel="Verify & Continue"
        verifyButtonAccessibilityLabel="Verify code"
      />
    </View>
  );
};

export default RegisterStepOtp;

const createStyles = (
  colors: Colors,
  responsive: ResponsiveDimensions
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
  });
