import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Colors } from "@/types/app";

interface StepDotsProps {
  totalSteps: number;
  currentStep: number;
}

export const StepDots: React.FC<StepDotsProps> = ({ totalSteps, currentStep }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, currentStep === index + 1 && styles.dotActive]}
        />
      ))}
    </View>
  );
};

export default StepDots;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    dotsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    dotActive: {
      width: 18,
      backgroundColor: colors.primary,
    },
  });
