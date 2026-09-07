import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";

import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";

export const MedicalTrustBadges: React.FC = () => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const trustItems = [
    {
      id: "warranty",
      icon: "shield-check" as const,
      iconColor: "#059669",
      label: "Official Warranty",
    },
    {
      id: "sterile",
      icon: "package" as const,
      iconColor: "#7C3AED",
      label: "Quality Sealed",
    },
    {
      id: "delivery",
      icon: "truck" as const,
      iconColor: "#D97706",
      label: "Countrywide Delivery",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {trustItems.map((item) => (
          <View key={item.id} style={styles.pill}>
            <Icon name={item.icon} size={12} color={item.iconColor} />
            <Text style={styles.pillText}>{item.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default MedicalTrustBadges;

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    container: {
      paddingVertical: 10,
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    scrollContent: {
      paddingHorizontal: 16,
      gap: 8,
      alignItems: "center",
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: dark ? "rgba(255,255,255,0.05)" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
    },
  });
