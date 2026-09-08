import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useTheme, useScrollToTop } from "@react-navigation/native";
import { router } from "expo-router";

import Icon, { IconName } from "@/components/common/Icon";
import ErrorState from "@/components/common/ErrorState";
import { FLOATING_TABBAR_CLEARANCE } from "@/components/layout/tabbar/FloatingTabBar";
import { useCategories } from "@/features/product/services/query.service";
import { SIZES } from "@/styles/sizes";
import { Category } from "@/types/category";
import { Colors } from "@/types/app";
import { useTabBarScroll } from "@/hooks/useTabBarScroll";
import ChildCategoryCard from "@/features/product/components/molecules/ChildCategoryCard";
import {
  getCategoryImageUrl,
  getCategorySubtitle,
} from "@/features/product/utils/categoryMeta";

// Helper to map category name or icon_url to valid IconName with fallback
const getCategoryIcon = (iconUrl?: string | null, name?: string): IconName => {
  if (iconUrl && iconUrl.trim().length > 0) {
    const slug = iconUrl.toLowerCase().trim();
    return slug as IconName;
  }

  const n = (name || "").toLowerCase();
  if (n.includes("diagnostic") || n.includes("thermometer") || n.includes("pressure") || n.includes("glucose")) {
    return "stethoscope";
  }
  if (n.includes("respiratory") || n.includes("nebulizer") || n.includes("cpap") || n.includes("oxygen")) {
    return "wind";
  }
  if (n.includes("mobility") || n.includes("wheelchair") || n.includes("walker") || n.includes("crutch")) {
    return "accessibility";
  }
  if (n.includes("wellness") || n.includes("fitness") || n.includes("sleep") || n.includes("analyzer")) {
    return "heart";
  }
  if (n.includes("home care") || n.includes("bed") || n.includes("suction") || n.includes("mattress")) {
    return "bed";
  }
  if (n.includes("wound") || n.includes("first aid") || n.includes("bandage") || n.includes("burn")) {
    return "shield-check";
  }
  if (n.includes("maternal") || n.includes("child") || n.includes("baby") || n.includes("breast pump") || n.includes("doppler")) {
    return "baby";
  }
  return "activity";
};

