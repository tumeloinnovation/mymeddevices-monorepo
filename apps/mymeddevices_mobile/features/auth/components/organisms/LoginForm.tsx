import React from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Animated,
} from "react-native";
import Icon from "@/components/common/Icon";
import CustomText from "@/components/common/CustomText";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { Colors } from "@/types/app";
import {
  useResponsiveDimensions,
  ResponsiveDimensions,
} from "@/hooks/useResponsiveDimensions";

interface LoginFormProps {
  returnTo?: string;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  isLoading: boolean;
  showPassword: boolean;
  setShowPassword: (val: boolean | ((prev: boolean) => boolean)) => void;
  focusedField: "username" | "password" | null;
  setFocusedField: (field: "username" | "password" | null) => void;
  passwordRef: React.RefObject<TextInput | null>;
  scaleAnim: Animated.Value;
  shakeAnim: Animated.Value;
  handlePressIn: () => void;
  handlePressOut: () => void;
  handleClearUsername: () => void;
  handleTogglePassword: () => void;
  handleLogin: () => void;
  // Biometrics
  isBiometricEnabled?: boolean;
  isBiometricLoading?: boolean;
  biometricLabel?: string;
  handleBiometricLogin?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  returnTo,
  username,
  setUsername,
  password,
  setPassword,
  isLoading,
  showPassword,
  focusedField,
  setFocusedField,
  passwordRef,
  scaleAnim,
  shakeAnim,
  handlePressIn,
  handlePressOut,
  handleClearUsername,
  handleTogglePassword,
  handleLogin,
  isBiometricEnabled,
  isBiometricLoading,
  biometricLabel = "Biometrics",
  handleBiometricLogin,
}) => {
  const { colors, dark } = useTheme();
  const responsive = useResponsiveDimensions();
  const styles = createStyles(colors, responsive, dark);

  const isFormFilled = username.trim().length > 0 && password.trim().length > 0;

  // Context-aware subtitle
  const subtitle =
    returnTo === "checkout"
      ? "Sign in to complete your checkout and confirm delivery."
      : returnTo === "cart"
      ? "Sign in to sync your cart and proceed."
      : "Sign in to access your orders, saved devices, and account.";

  return (
    <View style={styles.container}>
      {/* 1. Clean Minimal Header */}
      <View style={styles.headerBlock}>
        <CustomText variant="h2" style={styles.heading}>
          Welcome back
        </CustomText>
        <CustomText variant="body" style={styles.subheading}>
          {subtitle}
        </CustomText>
      </View>

      {/* 2. Seamless Form Fields with Error Shake Animation */}
      <Animated.View
        style={[
          styles.formContainer,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        {/* Email or Username Field */}
        <View style={styles.fieldGroup}>
          <CustomText style={styles.fieldLabel}>Email or Username</CustomText>
          <View
            style={[
              styles.inputWrapper,
              focusedField === "username" && styles.inputWrapperFocused,
            ]}
          >
            <Icon
              name="user"
              size={18}
              color={
                focusedField === "username"
                  ? colors.primary
                  : colors.textSecondary
              }
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your email or username"
              placeholderTextColor={colors.textSecondary || colors.text + "50"}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              keyboardType="email-address"
              returnKeyType="next"
              editable={!isLoading}
              onSubmitEditing={() => passwordRef.current?.focus()}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField(null)}
              accessibilityLabel="Email or username"
            />
            {username.length > 0 && !isLoading && (
              <TouchableOpacity
                onPress={handleClearUsername}
                style={styles.clearBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Clear input"
              >
                <Icon name="close" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Password Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.passwordHeaderRow}>
            <CustomText style={styles.fieldLabel}>Password</CustomText>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              disabled={isLoading}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="link"
              accessibilityLabel="Forgot password?"
            >
              <CustomText style={styles.forgotPasswordText}>
                Forgot password?
              </CustomText>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.inputWrapper,
              focusedField === "password" && styles.inputWrapperFocused,
            ]}
          >
            <Icon
              name="lock"
              size={18}
              color={
                focusedField === "password"
                  ? colors.primary
                  : colors.textSecondary
              }
              style={styles.inputIcon}
            />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary || colors.text + "50"}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              editable={!isLoading}
              onSubmitEditing={handleLogin}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              accessibilityLabel="Password"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={handleTogglePassword}
              disabled={isLoading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
            >
              <Icon
                name={showPassword ? "eye" : "eye-off"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign In Primary CTA */}
        <View style={styles.buttonSpacing}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], width: "100%" }}>
            <Pressable
              style={[
                styles.primaryButton,
                !isFormFilled && !isLoading && styles.primaryButtonInactive,
                isLoading && styles.primaryButtonLoading,
              ]}
              onPress={handleLogin}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={!isFormFilled || isLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.primaryButtonContent}>
                  <CustomText variant="button" style={styles.primaryButtonText}>
                    Sign In
                  </CustomText>
                  <Icon name="chevron-right" size={18} color="#FFFFFF" />
                </View>
              )}
            </Pressable>
          </Animated.View>

          {/* Biometric Quick Login Action */}
          {isBiometricEnabled && handleBiometricLogin && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={isLoading || isBiometricLoading}
              activeOpacity={0.8}
            >
              {isBiometricLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Icon
                    name={biometricLabel === "Face ID" ? "face-id" : "fingerprint"}
                    size={20}
                    color={colors.primary}
                  />
                  <CustomText style={styles.biometricButtonText}>
                    Sign in with {biometricLabel}
                  </CustomText>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

export default LoginForm;

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
    heading: {
      fontSize: responsive.getFontSize(26),
      fontWeight: "800",
      letterSpacing: -0.5,
      marginBottom: responsive.getSpacing(6),
    },
    subheading: {
      fontSize: responsive.getFontSize(14),
      color: colors.textSecondary,
      lineHeight: 20,
    },
    formContainer: {
      gap: responsive.getSpacing(16),
    },
    fieldGroup: {
      gap: responsive.getSpacing(6),
    },
    fieldLabel: {
      fontSize: responsive.getFontSize(13),
      fontWeight: "600",
      color: colors.text,
    },
    passwordHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    forgotPasswordText: {
      fontSize: responsive.getFontSize(12),
      color: colors.primary,
      fontWeight: "600",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: dark ? "#1E293B" : "#F8FAFC",
      borderRadius: responsive.getBorderRadius(14),
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: responsive.getSpacing(14),
      height: 52,
    },
    inputWrapperFocused: {
      borderColor: colors.primary,
    },
    inputIcon: {
      marginRight: responsive.getSpacing(10),
    },
    input: {
      flex: 1,
      fontSize: responsive.getFontSize(15),
      color: colors.text,
      height: "100%",
    },
    clearBtn: {
      padding: 4,
    },
    passwordToggle: {
      padding: 4,
    },
    buttonSpacing: {
      marginTop: responsive.getSpacing(8),
      gap: 12,
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
      fontSize: responsive.getFontSize(15),
      fontWeight: "700",
    },
    biometricButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      height: 50,
      borderRadius: responsive.getBorderRadius(14),
      borderWidth: 1.5,
      borderColor: colors.primary + "35",
      backgroundColor: colors.primary + "0A",
    },
    biometricButtonText: {
      fontSize: responsive.getFontSize(14),
      fontWeight: "700",
      color: colors.primary,
    },
  });
