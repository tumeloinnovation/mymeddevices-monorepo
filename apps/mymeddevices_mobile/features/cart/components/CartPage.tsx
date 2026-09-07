import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import useCartStore from "../stores/useCartStore";
import { useWishlistStore } from "@/features/wishlist/stores/useWishlistStore";
import Icon from "@/components/common/Icon";
import OnSaleProducts from "@/features/product/components/organisms/OnSaleProducts";
import CartItems from "./CartItems";
import { Colors } from "@/types/app";

const CartPage = () => {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, dark, insets.bottom);

  const total_cost = useCartStore((state) => state.getTotalCost);
  const products_in_cart = useCartStore((state) => state.cart_list);
  const clearCart = useCartStore((state) => state.clearCart);

  const handleProceedToCheckout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.navigate("/checkout");
  };

  const wishlistItems = useWishlistStore((state) => state.wishlist_list);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);

  const totalItemCount = products_in_cart.reduce(
    (acc, item) => acc + (item.quantity || 1),
    0
  );

  // 1. EMPTY CART STATE
  if (!products_in_cart.length) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal Empty Hero */}
        <View style={styles.emptyHero}>
          <View style={styles.emptyIconCircle}>
            <Icon name="shopping-cart" size={30} color={colors.primary} />
          </View>
          <Text style={styles.emptyHeroTitle}>Your cart is empty</Text>
          <Text style={styles.emptyHeroSubtitle}>
            Browse certified medical equipment, diagnostics, and clinic supplies.
          </Text>

          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.navigate("/");
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.exploreBtnText}>Explore Catalog</Text>
            <Icon name="chevron-right" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Saved Wishlist Strip (if user has saved items) */}
        {wishlistItems.length > 0 && (
          <View style={styles.wishlistSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Icon name="heart-filled" size={14} color="#EF4444" />
                <Text style={styles.sectionTitle}>
                  Saved Items ({wishlistItems.length})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/wishlist")}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.wishlistScroll}
            >
              {wishlistItems.map((item) => (
                <View key={item.id} style={styles.wishlistCard}>
                  <Image
                    source={item.images?.[0]?.src}
                    style={styles.wishlistImage}
                    contentFit="contain"
                    placeholder={require("@/assets/images/placeholder.png")}
                  />
                  <Text style={styles.wishlistTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.wishlistPrice}>
                    KES {Number(item.price || 0).toLocaleString()}
                  </Text>

                  <TouchableOpacity
                    style={styles.moveBtn}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      addToCart(item);
                      removeFromWishlist(item);
                    }}
                    activeOpacity={0.8}
                  >
                    <Icon name="cart" size={12} color="#FFFFFF" />
                    <Text style={styles.moveBtnText}>Move to Cart</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Trending Deals */}
        <View style={styles.recommendationsSection}>
          <OnSaleProducts />
        </View>
      </ScrollView>
    );
  }

  // 2. POPULATED CART STATE
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header Strip */}
        <View style={styles.cartHeaderRow}>
          <Text style={styles.cartHeaderTitle}>
            Cart ({totalItemCount} {totalItemCount === 1 ? "item" : "items"})
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              clearCart();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={styles.clearCartText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Flat Cart Items List */}
        <View style={styles.itemsListContainer}>
          {products_in_cart.map((data, index) => (
            <CartItems item={data} key={data.id || index} />
          ))}
        </View>

        {/* Order Summary Card with Integrated Checkout CTA */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Order Summary</Text>

          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>
              Subtotal ({totalItemCount} {totalItemCount === 1 ? "item" : "items"})
            </Text>
            <Text style={styles.summaryValue}>
              KES {total_cost().toLocaleString()}
            </Text>
          </View>

          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValueSubtle}>
              Calculated at checkout
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryLine}>
            <Text style={styles.summaryTotalLabel}>Total Amount</Text>
            <Text style={styles.summaryTotalValue}>
              KES {total_cost().toLocaleString()}
            </Text>
          </View>

          {/* Proceed to Checkout CTA Button */}
          <TouchableOpacity
            onPress={handleProceedToCheckout}
            activeOpacity={0.85}
            style={styles.checkoutBtn}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            <Icon name="chevron-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CartPage;

const createStyles = (colors: Colors, dark: boolean, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: Math.max(bottomInset, 16) + 84,
    },
    cartHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    cartHeaderTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    clearCartText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary || "#94A3B8",
    },
    itemsListContainer: {
      backgroundColor: dark ? colors.card : "#FFFFFF",
      marginBottom: 10,
    },
    summaryCard: {
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 12,
      marginBottom: 10,
    },
    summaryCardTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.3,
      marginBottom: 2,
    },
    summaryLine: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.textSecondary || "#64748B",
    },
    summaryValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    summaryValueSubtle: {
      fontSize: 12,
      color: colors.textSecondary || "#94A3B8",
    },
    summaryDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    summaryTotalLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    summaryTotalValue: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.primary,
    },
    checkoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      width: "100%",
      height: 46,
      borderRadius: 10,
      marginTop: 6,
    },
    checkoutBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    emptyScrollContent: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: Math.max(bottomInset, 16) + 84,
    },
    emptyHero: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
      paddingHorizontal: 20,
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    emptyIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + "14",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    emptyHeroTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 6,
    },
    emptyHeroSubtitle: {
      fontSize: 13,
      color: colors.textSecondary || "#64748B",
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 18,
    },
    exploreBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
      height: 42,
      paddingHorizontal: 20,
      borderRadius: 10,
    },
    exploreBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
    wishlistSection: {
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    sectionHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    wishlistScroll: {
      gap: 10,
    },
    wishlistCard: {
      width: 140,
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    wishlistImage: {
      width: "100%",
      height: 80,
      borderRadius: 6,
      marginBottom: 6,
    },
    wishlistTitle: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 15,
      height: 30,
      marginBottom: 4,
    },
    wishlistPrice: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
      marginBottom: 8,
    },
    moveBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      backgroundColor: colors.primary,
      paddingVertical: 6,
      borderRadius: 6,
    },
    moveBtnText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
    },
    recommendationsSection: {
      marginTop: 6,
    },
  });
