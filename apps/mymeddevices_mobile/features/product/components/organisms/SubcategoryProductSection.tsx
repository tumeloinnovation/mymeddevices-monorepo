import React, { useRef, useEffect } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";

import Icon, { IconName } from "@/components/common/Icon";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { Colors } from "@/types/app";
import { useCategoryPreviewProducts } from "../../services/query.service";
import useCartStore from "@/features/cart/stores/useCartStore";

const CARD_WIDTH = 138;
const CARD_HEIGHT = 210;

interface SubcategoryProductSectionProps {
  subcategory: Category;
  parentCategoryName?: string;
  onViewMore: (category: Category) => void;
}

// Map subcategory name to an appropriate icon
const getSubcategoryIcon = (iconUrl?: string | null, name?: string): IconName => {
  if (iconUrl && iconUrl.trim().length > 0) {
    return iconUrl.toLowerCase().trim() as IconName;
  }
  const n = (name || "").toLowerCase();
  if (n.includes("pressure") || n.includes("pulse") || n.includes("oximeter") || n.includes("diagnostic")) {
    return "activity";
  }
  if (n.includes("nebulizer") || n.includes("oxygen") || n.includes("respiratory") || n.includes("cpap")) {
    return "wind";
  }
  if (n.includes("wheelchair") || n.includes("walker") || n.includes("mobility") || n.includes("crutch")) {
    return "accessibility";
  }
  if (n.includes("thermometer") || n.includes("glucose") || n.includes("test")) {
    return "stethoscope";
  }
  if (n.includes("wound") || n.includes("bandage") || n.includes("first aid")) {
    return "shield-check";
  }
  if (n.includes("maternal") || n.includes("baby") || n.includes("infant")) {
    return "baby";
  }
  if (n.includes("bed") || n.includes("mattress") || n.includes("home")) {
    return "bed";
  }
  return "package";
};

// Compact Preview Card
const SubcategoryProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { colors, dark } = useTheme();
  const styles = createCardStyles(colors, dark);

  const isInCart = useCartStore((state) => state.isInCart(product.id));
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  const handlePress = () => {
    router.push({
      pathname: "/product-view",
      params: { id: product.id },
    });
  };

  const handleCartToggle = (e: any) => {
    e?.stopPropagation?.();
    if (isInCart) {
      removeFromCart(product);
    } else {
      addToCart(product);
    }
  };

  const isOutOfStock = product.stock_status === "outofstock";
  const discountPercent =
    product.on_sale && product.regular_price && product.sale_price
      ? Math.round(
          ((Number(product.regular_price) - Number(product.sale_price)) /
            Number(product.regular_price)) *
            100
        )
      : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      {/* Product Image */}
      <View style={styles.imageWrap}>
        {discountPercent && discountPercent > 0 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
          </View>
        ) : null}

        <Image
          style={styles.image}
          source={product.images?.[0]?.src}
          contentFit="contain"
          placeholder={require("@/assets/images/placeholder.png")}
          transition={150}
        />
      </View>

      {/* Product Info */}
      <View style={styles.infoWrap}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          {product.on_sale ? (
            <View style={styles.salePriceContainer}>
              <Text style={styles.salePrice}>
                Ksh {Number(product.sale_price || product.price || 0).toLocaleString()}
              </Text>
              {product.regular_price ? (
                <Text style={styles.regularPrice}>
                  Ksh {Number(product.regular_price).toLocaleString()}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.price}>
              Ksh {Number(product.regular_price || product.price || 0).toLocaleString()}
            </Text>
          )}
        </View>

        {/* Quick Cart Button */}
        <TouchableOpacity
          onPress={handleCartToggle}
          disabled={isOutOfStock}
          activeOpacity={0.8}
          style={[
            styles.quickCartBtn,
            isInCart && styles.quickCartBtnInCart,
            isOutOfStock && styles.quickCartBtnDisabled,
          ]}
        >
          <Icon
            name={isInCart ? "shopping-bag" : "cart"}
            size={12}
            color={isInCart ? colors.primary : "#FFFFFF"}
          />
          <Text
            style={[
              styles.quickCartText,
              isInCart && styles.quickCartTextInCart,
              isOutOfStock && styles.quickCartTextDisabled,
            ]}
          >
            {isOutOfStock ? "Out" : isInCart ? "In Cart" : "Add"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Shimmer Skeleton Placeholder for Carousel Card
const ProductCardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 650, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 10,
        gap: 6,
      }}
    >
      <Animated.View
        style={{
          width: "100%",
          height: 85,
          borderRadius: 8,
          backgroundColor: colors.border,
          opacity,
        }}
      />
      <Animated.View
        style={{
          width: "90%",
          height: 12,
          borderRadius: 4,
          backgroundColor: colors.border,
          opacity,
        }}
      />
      <Animated.View
        style={{
          width: "60%",
          height: 10,
          borderRadius: 4,
          backgroundColor: colors.border,
          opacity,
        }}
      />
      <Animated.View
        style={{
          width: "100%",
          height: 26,
          borderRadius: 6,
          backgroundColor: colors.border,
          opacity,
          marginTop: "auto",
        }}
      />
    </View>
  );
};

