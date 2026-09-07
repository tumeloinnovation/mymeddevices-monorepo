import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from "react-native";
import Icon from "@/components/common/Icon";
import CustomText from "@/components/common/CustomText";
import { useTheme } from "@react-navigation/native";
import { Colors } from "@/types/app";
import {
  useResponsiveDimensions,
  ResponsiveDimensions,
} from "@/hooks/useResponsiveDimensions";

interface RegisterStepProfileProps {
  formData: {
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    confirmPassword: string;
  };
  isLoading: boolean;
  onUpdateField: (field: string, val: string) => void;
  onSubmit: () => void;
}

export const RegisterStepProfile: React.FC<RegisterStepProfileProps> = ({
  formData,
  isLoading,
  onUpdateField,
  onSubmit,
}) => {
  const { colors, dark } = useTheme();
  const responsive = useResponsiveDimensions();
  const styles = createStyles(colors, responsive, dark);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const lastNameRef = React.useRef<TextInput>(null);
  const phoneRef = React.useRef<TextInput>(null);
  const passwordRef = React.useRef<TextInput>(null);
  const confirmPasswordRef = React.useRef<TextInput>(null);

  const profileValid =
    !!formData.firstName.trim() &&
    !!formData.lastName.trim() &&
    !!formData.phone.trim() &&
    !!formData.password.trim() &&
    !!formData.confirmPassword.trim();

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerBlock}>
        <CustomText style={styles.kicker}>STEP 3 OF 3</CustomText>
        <CustomText variant="h2" style={styles.heading}>
          Complete profile
        </CustomText>
        <CustomText variant="body" style={styles.subheading}>
          Enter your name and Safaricom phone number for easy M-Pesa checkout and delivery.
        </CustomText>
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        {/* Name Row */}
        <View style={styles.nameRow}>
          <View style={styles.halfWidth}>
            <CustomText style={styles.fieldLabel}>First Name</CustomText>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "firstName" && styles.inputWrapperFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(v) => onUpdateField("firstName", v)}
                placeholder="e.g. Sarah"
                placeholderTextColor={colors.textSecondary || colors.text + "50"}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="givenName"
                returnKeyType="next"
                editable={!isLoading}
                onSubmitEditing={() => lastNameRef.current?.focus()}
                onFocus={() => setFocusedField("firstName")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          <View style={styles.halfWidth}>
            <CustomText style={styles.fieldLabel}>Last Name</CustomText>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "lastName" && styles.inputWrapperFocused,
              ]}
            >
              <TextInput
                ref={lastNameRef}
                style={styles.input}
                value={formData.lastName}
                onChangeText={(v) => onUpdateField("lastName", v)}
                placeholder="Doe"
                placeholderTextColor={colors.textSecondary || colors.text + "50"}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="familyName"
                returnKeyType="next"
                editable={!isLoading}
                onSubmitEditing={() => phoneRef.current?.focus()}
                onFocus={() => setFocusedField("lastName")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
        </View>

        {/* Phone Field */}
        <View style={styles.fieldGroup}>
          <CustomText style={styles.fieldLabel}>Phone Number</CustomText>
          <View
            style={[
              styles.inputWrapper,
              focusedField === "phone" && styles.inputWrapperFocused,
            ]}
          >
            <Icon
              name="phone"
              size={18}
              color={
                focusedField === "phone"
                  ? colors.primary
                  : colors.textSecondary
              }
              style={styles.inputIcon}
            />
            <TextInput
              ref={phoneRef}
              style={styles.input}
              value={formData.phone}
              onChangeText={(v) => onUpdateField("phone", v)}
              placeholder="0712 345 678"
              placeholderTextColor={colors.textSecondary || colors.text + "50"}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              returnKeyType="next"
              editable={!isLoading}
              onSubmitEditing={() => passwordRef.current?.focus()}
              onFocus={() => setFocusedField("phone")}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        {/* Password Field */}
        <View style={styles.fieldGroup}>
          <CustomText style={styles.fieldLabel}>Password</CustomText>
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
              value={formData.password}
              onChangeText={(v) => onUpdateField("password", v)}
              placeholder="Create strong password"
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

        {/* Confirm Password Field */}
        <View style={styles.fieldGroup}>
          <CustomText style={styles.fieldLabel}>Confirm Password</CustomText>
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
              value={formData.confirmPassword}
              onChangeText={(v) => onUpdateField("confirmPassword", v)}
              placeholder="Confirm password"
              placeholderTextColor={colors.textSecondary || colors.text + "50"}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              returnKeyType="done"
              editable={!isLoading}
              onSubmitEditing={() => {
                if (profileValid && !isLoading) {
                  onSubmit();
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
              !profileValid && !isLoading && styles.primaryButtonInactive,
              isLoading && styles.primaryButtonLoading,
            ]}
            onPress={onSubmit}
            disabled={!profileValid || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Complete registration"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.primaryButtonContent}>
                <CustomText variant="button" style={styles.primaryButtonText}>
                  Create Account
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

export default RegisterStepProfile;

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
      gap: responsive.getSpacing(16),
    },
    nameRow: {
      flexDirection: "row",
      gap: 12,
    },
    halfWidth: {
      flex: 1,
      gap: 6,
    },
    fieldGroup: {
      gap: 6,
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
