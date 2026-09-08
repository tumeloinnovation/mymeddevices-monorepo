import React, { useState, useEffect } from "react";
import { TextInput } from "react-native";

export const useOtpHandling = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const otpInputRefs = React.useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    let nextValue = value;
    if (nextValue.length > 1) {
      nextValue = nextValue[nextValue.length - 1];
    }

    setOtp((prev) => {
      if (prev[index] === nextValue) return prev;
      const newOtp = [...prev];
      newOtp[index] = nextValue;
      return newOtp;
    });

    if (nextValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const resetOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    otpInputRefs.current[0]?.focus();
  };

  return {
    otp,
    setOtp,
    countdown,
    setCountdown,
    otpInputRefs,
    handleOtpChange,
    handleKeyPress,
    resetOtp,
  };
};
