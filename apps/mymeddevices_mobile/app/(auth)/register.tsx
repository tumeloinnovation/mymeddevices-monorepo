import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import CustomText from "@/components/common/CustomText";
import { triggerImpact, triggerSelection } from "@/utils/haptics";
import AuthTemplate from "@/features/auth/components/templates/AuthTemplate";
import RegisterStepEmail from "@/features/auth/components/organisms/RegisterStepEmail";
import RegisterStepOtp from "@/features/auth/components/organisms/RegisterStepOtp";
import RegisterStepProfile from "@/features/auth/components/organisms/RegisterStepProfile";
import { useRegistrationLogic } from "@/features/auth/hooks/useRegistrationLogic";
import { useOtpHandling } from "@/features/auth/hooks/useOtpHandling";
import { Colors } from "@/types/app";

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const logic = useRegistrationLogic();
  const otpHandling = useOtpHandling();
  const styles = createStyles(colors);

  const handleBack = () => {
    triggerSelection();
    if (logic.step > 1) {
      if (logic.step === 2) {
        otpHandling.resetOtp();
      }
      logic.setStep(logic.step - 1);
    } else {
      router.back();
    }
  };

  const handleContinueEmail = () => {
    triggerImpact();
    logic.handleSendOTP();
  };

  const handleVerify = () => {
    triggerImpact();
    logic.handleVerifyOTP(otpHandling.otp, otpHandling.setCountdown);
  };

  const handleCreate = () => {
    triggerImpact();
    logic.handleCompleteRegistration();
  };

  const handleResend = () => {
    triggerSelection();
    logic.handleResendOTP(otpHandling.setCountdown, otpHandling.resetOtp);
  };

  const footer = (
    <View style={styles.loginContainer}>
      <CustomText variant="caption" style={styles.loginPrompt}>
        Already have an account?{" "}
      </CustomText>
      <TouchableOpacity
        onPress={() =>
          router.push(
            returnTo
              ? { pathname: "/(auth)/login", params: { returnTo } }
              : "/(auth)/login"
          )
        }
        disabled={logic.isLoading}
        activeOpacity={0.6}
        accessibilityRole="link"
        accessibilityLabel="Sign in to your account"
      >
        <CustomText variant="caption" style={styles.loginLink}>
          Sign In
        </CustomText>
      </TouchableOpacity>
    </View>
  );

  return (
    <AuthTemplate
      onBack={handleBack}
      totalSteps={3}
      currentStep={logic.step}
      footerContent={footer}
    >
      {logic.step === 1 && (
        <RegisterStepEmail
          email={logic.email}
          setEmail={logic.setEmail}
          isLoading={logic.isLoading}
          onContinue={handleContinueEmail}
        />
      )}
      {logic.step === 2 && (
        <RegisterStepOtp
          email={logic.email}
          otp={otpHandling.otp}
          otpInputRefs={otpHandling.otpInputRefs}
          countdown={otpHandling.countdown}
          isLoading={logic.isLoading}
          onOtpChange={otpHandling.handleOtpChange}
          onKeyPress={otpHandling.handleKeyPress}
          onResend={handleResend}
          onChangeEmail={() => {
            otpHandling.resetOtp();
            logic.setStep(1);
          }}
          onVerify={handleVerify}
        />
      )}
      {logic.step === 3 && (
        <RegisterStepProfile
          formData={logic.formData}
          isLoading={logic.isLoading}
          onUpdateField={logic.updateField}
          onSubmit={handleCreate}
        />
      )}
    </AuthTemplate>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    loginContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 10,
    },
    loginPrompt: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    loginLink: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
    },
  });
