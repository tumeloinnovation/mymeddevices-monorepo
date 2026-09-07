import React from "react";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import useShopStore from "@/stores/useShopStore";

interface SortOptionProps {
  label: string;
  orderby: string;
  order?: string;
}

const SortButton: React.FC<SortOptionProps> = ({
  label,
  orderby,
  order = "asc",
}) => {
  const { params, tempParams, setTempParam } = useShopStore();
  const { colors } = useTheme();

  const isActive =
    (tempParams.orderby === orderby && tempParams.order === order) ||
    (tempParams.orderby === undefined &&
      params.orderby === orderby &&
      params.order === order);

  return (
    <TouchableOpacity
      onPress={() => {
        setTempParam("orderby", orderby);
        setTempParam("order", order);
      }}
      style={[
        styles.sortOption,
        { backgroundColor: colors.card },
        isActive && {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
      ]}
    >
      <Text
        style={[
          styles.sortOptionText,
          { color: colors.text },
          isActive && {
            color: colors.card,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default SortButton;

const styles = StyleSheet.create({
  sortOption: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 5,
    marginBottom: 5,
  },
  sortOptionText: {
    fontWeight: "400",
    fontSize: 16,
  },
});
