import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Animated, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { triggerImpact, triggerNotification, triggerSelection } from "@/utils/haptics";
import { useAuth } from "@/context/AuthContext";
import { getAuthBackContext } from "@/features/auth/utils/backNavigation";
import biometricService, { BiometricCapability } from "@/services/biometric.service";

type FocusedField = "username" | "password" | null;
const LAST_EMAIL_KEY = "@mymed_last_login_username";

export const useLoginForm = (returnTo?: string) => {
  const { login, initialize } = useAuth();

  // Content-aware back context ("Back to Checkout", "Back to Home", ...)
  const backContext = useMemo(() => getAuthBackContext(returnTo), [returnTo]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);

  // Biometrics state
  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability | null>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // 1. Auto-Remember Last Email & Check Biometrics on Mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const savedUsername = await AsyncStorage.getItem(LAST_EMAIL_KEY);
        if (savedUsername && isMounted) {
          setUsername(savedUsername);
        }

        const caps = await biometricService.getCapabilities();
        const enabled = await biometricService.isBiometricEnabled();
        if (isMounted) {
          setBiometricCapability(caps);
          setIsBiometricEnabled(enabled && caps.hasHardware && caps.isEnrolled);
        }
      } catch {
        // Ignore read error
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Physical Error Shake Animation
  const triggerShake = useCallback(() => {
    triggerNotification();
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -9,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 9,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 45,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleBack = () => {
    triggerSelection();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(backContext.fallback);
    }
  };

  const handleClearUsername = () => {
    triggerSelection();
    setUsername("");
  };

  const handleTogglePassword = () => {
    triggerSelection();
    setShowPassword((prev) => !prev);
  };

  const handleBiometricLogin = async () => {
    triggerSelection();
    setIsBiometricLoading(true);

    try {
      const authResult = await biometricService.authenticate(
        `Sign in to MyMedDevices with ${biometricCapability?.biometricLabel || "Biometrics"}`
      );

      if (!authResult.success) {
        setIsBiometricLoading(false);
        return;
      }

      // Try re-initializing the auth session from saved tokens
      await initialize();

      toast.success("Welcome back!", {
        description: "Authenticated with " + (biometricCapability?.biometricLabel || "biometrics"),
      });

      if (returnTo === "checkout") {
        router.replace("/checkout");
      } else {
        router.replace("/");
      }
    } catch {
      toast.error("Biometric sign in failed", {
        description: "Please enter your password to sign in.",
      });
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      triggerShake();
      toast.error("Email or username is required", {
        description: "Please enter your email or username to continue.",
      });
      setFocusedField("username");
      return;
    }

    if (!password.trim()) {
      triggerShake();
      toast.error("Password is required", {
        description: "Please enter your password.",
      });
      passwordRef.current?.focus();
      return;
    }

    triggerImpact();
    setIsLoading(true);

    try {
      await login(username.trim(), password);
      
      // Save last used username
      AsyncStorage.setItem(LAST_EMAIL_KEY, username.trim()).catch(() => {});

      toast.success("Welcome back!", {
        description: "You're now signed in.",
      });

      if (returnTo === "checkout") {
        router.replace("/checkout");
      } else {
        router.replace("/");
      }
    } catch (error: any) {
      triggerShake();
      toast.error("Sign in failed", {
        description: error.message || "Invalid credentials. Please check your email and password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    returnTo,
    backLabel: backContext.label,
    username,
    setUsername,
    password,
    setPassword,
    isLoading,
    showPassword,
    setShowPassword,
    focusedField,
    setFocusedField,
    passwordRef,
    scaleAnim,
    shakeAnim,
    handlePressIn,
    handlePressOut,
    handleBack,
    handleClearUsername,
    handleTogglePassword,
    handleLogin,
    // Biometric props
    isBiometricEnabled,
    isBiometricLoading,
    biometricLabel: biometricCapability?.biometricLabel || "Biometrics",
    handleBiometricLogin,
  };
};

export default useLoginForm;
