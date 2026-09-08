import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";

interface CheckoutSectionProps {
  index: number;
  activeIndex: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onEdit: () => void;
}

const CheckoutSection: React.FC<CheckoutSectionProps> = ({
  index,
  activeIndex,
  title,
  subtitle,
  children,
  onEdit,
}) => {
  const { colors } = useTheme();
  const isActive = index === activeIndex;
  const isCompleted = activeIndex > index;

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.card,
          borderColor: isActive
            ? colors.primary
            : isCompleted
            ? colors.border
            : colors.border,
          borderWidth: isActive ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <View
            style={[
              styles.stepBadge,
              isCompleted
                ? styles.stepCompleted
                : isActive
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.border + "60" },
            ]}
          >
            {isCompleted ? (
              <Icon name="check" size={15} color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.stepNumberText,
                  { color: isActive ? "#FFFFFF" : colors.textSecondary || colors.text },
                ]}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <View style={styles.headerTitles}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                { color: isCompleted ? colors.primary : colors.textSecondary || colors.text },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
        </View>
        {isCompleted && (
          <TouchableOpacity
            style={[styles.editPill, { backgroundColor: colors.primary + "12" }]}
            onPress={onEdit}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="pencil" size={12} color={colors.primary} />
            <Text style={[styles.editText, { color: colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isActive && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 14,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCompleted: {
    backgroundColor: "#10B981",
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: "700",
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  editPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  editText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionContent: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(150, 150, 150, 0.2)",
  },
});

export default CheckoutSection;
