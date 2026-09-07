import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  View,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import CustomText from "@/components/common/CustomText";
import { Colors } from "@/types/app";
import {
  useResponsiveDimensions,
  ResponsiveDimensions,
} from "@/hooks/useResponsiveDimensions";

interface ForgotPasswordEmailStepProps {
  email: string;
  setEmail: (val: string) => void;
  isLoading: boolean;
  onSendOTP: () => void;
}

export const ForgotPasswordEmailStep: React.FC<ForgotPasswordEmailStepProps> = ({
  email,
  setEmail,
  isLoading,
  onSendOTP,
}) => {
  const { colors, dark } = useTheme();
  const responsive = useResponsiveDimensions();
  const styles = createStyles(colors, responsive, dark);
  const [focused, setFocused] = useState(false);

  const emailValid = email.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBlock}>
        <CustomText style={styles.kicker}>PASSWORD RECOVERY</CustomText>
        <CustomText variant="h2" style={styles.heading}>
          Reset password
        </CustomText>
        <CustomText variant="body" style={styles.subheading}>
          Enter your registered email address and we'll send you a 6-digit recovery code.
        </CustomText>
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        <View style={styles.fieldGroup}>
          <CustomText style={styles.fieldLabel}>Registered Email</CustomText>
          <View
            style={[
              styles.inputWrapper,
              focused && styles.inputWrapperFocused,
            ]}
          >
            <Icon
              name="mail"
              size={18}
              color={focused ? colors.primary : colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. sarah.wanjiku@gmail.com"
              placeholderTextColor={colors.textSecondary || colors.text + "50"}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="go"
              editable={!isLoading}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={onSendOTP}
              accessibilityLabel="Registered email address"
            />
            {email.length > 0 && !isLoading && (
              <TouchableOpacity
                onPress={() => setEmail("")}
                style={styles.clearBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Clear email"
              >
                <Icon name="close" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Send Code CTA */}
        <View style={styles.buttonSpacing}>
          <Pressable
            style={[
              styles.primaryButton,
              !emailValid && !isLoading && styles.primaryButtonInactive,
              isLoading && styles.primaryButtonLoading,
            ]}
            onPress={onSendOTP}
            disabled={!emailValid || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Send recovery code"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.primaryButtonContent}>
                <CustomText variant="button" style={styles.primaryButtonText}>
                  Send Recovery Code
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

export default ForgotPasswordEmailStep;

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
    clearBtn: {
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
