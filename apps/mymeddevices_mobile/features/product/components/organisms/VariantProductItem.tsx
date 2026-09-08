import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import useAppStore from "@/stores/useAppStore";
import useCompareStore from "@/features/compare/stores/useCompareStore";
import { useRelatedProductsQueries, useNewestProducts, useCategoryPreviewProducts } from "../../services/query.service";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";
import type { UseQueryResult } from "@tanstack/react-query";
import type { Product } from "@/types/product";
import RelatedProductCard, {
  RelatedProductCardSkeleton,
  RELATED_CARD_WIDTH,
  RELATED_CARD_GAP,
} from "../molecules/RelatedProductCard";

const VariantProductItem = () => {
  const { related_ids } = useAppStore();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const compareList = useCompareStore((s) => s.compare_list);
  const currentCompareProduct = compareList[0];
  const categoryId = currentCompareProduct?.categories?.[0]?.id;

  const queryResults = useRelatedProductsQueries(related_ids);
  const { data: newestProducts, isLoading: isLoadingNewest } = useNewestProducts();
  const { data: categoryProducts, isLoading: isLoadingCategory } = useCategoryPreviewProducts(categoryId);

  // Collect loaded items from explicit related IDs
  const explicitProducts: Product[] = queryResults
    .filter((q) => q.status === "success" && q.data)
    .map((q) => q.data!)
    .filter((p) => p.id !== currentCompareProduct?.id);

  // Fallback items if explicit related IDs are empty
  const fallbackList: Product[] = (
    (categoryProducts && categoryProducts.length > 0 ? categoryProducts : newestProducts) || []
  )
    .filter((p) => p.id !== currentCompareProduct?.id)
    .slice(0, 8);

  const hasExplicit = explicitProducts.length > 0;
  const displayProducts: Product[] = hasExplicit ? explicitProducts : fallbackList;
  const isLoading = hasExplicit
    ? queryResults.some((q) => q.isLoading)
    : (categoryId ? isLoadingCategory : isLoadingNewest) && displayProducts.length === 0;

  const renderItem = React.useCallback(
    ({ item }: { item: Product }) => {
      return <RelatedProductCard data={item} />;
    },
    []
  );

  return (
    <BottomSheetView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="arrow-left-right" size={18} color={colors.primary} />
          <Text style={styles.title}>Compare Related Devices</Text>
        </View>
        {displayProducts.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{displayProducts.length}</Text>
          </View>
        )}
      </View>
      <Text style={styles.subtitle}>
        Select an alternative or related accessory to compare specs side by side
      </Text>

      {isLoading ? (
        <View style={styles.list}>
          <RelatedProductCardSkeleton />
          <RelatedProductCardSkeleton />
        </View>
      ) : displayProducts.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="bag" size={40} color={colors.textSecondary || colors.text} />
          <Text style={styles.emptyTitle}>No related items found</Text>
          <Text style={styles.emptySubtitle}>
            Browse categories to add another product for comparison.
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          snapToInterval={RELATED_CARD_WIDTH + RELATED_CARD_GAP}
          decelerationRate="fast"
          initialNumToRender={Math.max(2, displayProducts.length)}
        />
      )}
    </BottomSheetView>
  );
};

export default VariantProductItem;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: SIZES.paddingMD,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SIZES.paddingMD,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      color: colors.text,
      fontWeight: "bold",
      fontSize: 18,
    },
    countBadge: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      paddingHorizontal: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    countText: {
      color: colors.card,
      fontWeight: "700",
      fontSize: 14,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      paddingHorizontal: SIZES.paddingMD,
      marginBottom: 12,
    },
    list: {
      paddingHorizontal: SIZES.paddingMD,
      paddingBottom: SIZES.paddingXL,
      gap: RELATED_CARD_GAP,
    },
    errorCard: {
      backgroundColor: colors.background,
      borderRadius: SIZES.radiusXL,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    errorText: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 14,
    },
    retryBtn: {
      backgroundColor: colors.primary,
      borderRadius: SIZES.radius_medium,
      paddingVertical: 6,
      paddingHorizontal: 16,
    },
    retryText: {
      color: colors.card,
      fontWeight: "700",
      fontSize: 13,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: SIZES.paddingXL,
      gap: 8,
    },
    emptyTitle: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 18,
      marginTop: 4,
    },
    emptySubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
    },
  });
