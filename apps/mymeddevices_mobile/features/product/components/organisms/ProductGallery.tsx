import React from "react";
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { Product } from "@/types/product";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

interface ProductGalleryProps {
  product: Product;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ product }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const handleCategoryNavigation = (categoryId: number, name: string) => {
    router.push({
      pathname: "/products-category",
      params: { id: categoryId, name },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{product?.name}</Text>
      <Image
        source={product?.images?.[0]?.src}
        style={styles.image}
        contentFit="contain"
      />
      <View style={styles.categoriesRow}>
        {product?.categories?.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryItem}
            onPress={() =>
              handleCategoryNavigation(category.id, category.name)
            }
          >
            <Text style={styles.categoryText}>
              {category.name === "Uncategorized" || category.name === "Pharma"
                ? "Medical Devices"
                : category.name}
              .
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ProductGallery;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },
    title: {
      fontWeight: "500",
      fontSize: 24,
      color: colors.text,
      paddingHorizontal: SIZES.paddingMD,
      paddingBottom: SIZES.paddingMD,
    },
    image: {
      alignSelf: "center",
      height: 300,
      width: Dimensions.get("window").width,
    },
    categoriesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: SIZES.paddingMD,
      marginTop: 10,
    },
    categoryItem: {
      marginRight: SIZES.marginMD,
    },
    categoryText: {
      fontWeight: "600",
      fontSize: 14,
      color: colors.primary,
      textDecorationLine: "underline",
    },
  });
