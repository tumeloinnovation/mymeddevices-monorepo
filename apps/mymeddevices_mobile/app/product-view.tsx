import React, { useState, useLayoutEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from "react-native";
import { useLocalSearchParams, useNavigation, router } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Colors } from "@/types/app";
import { Product } from "@/types/product";
import CartIcon from "@/components/common/CartIcon";
import Icon from "@/components/common/Icon";
import { useProductStore } from "@/features/product/stores/useProductStore";
import { useProduct } from "@/features/product/services/query.service";

import ProductHeroGallery from "@/features/product/components/organisms/ProductHeroGallery";
import ProductHeaderInfo from "@/features/product/components/molecules/ProductHeaderInfo";
import ProductPricingBlock from "@/features/product/components/molecules/ProductPricingBlock";
import MedicalTrustBadges from "@/features/product/components/molecules/MedicalTrustBadges";
import ProductDescription from "@/features/product/components/atoms/ProductDescription";
import ProductSpecsTable from "@/features/product/components/organisms/ProductSpecsTable";
import DeliveryAndReturnsSection from "@/features/product/components/molecules/DeliveryAndReturnsSection";
import RelatedProductsSection from "@/features/product/components/organisms/RelatedProductsSection";
import ProductFooterBar from "@/features/product/components/organisms/ProductFooterBar";
import ReviewProduct from "@/features/review/components/ReviewProduct";
import CustomBottomSheet from "@/components/sheets/CustomBottomSheet";
import VariantProductItem from "@/features/product/components/organisms/VariantProductItem";
import useAppStore from "@/stores/useAppStore";

const ProductDetailPage = () => {
  const { colors, dark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, dark, insets.top, insets.bottom);

  const isRelatedProductsOpen = useAppStore((s) => s.isRelatedProductsOpen);
  const closeRelatedProducts = useAppStore((s) => s.closeRelatedProducts);

  const { id } = useLocalSearchParams<{ id: string }>();
  const storeProduct = useProductStore((state) => state.product);

  // Fetch product from API if not already in store or if navigated directly
  const {
    data: fetchedProduct,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useProduct(id ? Number(id) || id : undefined);

  const product: Product | null =
    (storeProduct && String(storeProduct.id) === String(id)
      ? storeProduct
      : fetchedProduct) || storeProduct;

  const scrollRef = useRef<ScrollView>(null);
  const reviewsPositionRef = useRef<number>(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    if (y > 70 && !isScrolled) {
      setIsScrolled(true);
    } else if (y <= 70 && isScrolled) {
      setIsScrolled(false);
    }
  };

  const handleScrollToReviews = () => {
    Haptics.selectionAsync().catch(() => {});
    if (reviewsPositionRef.current > 0) {
      scrollRef.current?.scrollTo({
        y: reviewsPositionRef.current - 20,
        animated: true,
      });
    }
  };

  if (isLoading && !product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (isError && !product) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert" size={40} color={colors.error || "#EF4444"} />
        <Text style={styles.errorTitle}>Failed to load product</Text>
        <Text style={styles.errorSubtitle}>
          Please verify your internet connection and try again.
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => refetch()}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="package" size={40} color={colors.textSecondary || "#94A3B8"} />
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <Text style={styles.errorSubtitle}>
          The requested product could not be located.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 0. Full-Bleed Floating Glass Navigation Header */}
      <View
        style={[
          styles.floatingHeader,
          isScrolled && styles.floatingHeaderScrolled,
        ]}
      >
        {/* Back Button Island */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={styles.floatingGlassBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-left" size={18} color={colors.text} />
        </TouchableOpacity>

        {/* Dynamic Center Title when scrolled */}
        {isScrolled ? (
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitleText} numberOfLines={1}>
              {product.name}
            </Text>
          </View>
        ) : (
          <View style={styles.headerTitlePlaceholder} />
        )}

        {/* Right Action: Cart Only */}
        <View style={styles.floatingGlassBtn}>
          <CartIcon />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* 1. Hero Image Gallery */}
        <ProductHeroGallery product={product} />

        {/* 2. Product Header (Category, Brand, Title, Rating, SKU) */}
        <ProductHeaderInfo
          product={product}
          onReviewPress={handleScrollToReviews}
        />

        {/* 3. Pricing Block */}
        <ProductPricingBlock product={product} />

        {/* 4. Quick Medical Trust & Clinical Highlights */}
        <MedicalTrustBadges />

        {/* 5. Product Overview & Clinical Notes */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderIconWrap}>
              <Icon name="activity" size={15} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Overview & Features</Text>
          </View>
          <ProductDescription data={product} />
        </View>

        {/* 6. Technical Specifications Accordion */}
        <View style={styles.sectionCard}>
          <ProductSpecsTable product={product} />
        </View>

        {/* 7. Delivery Speeds & Guarantee */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderIconWrap}>
              <Icon name="truck" size={15} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Delivery & Returns Policy</Text>
          </View>
          <DeliveryAndReturnsSection />
        </View>

        {/* 8. Customer Ratings & Reviews */}
        <View
          style={styles.sectionCard}
          onLayout={(event) => {
            reviewsPositionRef.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderIconWrap}>
              <Icon name="star" size={15} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Customer Reviews & Ratings</Text>
          </View>
          <ReviewProduct product={product} />
        </View>

        {/* 9. Related Medical Equipment Carousel */}
        <RelatedProductsSection product={product} />
      </ScrollView>

      {/* 10. Sticky Bottom Action Bar */}
      <ProductFooterBar product={product} />

      {/* 11. Compare Related Devices Sheet */}
      {isRelatedProductsOpen && (
        <CustomBottomSheet onClose={closeRelatedProducts}>
          <VariantProductItem />
        </CustomBottomSheet>
      )}
    </View>
  );
};

export default ProductDetailPage;

const createStyles = (colors: Colors, dark: boolean, topInset: number, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    floatingHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      paddingTop: Math.max(topInset, 10) + 4,
      paddingHorizontal: 16,
      paddingBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "transparent",
    },
    floatingHeaderScrolled: {
      backgroundColor: dark ? "rgba(15,23,42,0.94)" : "rgba(255,255,255,0.94)",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: { elevation: 4 },
      }),
    },
    floatingGlassBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: dark ? "rgba(30,41,59,0.75)" : "rgba(255,255,255,0.85)",
      borderWidth: 1,
      borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        android: { elevation: 3 },
      }),
    },
    headerTitleWrap: {
      flex: 1,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitlePlaceholder: {
      flex: 1,
    },
    headerTitleText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    floatingRightGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    scroll: {
      flex: 1,
      width: "100%",
    },
    scrollContent: {
      paddingBottom: 68 + Math.max(bottomInset, 16),
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      gap: 12,
      padding: 24,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary || "#64748B",
      fontWeight: "500",
    },
    errorContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      gap: 10,
      padding: 32,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    errorSubtitle: {
      fontSize: 13,
      color: colors.textSecondary || "#64748B",
      textAlign: "center",
      lineHeight: 18,
    },
    retryButton: {
      marginTop: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
    },
    retryButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 14,
    },
    sectionCard: {
      marginTop: 10,
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingBottom: 4,
    },
    sectionHeaderIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.primary + "14",
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.2,
    },
  });
