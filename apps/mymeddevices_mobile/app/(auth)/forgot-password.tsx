import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import CustomText from "@/components/common/CustomText";
import { triggerSelection } from "@/utils/haptics";
import AuthTemplate from "@/features/auth/components/templates/AuthTemplate";
import ForgotPasswordEmailStep from "@/features/auth/components/organisms/ForgotPasswordEmailStep";
import ForgotPasswordOtpStep from "@/features/auth/components/organisms/ForgotPasswordOtpStep";
import ForgotPasswordResetStep from "@/features/auth/components/organisms/ForgotPasswordResetStep";
import { useForgotPasswordWizard } from "@/features/auth/hooks/useForgotPasswordWizard";
import { Colors } from "@/types/app";

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const {
    step,
    setStep,
    email,
    setEmail,
    otp,
    setOtp,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isLoading,
    countdown,
    otpInputRefs,
    handleSendOTP,
    handleOtpChange,
    handleKeyPress,
    handleVerifyOTP,
    handleResendOTP,
    handleResetPassword,
  } = useForgotPasswordWizard();

  const handleBack = () => {
    triggerSelection();
    if (step === "newPassword") {
      setPassword("");
      setConfirmPassword("");
      setOtp(["", "", "", "", "", ""]);
      setStep("otp");
    } else if (step === "otp") {
      setOtp(["", "", "", "", "", ""]);
      setStep("email");
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(auth)/login");
      }
    }
  };

  const currentStepNumber =
    step === "email" ? 1 : step === "otp" ? 2 : 3;

  const footer = (
    <View style={styles.loginContainer}>
      <CustomText variant="caption" style={styles.loginPrompt}>
        Remember your password?{" "}
      </CustomText>
      <TouchableOpacity
        onPress={() => router.push("/(auth)/login")}
        disabled={isLoading}
        activeOpacity={0.6}
        accessibilityRole="link"
        accessibilityLabel="Back to sign in"
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
      currentStep={currentStepNumber}
      footerContent={footer}
    >
      {step === "email" && (
        <ForgotPasswordEmailStep
          email={email}
          setEmail={setEmail}
          isLoading={isLoading}
          onSendOTP={handleSendOTP}
        />
      )}

      {step === "otp" && (
        <ForgotPasswordOtpStep
          email={email}
          otp={otp}
          otpInputRefs={otpInputRefs}
          isLoading={isLoading}
          countdown={countdown}
          onOtpChange={handleOtpChange}
          onKeyPress={handleKeyPress}
          onVerifyOTP={handleVerifyOTP}
          onResendOTP={handleResendOTP}
          onBackToEmail={() => {
            setOtp(["", "", "", "", "", ""]);
            setStep("email");
          }}
        />
      )}

      {step === "newPassword" && (
        <ForgotPasswordResetStep
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          isLoading={isLoading}
          onResetPassword={handleResetPassword}
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
      fontWeight: "700",
      fontSize: 14,
    },
  });
