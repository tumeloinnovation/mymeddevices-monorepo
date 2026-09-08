import React, { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import CustomText from "@/components/common/CustomText";
import { Colors } from "@/types/app";

interface CompareRowProps {
  label: string;
  left: ReactNode;
  right: ReactNode;
  highlight?: boolean;
  colors: Colors;
  labelWidth?: number;
}

export const CompareRow: React.FC<CompareRowProps> = ({
  label,
  left,
  right,
  highlight = false,
  colors,
  labelWidth = 100,
}) => {
  const styles = createStyles(colors, labelWidth);

  return (
    <View
      style={[
        styles.row,
        highlight && { backgroundColor: colors.primary + "12" },
      ]}
    >
      <View style={styles.labelCell}>
        <CustomText style={[styles.labelText, { color: colors.textSecondary }]}>
          {label}
        </CustomText>
      </View>
      <View style={styles.cell}>{left}</View>
      <View style={styles.cell}>{right}</View>
    </View>
  );
};

export default CompareRow;

const createStyles = (colors: Colors, labelWidth: number) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      overflow: "hidden",
    },
    labelCell: {
      width: labelWidth,
      paddingRight: 8,
    },
    labelText: {
      fontSize: 11,
      fontWeight: "600",
    },
    cell: {
      flex: 1,
      paddingHorizontal: 4,
    },
  });
