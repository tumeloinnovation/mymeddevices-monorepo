import React, { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, router } from "expo-router";
import {
  StyleSheet,
  Text,
  ActivityIndicator,
  FlatList,
  View,
  TouchableOpacity,
  Platform,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Icon from "@/components/common/Icon";
import ErrorState from "@/components/common/ErrorState";
import { ProductGridSkeleton } from "@/components/common/EmptyState";
import { Product } from "@/types/product";
import ProductItem from "@/features/product/components/organisms/ProductItem";
import { useProductCategories } from "@/features/product/services/query.service";
import { SIZES } from "@/styles/sizes";
import useShopStore from "@/stores/useShopStore";
import SortSheet from "@/components/sheets/SortSheet";
import FilterSheet from "@/components/sheets/FilterSheet";
import { RefProps } from "./(shop)";
import { Colors } from "@/types/app";
import {
  getCategoryImageUrl,
  getCategorySubtitle,
} from "@/features/product/utils/categoryMeta";

const CategoryPage = () => {
  const { id, name, slug } = useLocalSearchParams<{ id?: string; name?: string; slug?: string }>();
  const { colors, dark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const filterRef = useRef<RefProps>(null);
  const sortRef = useRef<RefProps>(null);
  const [footerVisible] = useState(() => new Animated.Value(1));
  const [refreshing, setRefreshing] = useState(false);

  const { params, setParam, resetParams } = useShopStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name || "Medical Products",
      headerBackTitle: "Categories",
    });
  }, [name]);

  useEffect(() => {
    const categoryTarget = slug || id;
    if (categoryTarget) {
      setParam("category", categoryTarget);
    }
    return () => {
      resetParams();
    };
  }, [id, slug]);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductCategories(params);

  const styles = createStyles(colors, insets.bottom, dark);
  const lastScrollY = useRef(0);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const toggleFooter = useCallback((visible: boolean) => {
    Animated.spring(footerVisible, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 45,
      friction: 8,
    }).start();
  }, [footerVisible]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;

      // Always show at the top
      if (offsetY <= 40) {
        toggleFooter(true);
      } else {
        // Hide on scroll down, show on scroll up
        const diff = offsetY - lastScrollY.current;
        if (diff > 12) {
          toggleFooter(false);
        } else if (diff < -12) {
          toggleFooter(true);
        }
      }

      lastScrollY.current = offsetY;
    },
    [toggleFooter]
  );

  const footerAnimStyle = useMemo(
    () => ({
      opacity: footerVisible,
      transform: [
        {
          translateY: footerVisible.interpolate({
            inputRange: [0, 1],
            outputRange: [90, 0],
          }),
        },
      ],
    }),
    [footerVisible]
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const allProducts = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  const categoryImageUrl = useMemo(() => {
    return getCategoryImageUrl({ slug: slug || "", name: name || "" });
  }, [slug, name]);

  const categorySubtitle = useMemo(() => {
    return getCategorySubtitle({ slug: slug || "", name: name || "" });
  }, [slug, name]);

  // Check if any filters or sorting are active
  const hasActiveFilters = useMemo(() => {
    return Boolean(params.on_sale || (params.orderby && params.orderby !== "popularity") || params.min_price || params.max_price || params.stock_status);
  }, [params]);

  // Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (params.on_sale) count += 1;
    if (params.min_price || params.max_price) count += 1;
    if (params.stock_status) count += 1;
    return count;
  }, [params.on_sale, params.min_price, params.max_price, params.stock_status]);

  // Is custom sorting active
  const isCustomSortActive = useMemo(() => {
    return Boolean(params.orderby && params.orderby !== "popularity");
  }, [params.orderby]);

  const renderItem = ({ item }: { item: Product }) => {
    return (
      <View style={styles.gridItemWrapper} key={String(item.id)}>
        <ProductItem data={item} style={styles.productCard} />
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.heroBanner}>
        {/* Banner Image with Gradient Overlay */}
        <View style={styles.bannerImageContainer}>
          <Image
            source={{ uri: categoryImageUrl }}
            style={styles.bannerImage}
            contentFit="cover"
            placeholder={require("@/assets/images/placeholder.png")}
            transition={200}
          />
          <View style={styles.bannerOverlay} />

          <View style={styles.bannerContent}>
            <View style={styles.bannerBadgeRow}>
              <View style={styles.trustBadge}>
                <Icon name="shield-check" size={11} color="#FFFFFF" />
                <Text style={styles.trustBadgeText}>100% Genuine & Certified</Text>
              </View>
            </View>

            <Text style={styles.bannerTitle} numberOfLines={2}>
              {name || "Medical Equipment"}
            </Text>
            <Text style={styles.bannerSubtitle} numberOfLines={2}>
              {categorySubtitle}
            </Text>
          </View>
        </View>

        {/* Results Bar */}
        <View style={styles.resultsBar}>
          <View style={styles.resultsLeft}>
            <Text style={styles.resultsCount}>
              {allProducts.length} {allProducts.length === 1 ? "device" : "devices"} found
            </Text>
          </View>

          <View style={styles.resultsRight}>
            <TouchableOpacity
              style={[
                styles.quickFilterChip,
                params.on_sale && styles.quickFilterChipActive,
              ]}
              onPress={() => setParam("on_sale", params.on_sale ? undefined : true)}
              activeOpacity={0.7}
            >
              <Icon
                name="zap"
                size={11}
                color={params.on_sale ? "#FFFFFF" : colors.textSecondary || colors.text}
              />
              <Text
                style={[
                  styles.quickFilterText,
                  params.on_sale && styles.quickFilterTextActive,
                ]}
              >
                On Sale
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ProductGridSkeleton count={6} />
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Products"
        message="Unable to fetch products for this category. Please check your internet connection."
        onRetry={() => refetch()}
        retryText="Try Again"
      />
    );
  }

  if (allProducts.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyIconBox, { backgroundColor: colors.primary + "14" }]}>
          <Icon name="package" size={44} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Devices in this Category</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary || colors.text }]}>
          We are currently updating our inventory for {name ? `"${name}"` : "this category"}. Check back soon or explore other medical categories.
        </Text>
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={16} color="#FFFFFF" />
          <Text style={styles.emptyButtonText}>Back to Categories</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={allProducts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        key={"product-grid"}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListFooterComponent={() =>
          isFetchingNextPage ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingMoreText}>Loading more devices...</Text>
            </View>
          ) : (
            <View style={styles.endOfListWrap}>
              <View style={styles.endOfListIconCircle}>
                <Icon name="shield-check" size={14} color={colors.primary} />
              </View>
              <Text style={styles.endOfListTitle}>
                You've reached the end
              </Text>
              <Text style={styles.endOfListSubtitle}>
                All products in this category are tested, certified, and quality approved.
              </Text>
            </View>
          )
        }
      />

      {/* Floating Modern Sort & Filter Pill */}
      <Animated.View style={[styles.floatingBarContainer, footerAnimStyle]}>
        <View style={styles.floatingBar}>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => sortRef?.current?.openSheet()}
            activeOpacity={0.75}
          >
            <View style={[styles.pillIconBox, isCustomSortActive && styles.pillIconBoxActive]}>
              <Icon
                name="sort"
                size={13}
                color={isCustomSortActive ? colors.primary : "#FFFFFF"}
              />
            </View>
            <Text style={[styles.floatingText, isCustomSortActive && styles.floatingTextActive]}>
              Sort
            </Text>
            {isCustomSortActive && <View style={styles.activeDot} />}
          </TouchableOpacity>

          <View style={styles.floatingDivider} />

          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => filterRef?.current?.openSheet()}
            activeOpacity={0.75}
          >
            <View style={[styles.pillIconBox, activeFilterCount > 0 && styles.pillIconBoxActive]}>
              <Icon
                name="filter"
                size={13}
                color={activeFilterCount > 0 ? colors.primary : "#FFFFFF"}
              />
            </View>
            <Text style={[styles.floatingText, activeFilterCount > 0 && styles.floatingTextActive]}>
              Filter
            </Text>
            {activeFilterCount > 0 && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <FilterSheet ref={filterRef} />
      <SortSheet ref={sortRef} />
    </View>
  );
};

