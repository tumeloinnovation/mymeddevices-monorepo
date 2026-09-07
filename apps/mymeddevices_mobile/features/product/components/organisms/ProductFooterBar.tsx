import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";

import { Product } from "@/types/product";
import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";
import useCartStore from "@/features/cart/stores/useCartStore";

interface ProductFooterBarProps {
  product: Product;
}

export const ProductFooterBar: React.FC<ProductFooterBarProps> = ({ product }) => {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, dark, insets.bottom);

  const cartQuantity = useCartStore((state) =>
    state.getProductQuantity(product.id)
  );
  const isInCart = useCartStore((state) => state.isInCart(product.id));
  const addToCart = useCartStore((state) => state.addToCart);
  const reduceFromCart = useCartStore((state) => state.reduceFromCart);

  // Local quantity selection before/with adding to cart
  const [selectedQty, setSelectedQty] = useState(1);

  useEffect(() => {
    if (cartQuantity > 0) {
      setSelectedQty(cartQuantity);
    }
  }, [cartQuantity]);

  const unitPrice = Number(
    product.sale_price || product.price || product.regular_price || 0
  );
  const totalPrice = unitPrice * (isInCart ? cartQuantity || 1 : selectedQty);
  const isOutOfStock = product.stock_status === "outofstock";
  const maxStock = product.stock_quantity ?? 99;

  const handleIncrement = () => {
    Haptics.selectionAsync().catch(() => {});
    if (isInCart) {
      if (cartQuantity < maxStock) {
        addToCart(product);
      } else {
        toast.info(`Maximum available stock is ${maxStock}`);
      }
    } else {
      if (selectedQty < maxStock) {
        setSelectedQty((prev) => prev + 1);
      } else {
        toast.info(`Maximum available stock is ${maxStock}`);
      }
    }
  };

  const handleDecrement = () => {
    Haptics.selectionAsync().catch(() => {});
    if (isInCart) {
      reduceFromCart(product);
    } else {
      if (selectedQty > 1) {
        setSelectedQty((prev) => prev - 1);
      }
    }
  };

  const handleAddToCart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    if (!isInCart) {
      // Add according to selected quantity
      for (let i = 0; i < selectedQty; i++) {
        addToCart(product);
      }
      toast.success("Added to cart", {
        description: `${selectedQty}x ${product.name}`,
      });
    } else {
      router.push("/cart");
    }
  };

  const handleEnquire = async () => {
    Haptics.selectionAsync().catch(() => {});
    const message = encodeURIComponent(
      `Hello MyMedDevices, I would like to ask about: ${product.name} (SKU: ${product.sku || product.id}). Is it in stock?`
    );
    const whatsappUrl = `https://wa.me/254700000000?text=${message}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else if (product.permalink) {
      await Linking.openURL(product.permalink);
    } else {
      toast.info("Customer support line: +254 700 000 000");
    }
  };

  const currentCount = isInCart ? cartQuantity : selectedQty;

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        {/* Out of stock enquiry full bar */}
        {isOutOfStock ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleEnquire}
            style={styles.enquireButton}
          >
            <Icon name="message-square" size={16} color="#FFFFFF" />
            <Text style={styles.enquireButtonText}>Request Quote / Enquire</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Minimal Stepper Capsule */}
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={currentCount <= 1}
                onPress={handleDecrement}
                style={[
                  styles.stepButton,
                  currentCount <= 1 && styles.stepButtonDisabled,
                ]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Icon
                  name="minus"
                  size={12}
                  color={
                    currentCount <= 1
                      ? colors.textDisabled || "#94A3B8"
                      : colors.text
                  }
                />
              </TouchableOpacity>

              <Text style={styles.stepperValue}>{currentCount}</Text>

              <TouchableOpacity
                activeOpacity={0.7}
                disabled={currentCount >= maxStock}
                onPress={handleIncrement}
                style={[
                  styles.stepButton,
                  currentCount >= maxStock && styles.stepButtonDisabled,
                ]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Icon
                  name="plus"
                  size={12}
                  color={
                    currentCount >= maxStock
                      ? colors.textDisabled || "#94A3B8"
                      : colors.text
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Dynamic Combined CTA + Subtotal Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAddToCart}
              style={[
                styles.primaryButton,
                isInCart && styles.inCartPrimaryButton,
              ]}
            >
              <View style={styles.buttonLeftGroup}>
                <Icon
                  name={isInCart ? "shopping-bag" : "cart"}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.primaryButtonText} numberOfLines={1}>
                  {isInCart ? `View Cart (${cartQuantity})` : "Add to Cart"}
                </Text>
              </View>

              <View style={styles.buttonRightGroup}>
                <Text style={styles.buttonPriceText}>
                  KES {totalPrice.toLocaleString()}
                </Text>
                {isInCart && (
                  <Icon name="chevron-right" size={14} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default ProductFooterBar;

const createStyles = (colors: Colors, dark: boolean, bottomInset: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: Math.max(bottomInset, 16) + 6,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 5,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    contentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      height: 46,
    },
    stepperContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
      borderRadius: 12,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border,
      height: 46,
    },
    stepButton: {
      width: 30,
      height: 38,
      borderRadius: 8,
      backgroundColor: dark ? colors.background : "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
    },
    stepButtonDisabled: {
      opacity: 0.35,
    },
    stepperValue: {
      minWidth: 26,
      textAlign: "center",
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    primaryButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.primary,
      height: 46,
      borderRadius: 12,
      paddingHorizontal: 14,
    },
    inCartPrimaryButton: {
      backgroundColor: colors.primary,
    },
    buttonLeftGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 1,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.1,
    },
    buttonRightGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    buttonPriceText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: -0.2,
    },
    enquireButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      height: 46,
      borderRadius: 12,
    },
    enquireButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
  });
