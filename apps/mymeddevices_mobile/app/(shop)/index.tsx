import Icon from "@/components/common/Icon";
import React, { useRef, useState } from "react";
import { useTheme, useScrollToTop } from "@react-navigation/native";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Colors, SheetRefProps } from "@/types/app";
import { Product } from "@/types/product";
import useShopStore from "@/stores/useShopStore";
import SortSheet from "@/components/sheets/SortSheet";
import FilterSheet from "@/components/sheets/FilterSheet";
import { ProductGridSkeleton } from "@/components/common/EmptyState";
import { useProducts } from "@/features/product/services/query.service";
import ProductItem from "@/features/product/components/organisms/ProductItem";
import SearchModal from "@/features/search/components/SearchModal";
import { SIZES } from "@/styles/sizes";
import { useTabBarScroll } from "@/hooks/useTabBarScroll";

const Shop = () => {
  const flatListRef = useRef<FlatList>(null);
  useScrollToTop(flatListRef);
  const { onScroll, scrollEventThrottle } = useTabBarScroll();

  const filterRef = useRef<SheetRefProps>(null);
  const sortRef = useRef<SheetRefProps>(null);
  const [searchVisible, setSearchVisible] = useState(false);

  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);

  const { params, resetParams } = useShopStore();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProducts(params);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={{ width: "50%" }} key={item.id}>
      <ProductItem data={item} />
    </View>
  );

  const hasActiveFilters = Boolean(
    params.category ||
    params.min_price ||
    params.max_price ||
    params.on_sale ||
    params.search
  );

  const filterHeader = (
    <View style={styles.headerControls}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: colors.card,
              borderColor: params.orderby !== "popularity" ? colors.primary : colors.border,
            },
          ]}
          onPress={() => sortRef?.current?.openSheet()}
          activeOpacity={0.7}
        >
          <Icon
            name="sort"
            size={18}
            color={params.orderby !== "popularity" ? colors.primary : colors.text}
          />
          <Text
            style={[
              styles.filterText,
              { color: params.orderby !== "popularity" ? colors.primary : colors.text },
            ]}
          >
            Sort
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: colors.card,
              borderColor: hasActiveFilters ? colors.primary : colors.border,
            },
          ]}
          onPress={() => filterRef?.current?.openSheet()}
          activeOpacity={0.7}
        >
          <Icon
            name="filter"
            size={18}
            color={hasActiveFilters ? colors.primary : colors.text}
          />
          <Text
            style={[
              styles.filterText,
              { color: hasActiveFilters ? colors.primary : colors.text },
            ]}
          >
            Filter
          </Text>
          {hasActiveFilters && (
            <View style={[styles.filterActiveDot, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
        <View style={styles.headerPadding}>{filterHeader}</View>
        <ProductGridSkeleton count={6} />
      </View>
    );
  }

  const flattenedData = data?.pages.flat() ?? [];

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        key="grid"
        numColumns={2}
        renderItem={renderItem}
        data={flattenedData}
        keyExtractor={(item) => String(item.id)}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.container}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={filterHeader}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.footerLoaderText, { color: colors.textSecondary || colors.text }]}>
                Loading more medical devices...
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + "14" }]}>
              <Icon name="search" size={38} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Medical Devices Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary || colors.text }]}>
              {hasActiveFilters
                ? "No products match your current filter or sort criteria. Try adjusting or resetting your filters."
                : "There are currently no products available in this section. Please check back shortly."}
            </Text>

            {hasActiveFilters ? (
              <TouchableOpacity
                style={[styles.resetFilterButton, { backgroundColor: colors.primary }]}
                onPress={resetParams}
                activeOpacity={0.8}
              >
                <Icon name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.resetFilterButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.resetFilterButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(shop)/category")}
                activeOpacity={0.8}
              >
                <Icon name="list" size={16} color="#FFFFFF" />
                <Text style={styles.resetFilterButtonText}>Browse All Categories</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <FilterSheet ref={filterRef} />
      <SortSheet ref={sortRef} />
      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />
    </View>
  );
};

export default Shop;

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    mainWrapper: {
      flex: 1,
    },
    headerPadding: {
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    container: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      paddingBottom: 150,
      flexGrow: 1,
    },
    columnWrapper: {
      justifyContent: "space-between",
    },
    headerControls: {
      marginVertical: 4,
      paddingHorizontal: 6,
    },
    filterContainer: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10,
    },
    filterButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 11,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      gap: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    filterText: {
      fontWeight: "600",
      fontSize: 14,
    },
    filterActiveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginLeft: 2,
    },
    footerLoader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 20,
    },
    footerLoaderText: {
      fontSize: 12,
      fontWeight: "500",
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 50,
      paddingHorizontal: 24,
      marginTop: 20,
    },
    emptyIconCircle: {
      width: 74,
      height: 74,
      borderRadius: 37,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 19,
      fontWeight: "700",
      marginBottom: 6,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
      marginBottom: 20,
      opacity: 0.75,
      paddingHorizontal: 16,
    },
    resetFilterButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: SIZES.radius_small,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    resetFilterButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
  });
