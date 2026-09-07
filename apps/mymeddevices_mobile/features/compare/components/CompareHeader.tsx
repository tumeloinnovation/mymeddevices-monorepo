import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Icon from "@/components/common/Icon";
import CustomText from "@/components/common/CustomText";
import { Colors } from "@/types/app";

interface CompareHeaderProps {
  colors: Colors;
  topInset: number;
  hasItems: boolean;
  onBack: () => void;
  onShare: () => void;
  onClear: () => void;
}

export const CompareHeader: React.FC<CompareHeaderProps> = ({
  colors,
  topInset,
  hasItems,
  onBack,
  onShare,
  onClear,
}) => {
  const styles = createStyles(colors, topInset);

  return (
    <View style={styles.topHeader}>
      <Pressable
        style={styles.headerIconBtn}
        onPress={onBack}
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <Icon name="chevron-left" size={24} color={colors.text} />
      </Pressable>
      <CustomText variant="h6" style={styles.headerTitle}>
        Compare Products
      </CustomText>
      <View style={styles.headerActions}>
        {hasItems && (
          <Pressable
            style={styles.headerIconBtn}
            onPress={onShare}
            accessibilityLabel="Share comparison"
            hitSlop={8}
          >
            <Icon name="share" size={22} color={colors.text} />
          </Pressable>
        )}
        <Pressable
          style={styles.headerIconBtn}
          onPress={onClear}
          accessibilityLabel="Clear comparison"
          hitSlop={8}
        >
          <Icon
            name="trash"
            size={24}
            color={colors.text}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default CompareHeader;

const createStyles = (colors: Colors, topInset: number) =>
  StyleSheet.create({
    topHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingBottom: 12,
      paddingTop: topInset,
      backgroundColor: colors.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 17,
      color: colors.text,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerIconBtn: {
      padding: 6,
    },
  });