export default CategoryPage;

const createStyles = (colors: Colors, bottomInset: number, dark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      paddingHorizontal: 12,
      paddingTop: 12,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 110 + bottomInset,
    },
    columnWrapper: {
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 10,
    },
    gridItemWrapper: {
      flex: 1,
      maxWidth: "48.5%",
    },
    productCard: {
      margin: 0,
      width: "100%",
    },

    // Hero Category Banner
    heroBanner: {
      marginBottom: 14,
    },
    bannerImageContainer: {
      position: "relative",
      width: "100%",
      height: 130,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: dark ? colors.card : "#0F172A",
      justifyContent: "flex-end",
    },
    bannerImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    bannerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
    },
    bannerContent: {
      position: "relative",
      zIndex: 2,
      padding: 12,
      gap: 3,
    },
    bannerBadgeRow: {
      flexDirection: "row",
      marginBottom: 2,
    },
    trustBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(2, 132, 199, 0.9)",
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 6,
    },
    trustBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    bannerTitle: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    bannerSubtitle: {
      color: "rgba(255, 255, 255, 0.82)",
      fontSize: 11,
      lineHeight: 14,
    },

    // Results bar & quick filters
    resultsBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      paddingHorizontal: 2,
    },
    resultsLeft: {
      flex: 1,
    },
    resultsCount: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary || colors.text,
    },
    resultsRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    quickFilterChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickFilterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    quickFilterText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary || colors.text,
    },
    quickFilterTextActive: {
      color: "#FFFFFF",
    },

    // Footer & Empty States
    loadingMore: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 20,
    },
    loadingMoreText: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      fontWeight: "500",
    },
    endOfListWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
      paddingHorizontal: 20,
      gap: 4,
    },
    endOfListIconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary + "14",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    endOfListTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    endOfListSubtitle: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      textAlign: "center",
      lineHeight: 15,
    },

    // Floating Pill Bar
    floatingBarContainer: {
      position: "absolute",
      bottom: 24 + bottomInset,
      alignSelf: "center",
      zIndex: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 8,
    },
    floatingBar: {
      backgroundColor: dark ? "#1E293B" : "#0F172A",
      height: 48,
      paddingHorizontal: 8,
      flexDirection: "row",
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.15)",
    },
    floatingButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 14,
      height: "100%",
      position: "relative",
    },
    pillIconBox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    pillIconBoxActive: {
      backgroundColor: colors.primary + "28",
    },
    floatingText: {
      fontWeight: "700",
      fontSize: 12,
      color: "#FFFFFF",
      letterSpacing: 0.3,
    },
    floatingTextActive: {
      color: colors.primary,
    },
    activeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginLeft: 2,
    },
    activeBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
      marginLeft: 2,
    },
    activeBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "800",
      lineHeight: 12,
    },
    floatingDivider: {
      width: 1,
      height: 20,
      backgroundColor: "rgba(255, 255, 255, 0.18)",
    },

    // Empty Screen
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 30,
      paddingBottom: 60,
    },
    emptyIconBox: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
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
    },
    emptyButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: SIZES.radius_small,
    },
    emptyButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
  });
