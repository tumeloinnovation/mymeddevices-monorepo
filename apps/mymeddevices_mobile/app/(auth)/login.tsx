import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import CustomText from "@/components/common/CustomText";
import AuthTemplate from "@/features/auth/components/templates/AuthTemplate";
import LoginForm from "@/features/auth/components/organisms/LoginForm";
import { useLoginForm } from "@/features/auth/hooks/useLoginForm";
import { Colors } from "@/types/app";

export default function LoginScreen() {
  const { colors } = useTheme();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const loginState = useLoginForm(returnTo);
  const styles = createStyles(colors);

  const footer = (
    <View style={styles.registerContainer}>
      <CustomText variant="caption" style={styles.registerPrompt}>
        Don't have an account?{" "}
      </CustomText>
      <TouchableOpacity
        onPress={() => router.push("/(auth)/register")}
        disabled={loginState.isLoading}
        activeOpacity={0.6}
        accessibilityRole="link"
        accessibilityLabel="Create an account"
      >
        <CustomText variant="caption" style={styles.registerLink}>
          Sign Up
        </CustomText>
      </TouchableOpacity>
    </View>
  );

  return (
    <AuthTemplate
      onBack={loginState.handleBack}
      backLabel={loginState.backLabel}
      footerContent={footer}
    >
      <LoginForm {...loginState} />
    </AuthTemplate>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    registerContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 10,
    },
    registerPrompt: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    registerLink: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: 14,
    },
  });
