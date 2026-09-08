import { StyleSheet, Text } from "react-native";
import React from "react";
import { Colors } from "@/types/app";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { ProductCategory } from "@/types/product";

interface Props {
  categories: ProductCategory[] | undefined;
}

const CategoryNames: React.FC<Props> = ({ categories }) => {
  const { colors } = useTheme();

  const styles = createStyles(colors);

  const handleCategoryNavigation = () => {
    const category_id = categories && categories[0]?.id;
    return router.push({
      pathname: "/products-category",
      params: { id: category_id },
    });
  };
  return (
    <Text style={styles.categoryText} onPress={handleCategoryNavigation}>
      {categories?.[0]?.name === "Uncategorized" ||
      categories?.[0]?.name === "Pharma"
        ? "Medical Devices"
        : categories?.[0]?.name}
    </Text>
  );
};

export default CategoryNames;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    categoryText: {
      fontWeight: "500",
      fontSize: 14,
      color: colors.primary,
      paddingVertical: 5,
    },
  });
