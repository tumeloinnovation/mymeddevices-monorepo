import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";

import { Colors } from "@/types/app";
import CustomButton from "./CustomButton";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We couldn't load the data. Please check your connection and try again.",
  onRetry,
  retryText = "Try Again",
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Icon name="wifi-off" size={56} color={colors.error} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <CustomButton title={retryText} size="medium" onPress={onRetry} />
      )}
    </View>
  );
};

export default ErrorState;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 24,
      width: "80%",
    },
  });
