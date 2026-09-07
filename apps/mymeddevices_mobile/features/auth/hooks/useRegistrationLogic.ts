import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";
import { authService } from "@/services/auth.service";
import { customerApi } from "@/features/user/services/customer.api";
import { mergeCustomerIntoUser, useAuthStore } from "@/stores/useAuthStore";
import { validateEmail, validateRegistrationForm } from "@/utils/validationUtils";

export const useRegistrationLogic = () => {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { setUser, setTokens, setCustomer } = useAuthStore();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendOTP = async () => {
    if (!validateEmail(email)) return;

    setIsLoading(true);

    try {
      const response = await authService.registerInitiate({
        email: email.trim().toLowerCase(),
        role: "customer",
      });

      if (response.success) {
        toast.success("Verification code sent!", {
          description: "Check your email for the code.",
        });
        setStep(2);
      } else {
        throw new Error(response.message || "Failed to send verification code");
      }
    } catch (error: any) {
      toast.error("Failed to send verification code", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async (setCountdown: (value: number) => void, resetOtp: () => void) => {
    setIsLoading(true);

    try {
      const response = await authService.resendOTP(email.trim().toLowerCase(), "verification");

      if (response.success) {
        toast.success("Code resent!", {
          description: "Check your email for the updated code.",
        });
        setCountdown(60);
        resetOtp();
      } else {
        throw new Error(response.message || "Failed to resend code");
      }
    } catch (error: any) {
      toast.error("Failed to resend code", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string[], _setCountdown: (value: number) => void) => {
    const code = otp.join("");

    if (code.length !== 6) {
      toast.error("Please enter the complete code", {
        description: "The code must be six digits long.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const verifyResponse = await authService.verifyOTP({
        email: email.trim().toLowerCase(),
        code,
        purpose: "verification",
      });

      if (!verifyResponse.success) {
        throw new Error(verifyResponse.message || "Invalid verification code");
      }

      toast.success("Email verified!", {
        description: "Continue to complete your profile.",
      });
      setStep(3);
    } catch (error: any) {
      toast.error("Verification failed", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!validateRegistrationForm(formData)) return;

    setIsLoading(true);

    try {
      const registerResponse = await authService.registerComplete({
        email: email.trim().toLowerCase(),
        password: formData.password,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim(),
      });

      if (registerResponse.success && registerResponse.data) {
        setTokens(registerResponse.data.access_token, registerResponse.data.refresh_token);
        const storedUser = await authService.getStoredUser();
        setUser(storedUser);

        if (storedUser) {
          try {
            const customer = await customerApi.getCustomer(storedUser.id);
            if (customer) {
              setCustomer(customer);
              setUser(mergeCustomerIntoUser(storedUser, customer));
            }
          } catch (error) {
            console.warn('Failed to fetch customer data after registration:', error);
          }
        }

        toast.success("Account created successfully!", {
          description: "You're now signed in and ready to shop.",
        });

        if (returnTo === "checkout") {
          router.replace("/checkout");
        } else {
          router.replace("/");
        }
      } else {
        throw new Error(registerResponse.message || "Registration failed");
      }
    } catch (error: any) {
      toast.error("Registration failed", {
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
    formData,
    updateField,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isLoading,
    setIsLoading,
    handleSendOTP,
    handleResendOTP,
    handleVerifyOTP,
    handleCompleteRegistration,
  };
};
