import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import CustomText from "@/components/common/CustomText";
import { Colors } from "@/types/app";
import {
  useResponsiveDimensions,
  ResponsiveDimensions,
} from "@/hooks/useResponsiveDimensions";
import OtpInputForm from "@/features/auth/components/molecules/OtpInputForm";

interface ForgotPasswordOtpStepProps {
  email: string;
  otp: string[];
  otpInputRefs: React.MutableRefObject<(TextInput | null)[]>;
  isLoading: boolean;
  countdown: number;
  onOtpChange: (value: string, index: number) => void;
  onKeyPress: (e: any, index: number) => void;
  onVerifyOTP: () => void;
  onResendOTP: () => void;
  onBackToEmail: () => void;
}

export const ForgotPasswordOtpStep: React.FC<ForgotPasswordOtpStepProps> = ({
  email,
  otp,
  otpInputRefs,
  isLoading,
  countdown,
  onOtpChange,
  onKeyPress,
  onVerifyOTP,
  onResendOTP,
  onBackToEmail,
}) => {
  const { colors } = useTheme();
  const responsive = useResponsiveDimensions();
  const styles = createStyles(colors, responsive);

  return (
    <View style={styles.container}>
      {/* Header Block */}
      <View style={styles.headerBlock}>
        <CustomText style={styles.kicker}>PASSWORD RECOVERY</CustomText>
        <CustomText variant="h2" style={styles.heading}>
          Verify code
        </CustomText>
        <View style={styles.identifierRow}>
          <CustomText variant="body" style={styles.subheading}>
            Enter the 6-digit recovery code sent to{" "}
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
        onVerify={onVerifyOTP}
        onResend={onResendOTP}
        onChangeEmail={onBackToEmail}
        verifyButtonLabel="Verify & Proceed"
        verifyButtonAccessibilityLabel="Verify recovery code"
      />
    </View>
  );
};

export default ForgotPasswordOtpStep;

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