// Subcategory Section
export const SubcategoryProductSection: React.FC<SubcategoryProductSectionProps> = ({
  subcategory,
  onViewMore,
}) => {
  const { colors } = useTheme();
  const styles = createSectionStyles(colors);

  const identifier = subcategory.slug || subcategory.id;
  const { data: products, isLoading, isError, refetch } = useCategoryPreviewProducts(identifier);

  const iconName = getSubcategoryIcon(subcategory.icon_url, subcategory.name);

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerTitleWrap}>
          <View style={[styles.headerIconBox, { backgroundColor: colors.primary + "14" }]}>
            <Icon name={iconName} size={14} color={colors.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]} numberOfLines={1}>
            {subcategory.name}
          </Text>
          {subcategory.count !== undefined && subcategory.count > 0 ? (
            <View style={[styles.countBadge, { backgroundColor: colors.border + "80" }]}>
              <Text style={[styles.countBadgeText, { color: colors.textSecondary || colors.text }]}>
                {subcategory.count}
              </Text>
            </View>
          ) : null}
        </View>

        {/* View More Button */}
        <TouchableOpacity
          style={styles.viewMoreButton}
          onPress={() => onViewMore(subcategory)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.viewMoreText, { color: colors.primary }]}>View More</Text>
          <Icon name="chevron-right" size={13} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel or States */}
      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
        >
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </ScrollView>
      ) : isError ? (
        /* Error fallback per subcategory */
        <View style={[styles.errorSubCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.errorSubLeft}>
            <Icon name="alert-circle" size={16} color={colors.error || "#EF4444"} />
            <Text style={[styles.errorSubText, { color: colors.textSecondary || colors.text }]} numberOfLines={1}>
              Couldn't load {subcategory.name}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.retryChip, { backgroundColor: colors.primary + "18" }]}
            onPress={() => refetch()}
            activeOpacity={0.7}
          >
            <Icon name="refresh" size={12} color={colors.primary} />
            <Text style={[styles.retryChipText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : products && products.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
        >
          {products.map((product) => (
            <SubcategoryProductCard key={product.id} product={product} />
          ))}

          {/* End-of-carousel "See All" card */}
          <TouchableOpacity
            style={[styles.seeAllCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => onViewMore(subcategory)}
            activeOpacity={0.8}
          >
            <View style={[styles.seeAllCircle, { backgroundColor: colors.primary + "18" }]}>
              <Icon name="arrow-right" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.seeAllTitle, { color: colors.text }]} numberOfLines={2}>
              See all in {subcategory.name}
            </Text>
            <Text style={[styles.seeAllSub, { color: colors.primary }]}>
              Explore →
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* Empty / No Items in Subcategory fallback */
        <TouchableOpacity
          style={[styles.emptySubCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => onViewMore(subcategory)}
          activeOpacity={0.7}
        >
          <Icon name="package" size={20} color={colors.textSecondary || colors.text} />
          <Text style={[styles.emptySubText, { color: colors.textSecondary || colors.text }]}>
            Browse {subcategory.name} collection
          </Text>
          <Icon name="chevron-right" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SubcategoryProductSection;

/* ------------------------------- Styles ---------------------------------- */

const createSectionStyles = (colors: Colors) =>
  StyleSheet.create({
    sectionContainer: {
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 2,
      marginBottom: 10,
    },
    headerTitleWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingRight: 8,
    },
    headerIconBox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: -0.2,
      flexShrink: 1,
    },
    countBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 8,
    },
    countBadgeText: {
      fontSize: 10,
      fontWeight: "600",
    },
    viewMoreButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 6,
    },
    viewMoreText: {
      fontSize: 12,
      fontWeight: "600",
    },
    carouselContent: {
      paddingRight: 8,
      gap: 10,
    },
    seeAllCard: {
      width: 120,
      height: CARD_HEIGHT,
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    seeAllCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    seeAllTitle: {
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
      lineHeight: 15,
    },
    seeAllSub: {
      fontSize: 11,
      fontWeight: "700",
    },
    emptySubCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      marginRight: 4,
    },
    emptySubText: {
      fontSize: 12,
      fontWeight: "500",
      flex: 1,
      marginLeft: 8,
    },
    errorSubCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      marginRight: 4,
    },
    errorSubLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
      paddingRight: 8,
    },
    errorSubText: {
      fontSize: 12,
      fontWeight: "500",
    },
    retryChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 6,
    },
    retryChipText: {
      fontSize: 11,
      fontWeight: "700",
    },
  });

const createCardStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1.5 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    imageWrap: {
      position: "relative",
      width: "100%",
      height: 90,
      backgroundColor: dark ? colors.background : "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      padding: 6,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    discountBadge: {
      position: "absolute",
      top: 5,
      left: 5,
      zIndex: 2,
      backgroundColor: "#EF4444",
      paddingHorizontal: 4,
      paddingVertical: 1.5,
      borderRadius: 3,
    },
    discountBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "700",
    },
    infoWrap: {
      flex: 1,
      padding: 8,
      justifyContent: "space-between",
    },
    productTitle: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 15,
      height: 30,
    },
    priceRow: {
      marginVertical: 2,
    },
    salePriceContainer: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 4,
      flexWrap: "wrap",
    },
    salePrice: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    regularPrice: {
      fontSize: 10,
      color: colors.textSecondary || "#94A3B8",
      textDecorationLine: "line-through",
    },
    price: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    quickCartBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      backgroundColor: colors.primary,
      paddingVertical: 5,
      borderRadius: 6,
      marginTop: 2,
    },
    quickCartBtnInCart: {
      backgroundColor: colors.primary + "18",
      borderWidth: 1,
      borderColor: colors.primary,
    },
    quickCartBtnDisabled: {
      backgroundColor: colors.border,
      opacity: 0.6,
    },
    quickCartText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "600",
    },
    quickCartTextInCart: {
      color: colors.primary,
      fontWeight: "700",
    },
    quickCartTextDisabled: {
      color: colors.textSecondary || colors.text,
    },
  });
