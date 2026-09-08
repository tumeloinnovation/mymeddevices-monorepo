import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  View,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import CustomText from "@/components/common/CustomText";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";
import {
  useResponsiveDimensions,
  ResponsiveDimensions,
} from "@/hooks/useResponsiveDimensions";

interface ForgotPasswordResetStepProps {
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean | ((prev: boolean) => boolean)) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (val: boolean | ((prev: boolean) => boolean)) => void;
  isLoading: boolean;
  onResetPassword: () => void;
}

export const ForgotPasswordResetStep: React.FC<ForgotPasswordResetStepProps> = ({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isLoading,
  onResetPassword,
}) => {
  const { colors, dark } = useTheme();
  const responsive = useResponsiveDimensions();
  const styles = createStyles(colors, responsive, dark);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const confirmPasswordRef = React.useRef<TextInput>(null);
  const isValid = password.length >= 6 && confirmPassword.length >= 6 && password === confirmPassword;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBlock}>
        <CustomText style={styles.kicker}>PASSWORD RECOVERY</CustomText>
        <CustomText variant="h2" style={styles.heading}>
          Set new password
        </CustomText>
        <CustomText variant="body" style={styles.subheading}>
          Create a new strong password for your shopping account.
        </CustomText>
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        {/* New Password */}
        <View style={styles.fieldGroup}>
          <CustomText style={styles.fieldLabel}>New Password</CustomText>
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
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textSecondary || colors.text + "50"}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="next"
              editable={!isLoading}
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword((prev) => !prev)}
              disabled={isLoading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name={showPassword ? "eye" : "eye-off"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.fieldGroup}>
          <CustomText style={styles.fieldLabel}>Confirm New Password</CustomText>
          <View
            style={[
              styles.inputWrapper,
              focusedField === "confirmPassword" && styles.inputWrapperFocused,
            ]}
          >
            <Icon
              name="lock"
              size={18}
              color={
                focusedField === "confirmPassword"
                  ? colors.primary
                  : colors.textSecondary
              }
              style={styles.inputIcon}
            />
            <TextInput
              ref={confirmPasswordRef}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your new password"
              placeholderTextColor={colors.textSecondary || colors.text + "50"}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="done"
              editable={!isLoading}
              onSubmitEditing={() => {
                if (isValid && !isLoading) {
                  onResetPassword();
                }
              }}
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              disabled={isLoading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name={showConfirmPassword ? "eye" : "eye-off"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit CTA */}
        <View style={styles.buttonSpacing}>
          <Pressable
            style={[
              styles.primaryButton,
              !isValid && !isLoading && styles.primaryButtonInactive,
              isLoading && styles.primaryButtonLoading,
            ]}
            onPress={onResetPassword}
            disabled={!isValid || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Reset password and sign in"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.primaryButtonContent}>
                <CustomText variant="button" style={styles.primaryButtonText}>
                  Reset Password & Sign In
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

export default ForgotPasswordResetStep;

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
    formContainer: {
      gap: responsive.getSpacing(18),
    },
    fieldGroup: {
      gap: 8,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
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
    passwordToggle: {
      padding: 4,
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
