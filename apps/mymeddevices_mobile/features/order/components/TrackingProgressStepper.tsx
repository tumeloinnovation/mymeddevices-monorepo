import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

export interface StepInfo {
  id: string;
  title: string;
  desc: string;
  icon: "badge-check" | "clock" | "package" | "truck" | "map-pin" | "user-round" | "x-circle";
  isCompleted: boolean;
  isActive: boolean;
}

interface TrackingProgressStepperProps {
  steps: StepInfo[];
}

export const TrackingProgressStepper: React.FC<TrackingProgressStepperProps> = ({ steps }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.timelineCard}>
      <Text style={styles.timelineTitle}>Delivery Progress</Text>

      <View style={styles.stepsList}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isNodeActive = step.isActive || step.isCompleted;

          return (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepIconCol}>
                <View
                  style={[
                    styles.stepIconCircle,
                    {
                      backgroundColor: step.isCompleted
                        ? colors.primary
                        : step.isActive
                        ? colors.primary + "20"
                        : colors.card,
                      borderColor: isNodeActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Icon
                    name={step.icon}
                    size={12}
                    color={
                      step.isCompleted
                        ? "#FFFFFF"
                        : step.isActive
                        ? colors.primary
                        : colors.textSecondary || colors.text
                    }
                  />
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.stepLine,
                      { backgroundColor: step.isCompleted ? colors.primary : colors.border },
                    ]}
                  />
                )}
              </View>

              <View style={styles.stepInfo}>
                <Text
                  style={[
                    styles.stepTitle,
                    {
                      color: isNodeActive ? colors.text : colors.textSecondary || colors.text,
                      fontWeight: isNodeActive ? "700" : "500",
                    },
                  ]}
                >
                  {step.title}
                </Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default React.memo(TrackingProgressStepper);

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    timelineCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    timelineTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 16,
    },
    stepsList: {
      gap: 0,
    },
    stepRow: {
      flexDirection: "row",
      minHeight: 52,
    },
    stepIconCol: {
      alignItems: "center",
      width: 28,
      marginRight: 12,
    },
    stepIconCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    stepLine: {
      width: 2,
      flex: 1,
      marginVertical: 2,
    },
    stepInfo: {
      flex: 1,
      paddingBottom: 14,
    },
    stepTitle: {
      fontSize: 13,
    },
    stepDesc: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.65,
      marginTop: 2,
      lineHeight: 15,
    },
  });
