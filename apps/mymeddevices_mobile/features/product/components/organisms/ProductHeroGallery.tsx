import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Share,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";

import { Product } from "@/types/product";
import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";
import { useWishlistStore } from "@/features/wishlist/stores/useWishlistStore";
import useCompareStore from "@/features/compare/stores/useCompareStore";
import { useCompareToggle } from "@/features/compare/hooks/useCompareToggle";
import useAppStore from "@/stores/useAppStore";
import { router } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GALLERY_HEIGHT = 380;

interface ProductHeroGalleryProps {
  product: Product;
}

export const ProductHeroGallery: React.FC<ProductHeroGalleryProps> = ({ product }) => {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, dark, insets.top);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Wishlist store hooks
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);

  // Compare store hooks
  const isInCompare = useCompareStore((state) => state.isInCompare(product.id));
  const { toggle: toggleCompare } = useCompareToggle(product);
  const openRelatedProducts = useAppStore((s) => s.openRelatedProducts);

  const images =
    product?.images && product.images.length > 0
      ? product.images
      : [{ id: "placeholder", src: "", alt: product?.name || "Product Image" }];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slide !== activeIndex && slide >= 0 && slide < images.length) {
      setActiveIndex(slide);
    }
  };

  const handleWishlistToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (isInWishlist) {
      removeFromWishlist(product);
      toast.info("Removed from Wishlist");
    } else {
      addToWishlist(product);
      toast.success("Added to Wishlist");
    }
  };

  const handleCompareToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const compareList = useCompareStore.getState().compare_list;
    const isAlreadyIn = useCompareStore.getState().isInCompare(product.id);

    if (isAlreadyIn) {
      toggleCompare(product);
      toast.info("Removed from Compare");
      return;
    }

    const result = toggleCompare(product);
    if (result === "added") {
      if (compareList.length === 0) {
        toast.success("Added to Compare", {
          description: "Select a related item to compare side by side.",
        });
        openRelatedProducts(product.related_ids ?? []);
      } else if (compareList.length >= 1) {
        router.push("/compare");
      }
    }
  };

  const handleShare = async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      await Share.share({
        title: product.name,
        message: `Check out ${product.name} on MyMedDevices Kenya: Ksh ${Number(
          product.sale_price || product.price || product.regular_price || 0
        ).toLocaleString()}`,
        url: product.permalink,
      });
    } catch (error) {
      console.warn("Error sharing product:", error);
    }
  };

  const discountPercent =
    product.on_sale && product.regular_price && product.sale_price
      ? Math.round(
          ((Number(product.regular_price) - Number(product.sale_price)) /
            Number(product.regular_price)) *
            100
        )
      : null;

  const isOutOfStock = product.stock_status === "outofstock";

  return (
    <View style={styles.container}>
      {/* Main Image Slider */}
      <View style={styles.imageWrapper}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scrollContainer}
        >
          {images.map((img, idx) => (
            <View key={img.id || idx} style={styles.slide}>
              <Image
                source={img.src}
                style={styles.image}
                contentFit="contain"
                placeholder={require("@/assets/images/placeholder.png")}
                transition={250}
              />
            </View>
          ))}
        </ScrollView>

        {/* Floating Action Buttons Overlay (Side of Image) */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleWishlistToggle}
            style={styles.actionButton}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Icon
              name={isInWishlist ? "heart-filled" : "heart"}
              size={17}
              color={isInWishlist ? "#EF4444" : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCompareToggle}
            style={[styles.actionButton, isInCompare && styles.actionButtonActive]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Icon
              name="arrow-left-right"
              size={15}
              color={isInCompare ? colors.primary : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleShare}
            style={styles.actionButton}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Icon name="share" size={15} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Centered Expanding Pill Dots */}
        {images.length > 1 && (
          <View style={styles.dotsContainer}>
            {images.map((_, idx) => {
              const isActive = activeIndex === idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    isActive ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

export default ProductHeroGallery;

const createStyles = (colors: Colors, dark: boolean, topInset: number) =>
  StyleSheet.create({
    container: {
      width: "100%",
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    imageWrapper: {
      position: "relative",
      width: SCREEN_WIDTH,
      height: GALLERY_HEIGHT,
      backgroundColor: dark ? colors.card : "#FAFAFA",
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContainer: {
      width: SCREEN_WIDTH,
      height: GALLERY_HEIGHT,
    },
    slide: {
      width: SCREEN_WIDTH,
      height: GALLERY_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    actionButtons: {
      position: "absolute",
      top: Math.max(topInset, 16) + 54,
      right: 16,
      zIndex: 10,
      flexDirection: "column",
      gap: 10,
    },
    actionButton: {
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
    actionButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "18",
    },
    dotsContainer: {
      position: "absolute",
      bottom: 12,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: dark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.7)",
      borderWidth: 1,
      borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
    },
    dot: {
      height: 5,
      borderRadius: 3,
    },
    activeDot: {
      width: 16,
      backgroundColor: colors.primary,
    },
    inactiveDot: {
      width: 5,
      backgroundColor: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
    },
  });
