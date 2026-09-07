import { useState, useRef, useEffect } from "react";
import { TextInput } from "react-native";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { authService } from "@/services/auth.service";

export type ForgotPasswordStep = "email" | "otp" | "newPassword";

export const useForgotPasswordWizard = () => {
  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetData, setResetData] = useState<{ userId: string | number; token: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateEmail = () => {
    if (!email.trim()) {
      toast.error("Please enter your email address", {
        description: "We need a valid email to send the reset code.",
      });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address", {
        description: "Double-check for typos before submitting.",
      });
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      await authService.forgotPassword({
        email: email.trim().toLowerCase(),
      });

      toast.success("Verification code sent!", {
        description: "Check your email for the 6-digit code.",
      });
      setOtp(["", "", "", "", "", ""]);
      setPassword("");
      setConfirmPassword("");
      setStep("otp");
      setCountdown(60);
    } catch (error: any) {
      toast.error("Failed to send code", {
        description: error.message || "Please try again in a moment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6 - index);
      const newOtp = [...otp];
      for (let i = 0; i < digits.length; i++) {
        newOtp[index + i] = digits[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete code", {
        description: "The code should be exactly 6 digits.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verifyResetOTP({
        email: email.trim().toLowerCase(),
        code,
      });

      if (response.success && response.data) {
        setResetData({
          userId: response.data.user_id,
          token: response.data.reset_token,
        });
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setStep("newPassword");
        toast.success("Code verified!", {
          description: "You can now set a new password.",
        });
      } else {
        throw new Error(response.message || "Invalid verification code");
      }
    } catch (error: any) {
      toast.error("Verification failed", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim().toLowerCase() });
      toast.success("Code resent!", {
        description: "Check your email for the latest code.",
      });
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error("Failed to resend code", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (pwd: string): { isValid: boolean; message: string } => {
    if (pwd.length < 8) return { isValid: false, message: "Password must be at least 8 characters" };
    if (!/[A-Z]/.test(pwd)) return { isValid: false, message: "Must contain an uppercase letter" };
    if (!/[a-z]/.test(pwd)) return { isValid: false, message: "Must contain a lowercase letter" };
    if (!/[0-9]/.test(pwd)) return { isValid: false, message: "Must contain a number" };
    return { isValid: true, message: "" };
  };

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields", {
        description: "Both password fields must be filled out.",
      });
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match", {
        description: "Make sure both fields match exactly.",
      });
      return;
    }

    if (!resetData) {
      toast.error("Session expired", {
        description: "Please request a new verification code.",
      });
      setOtp(["", "", "", "", "", ""]);
      setPassword("");
      setConfirmPassword("");
      setStep("email");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword({
        email: email.trim().toLowerCase(),
        user_id: resetData.userId,
        token: resetData.token,
        password,
      });

      if (response.success) {
        toast.success("Password reset successful!", {
          description: "You can now sign in with your new password.",
        });
        setEmail("");
        setOtp(["", "", "", "", "", ""]);
        setPassword("");
        setConfirmPassword("");
        setResetData(null);
        setTimeout(() => router.replace("/(auth)/login"), 1500);
      } else {
        throw new Error(response.message || "Failed to reset password");
      }
    } catch (error: any) {
      toast.error("Password reset failed", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
};
