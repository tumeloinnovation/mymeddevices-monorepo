import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Colors } from "@/types/app";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import Icon from "@/components/common/Icon";
import { toast } from "sonner-native";

import useCompareStore from "@/features/compare/stores/useCompareStore";

const CompareIcon = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const compare = useCompareStore((state) => state.compare_list.length);

  return (
    <TouchableOpacity
      style={styles.actionButton}
      // disabled={compare < 2}
      onPress={() =>
        compare < 2
          ? toast.info("You can only compare 2 products")
          : router.push("/compare")
      }
    >
      <Icon name="repeat" size={20} color={colors.text} />
      <View style={styles.actionButtonIcon}>
        <Text style={styles.actionButtonText}>{compare}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default CompareIcon;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    actionButton: {
      padding: 10,
      marginHorizontal: 5,
    },
    actionButtonIcon: {
      position: "absolute",
      marginRight: 3,
      marginBottom: 22,
      height: 16,
      width: 16,
      left: 20,
      backgroundColor: colors.primary,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    actionButtonText: {
      fontWeight: "700",
      fontSize: 10,
      color: colors.background,
    },
  });