// Skeleton Loader for Split Pane with Child Category Grid
const CategorySkeleton: React.FC = () => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={skeletonStyles.container}>
      {/* Left Rail Skeletons */}
      <View style={[skeletonStyles.leftRail, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={skeletonStyles.railItem}>
            <Animated.View style={[skeletonStyles.railIcon, { backgroundColor: colors.border, opacity }]} />
            <Animated.View style={[skeletonStyles.railText, { backgroundColor: colors.border, opacity }]} />
          </View>
        ))}
      </View>

      {/* Right Content Skeletons */}
      <View style={[skeletonStyles.rightPane, { backgroundColor: colors.background }]}>
        {/* Simple Header Skeleton */}
        <View style={skeletonStyles.headerRow}>
          <Animated.View style={[skeletonStyles.headerTitle, { backgroundColor: colors.border, opacity }]} />
          <Animated.View style={[skeletonStyles.headerBtn, { backgroundColor: colors.border, opacity }]} />
        </View>

        {/* Grid Skeletons */}
        <View style={skeletonStyles.gridRow}>
          {[1, 2, 3, 4, 5, 6].map((cardIndex) => (
            <View
              key={cardIndex}
              style={[
                skeletonStyles.childCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Animated.View style={[skeletonStyles.cardImage, { backgroundColor: colors.border, opacity }]} />
              <View style={skeletonStyles.cardBody}>
                <Animated.View style={[skeletonStyles.cardTitle, { backgroundColor: colors.border, opacity }]} />
                <Animated.View style={[skeletonStyles.cardSub, { backgroundColor: colors.border, opacity }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const Page = () => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);
  const detailScrollRef = useRef<ScrollView>(null);
  useScrollToTop(detailScrollRef);
  const { onScroll, scrollEventThrottle } = useTabBarScroll();

  const { data, isLoading, isError, refetch } = useCategories();
  const [selectedParentId, setSelectedParentId] = useState<string | number | null>(null);

  // Extract root and nested categories
  const { parentCategories } = useMemo(() => {
    const rawList = data?.pages.flat() ?? [];

    // Parents have parent_id == null or 0
    const parents = rawList.filter(
      (c) => !c.parent_id || c.parent_id === 0 || c.parent === 0
    );

    return {
      parentCategories: parents.length > 0 ? parents : rawList,
    };
  }, [data]);

  // Set active parent category
  const activeParent = useMemo(() => {
    if (selectedParentId) {
      const found = parentCategories.find(
        (c) => String(c.id) === String(selectedParentId)
      );
      if (found) return found;
    }
    return parentCategories[0] || null;
  }, [parentCategories, selectedParentId]);

  // Subcategories for active parent
  const subcategories = useMemo(() => {
    if (!activeParent) return [];
    if (activeParent.children && activeParent.children.length > 0) {
      return activeParent.children;
    }
    // Fallback: search raw list where parent_id matches activeParent.id
    const rawList = data?.pages.flat() ?? [];
    return rawList.filter(
      (c) =>
        (c.parent_id && String(c.parent_id) === String(activeParent.id)) ||
        (c.parent && String(c.parent) === String(activeParent.id))
    );
  }, [activeParent, data]);

  const handleNavigateToCategory = (cat: Category) => {
    router.push({
      pathname: "/products-category",
      params: {
        id: String(cat.id),
        slug: cat.slug || "",
        name: cat.name,
      },
    });
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  if (isLoading) {
    return <CategorySkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't Load Categories"
        message="Unable to connect to the medical devices catalog. Please check your internet connection and try again."
        onRetry={() => refetch()}
        retryText="Reload Catalog"
      />
    );
  }

  if (parentCategories.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyIconBox, { backgroundColor: colors.primary + "14" }]}>
          <Icon name="package" size={42} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Categories Found</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary || colors.text }]}>
          No category records are currently available in the catalog.
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
          activeOpacity={0.8}
        >
          <Icon name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.splitLayout}>
        {/* Left Vertical Master Rail */}
        <View style={styles.leftRail}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.leftRailContent}
          >
            {parentCategories.map((parent) => {
              const isSelected = String(parent.id) === String(activeParent?.id);
              const iconName = getCategoryIcon(parent.icon_url, parent.name);

              return (
                <TouchableOpacity
                  key={String(parent.id)}
                  style={[
                    styles.railItem,
                    isSelected && styles.railItemSelected,
                  ]}
                  onPress={() => setSelectedParentId(parent.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.railIconContainer,
                      isSelected && styles.railIconContainerSelected,
                    ]}
                  >
                    <Icon
                      name={iconName}
                      size={20}
                      color={isSelected ? "#FFFFFF" : colors.textSecondary || colors.text}
                    />
                  </View>
                  <Text
                    style={[
                      styles.railItemText,
                      isSelected && styles.railItemTextSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {parent.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Detail Pane */}
        <View style={styles.rightContent}>
          {activeParent && (
            <ScrollView
              ref={detailScrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.rightContentInner}
              onScroll={onScroll}
              scrollEventThrottle={scrollEventThrottle}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            >
              {/* Clean Minimal Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {activeParent.name}
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary || colors.text }]}>
                    {subcategories.length > 0
                      ? `${subcategories.length} subcategories`
                      : "Certified equipment"}
                  </Text>
                </View>

                {/* Simple View All Link */}
                <TouchableOpacity
                  style={styles.viewAllBtn}
                  onPress={() => handleNavigateToCategory(activeParent)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>View all</Text>
                  <Icon name="chevron-right" size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Child Categories Presented with Images in 2-Column Grid */}
              {subcategories.length > 0 ? (
                <View style={styles.gridContainer}>
                  {subcategories.map((sub) => (
                    <View key={String(sub.id)} style={styles.gridItemWrap}>
                      <ChildCategoryCard
                        category={sub}
                        onPress={handleNavigateToCategory}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                /* Fallback if active parent is a leaf category */
                <View style={[styles.leafCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Image
                    source={{ uri: getCategoryImageUrl(activeParent) }}
                    style={styles.leafImage}
                    contentFit="cover"
                    placeholder={require("@/assets/images/placeholder.png")}
                    transition={200}
                  />
                  <View style={styles.leafBody}>
                    <Text style={[styles.leafTitle, { color: colors.text }]}>
                      {activeParent.name}
                    </Text>
                    <Text style={[styles.leafSubtitle, { color: colors.textSecondary || colors.text }]}>
                      {getCategorySubtitle(activeParent)}
                    </Text>
                    <TouchableOpacity
                      style={[styles.leafActionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleNavigateToCategory(activeParent)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.leafActionText}>Browse All Products</Text>
                      <Icon name="arrow-right" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

export default Page;

/* ------------------------------- Skeletons & Styles ---------------------------------- */

const skeletonStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  leftRail: {
    width: 90,
    borderRightWidth: 1,
    paddingVertical: 12,
  },
  railItem: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 6,
  },
  railIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  railText: {
    width: 54,
    height: 10,
    borderRadius: 5,
  },
  rightPane: {
    flex: 1,
    padding: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  headerTitle: {
    width: 120,
    height: 16,
    borderRadius: 4,
  },
  headerBtn: {
    width: 50,
    height: 14,
    borderRadius: 4,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 4,
  },
  childCard: {
    width: "48.5%",
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
  },
  cardImage: {
    width: "100%",
    height: 95,
  },
  cardBody: {
    padding: 8,
    gap: 6,
  },
  cardTitle: {
    width: "80%",
    height: 12,
    borderRadius: 3,
  },
  cardSub: {
    width: "60%",
    height: 10,
    borderRadius: 3,
  },
});

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    splitLayout: {
      flex: 1,
      flexDirection: "row",
    },
    leftRail: {
      width: 90,
      backgroundColor: colors.card,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    leftRailContent: {
      paddingTop: SIZES.spacingSM,
      paddingBottom: FLOATING_TABBAR_CLEARANCE,
    },
    railItem: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderLeftWidth: 3,
      borderLeftColor: "transparent",
      gap: 5,
    },
    railItemSelected: {
      borderLeftColor: colors.primary,
      backgroundColor: colors.primary + "10",
    },
    railIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    railIconContainerSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    railItemText: {
      fontSize: 10,
      fontWeight: "500",
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 13,
      paddingHorizontal: 2,
    },
    railItemTextSelected: {
      color: colors.primary,
      fontWeight: "700",
    },
    rightContent: {
      flex: 1,
      backgroundColor: colors.background,
    },
    rightContentInner: {
      padding: SIZES.spacingSM,
      paddingBottom: FLOATING_TABBAR_CLEARANCE,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 2,
      paddingVertical: 4,
      marginBottom: 12,
    },
    headerLeft: {
      flex: 1,
      paddingRight: 10,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 11,
      opacity: 0.65,
      marginTop: 1,
    },
    viewAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: "600",
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    gridItemWrap: {
      width: "48.5%",
      marginBottom: 10,
    },
    leafCard: {
      borderRadius: 12,
      borderWidth: 1,
      overflow: "hidden",
      marginTop: 4,
    },
    leafImage: {
      width: "100%",
      height: 140,
    },
    leafBody: {
      padding: 12,
      gap: 6,
    },
    leafTitle: {
      fontSize: 14,
      fontWeight: "700",
    },
    leafSubtitle: {
      fontSize: 12,
      lineHeight: 16,
      opacity: 0.75,
    },
    leafActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 8,
      paddingVertical: 10,
      borderRadius: 8,
    },
    leafActionText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 30,
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
    },
    retryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: SIZES.radius_small,
    },
    retryButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
  });
