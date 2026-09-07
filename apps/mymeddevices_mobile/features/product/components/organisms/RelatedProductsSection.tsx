import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";

import { Product } from "@/types/product";
import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";
import { useRelatedProductsQueries, useNewestProducts } from "@/features/product/services/query.service";
import ProductItem from "./ProductItem";

interface RelatedProductsSectionProps {
  product: Product;
}

export const RelatedProductsSection: React.FC<RelatedProductsSectionProps> = ({ product }) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const relatedQueries = useRelatedProductsQueries(product?.related_ids || []);
  const hasRelatedFromIds = relatedQueries.some((q) => q.isSuccess && q.data);

  // Fallback to newest products if specific related_ids are empty
  const { data: newestProducts } = useNewestProducts();

  let displayProducts: Product[] = [];

  if (hasRelatedFromIds) {
    displayProducts = relatedQueries
      .filter((q) => q.isSuccess && q.data && q.data.id !== product.id)
      .map((q) => q.data!);
  } else if (newestProducts && newestProducts.length > 0) {
    displayProducts = newestProducts.filter((p) => p.id !== product.id).slice(0, 6);
  }

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="layers" size={16} color={colors.primary} />
          <Text style={styles.title}>Related Devices & Accessories</Text>
        </View>
        <Text style={styles.subtitle}>Frequently procured with this item</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayProducts.map((item) => (
          <View key={item.id} style={styles.cardWrapper}>
            <ProductItem data={item} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default RelatedProductsSection;

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    container: {
      marginTop: 16,
      marginBottom: 24,
    },
    header: {
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary || "#64748B",
      marginTop: 2,
    },
    scrollContent: {
      paddingHorizontal: 12,
      gap: 8,
    },
    cardWrapper: {
      width: 175,
    },
  });
