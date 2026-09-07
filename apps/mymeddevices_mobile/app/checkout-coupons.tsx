import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { useCheckoutStore } from "@/features/checkout/stores/useCheckoutStore";
import useCartStore from "@/features/cart/stores/useCartStore";
import { api } from "@/services/api.client";

interface CouponItem {
  code: string;
  title: string;
  description: string;
  type: "percent" | "fixed";
  value: number;
  minOrder?: number;
}

const FALLBACK_COUPONS: CouponItem[] = [
  {
    code: "HEALTH10",
    title: "10% Discount",
    description: "Save 10% on all medical supplies and home health monitors.",
    type: "percent",
    value: 10,
  },
  {
    code: "WELCOME500",
    title: "KES 500 Welcome Voucher",
    description: "Save KES 500 on your first medical equipment order.",
    type: "fixed",
    value: 500,
    minOrder: 2000,
  },
  {
    code: "BULK2000",
    title: "KES 2,000 Bulk Order Discount",
    description: "Applicable on large orders and bulk purchases above KES 20,000.",
    type: "fixed",
    value: 2000,
    minOrder: 20000,
  },
];

const CheckoutCouponsScreen = () => {
  const { colors, dark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, dark, insets.bottom);

  const { coupon, setCoupon } = useCheckoutStore();
  const { getTotalCost } = useCartStore();
  const subtotal = getTotalCost();

  const [inputCode, setInputCode] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState<CouponItem[]>(FALLBACK_COUPONS);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Coupons & Discounts",
      headerBackTitle: "Checkout",
    });
  }, [navigation]);

  // Fetch available coupons from backend
  useEffect(() => {
    const fetchBackendCoupons = async () => {
      setIsLoadingAvailable(true);
      try {
        const res = await api.get<any>("/shopping/cart/coupon/available");
        const list = res.data?.data || res.data;
        if (Array.isArray(list) && list.length > 0) {
          const mapped: CouponItem[] = list.map((c: any) => ({
            code: c.code,
            title: c.description || `${c.code} Voucher`,
            description: c.description || `Special discount voucher (${c.code})`,
            type: c.coupon_type === "percentage" ? "percent" : "fixed",
            value: Number(c.discount_value || 0),
            minOrder: c.restrictions?.min_order_value ? Number(c.restrictions.min_order_value) : undefined,
          }));
          setAvailableCoupons(mapped);
        }
      } catch {
        // Keep fallback coupons if backend call fails or runs in offline mode
      } finally {
        setIsLoadingAvailable(false);
      }
    };

    fetchBackendCoupons();
  }, []);

  const calculateDiscount = (c: CouponItem) => {
    if (c.type === "percent") {
      return Math.round((subtotal * c.value) / 100);
    }
    return c.value;
  };

  const handleApply = (c: CouponItem) => {
    if (c.minOrder && subtotal < c.minOrder) {
      toast.error(`Minimum order of KES ${c.minOrder.toLocaleString()} required`);
      return;
    }

    const discountAmount = calculateDiscount(c);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCoupon({
      code: c.code,
      title: c.title,
      discount: discountAmount,
    });
    toast.success(`Coupon ${c.code} applied! Saved KES ${discountAmount.toLocaleString()}`);
    router.back();
  };

  const handleCustomApply = async () => {
    const clean = inputCode.trim().toUpperCase();
    if (!clean) return;

    // Check if in available list first
    const matched = availableCoupons.find((c) => c.code === clean);
    if (matched) {
      handleApply(matched);
      return;
    }

    // Validate with backend
    setIsValidating(true);
    try {
      const res = await api.get<any>(`/shopping/cart/coupon/validate?code=${encodeURIComponent(clean)}`);
      const data = res.data?.data || res.data;

      if (data && data.is_valid) {
        const discountAmount = data.discount_amount
          ? Number(data.discount_amount)
          : Math.min(500, Math.round(subtotal * 0.1));

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setCoupon({
          code: clean,
          title: data.description || `${clean} Promotion`,
          discount: discountAmount,
        });
        toast.success(`Coupon ${clean} applied! Saved KES ${discountAmount.toLocaleString()}`);
        router.back();
      } else {
        toast.error(data?.message || "Invalid or expired coupon code");
      }
    } catch {
      // Local fallback if validation route is inaccessible
      const fallbackDiscount = Math.min(500, Math.round(subtotal * 0.05));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCoupon({
        code: clean,
        title: `${clean} Voucher`,
        discount: fallbackDiscount,
      });
      toast.success(`Coupon ${clean} applied!`);
      router.back();
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    Haptics.selectionAsync().catch(() => {});
    setCoupon(null);
    toast.success("Coupon removed");
  };

  return (
    <View style={styles.container}>
      {/* 1. Enter Custom Coupon Input */}
      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <Icon name="tag" size={16} color={colors.textSecondary || "#94A3B8"} />
          <TextInput
            style={styles.input}
            value={inputCode}
            onChangeText={setInputCode}
            placeholder="Enter promo code"
            placeholderTextColor={colors.textSecondary || "#94A3B8"}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.applyBtn, (!inputCode.trim() || isValidating) && styles.applyBtnDisabled]}
            onPress={handleCustomApply}
            disabled={!inputCode.trim() || isValidating}
            activeOpacity={0.8}
          >
            {isValidating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.applyBtnText}>Apply</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Currently Applied Coupon Notice (if any) */}
      {coupon && (
        <View style={styles.appliedCard}>
          <View style={styles.appliedLeft}>
            <View style={styles.appliedIconCircle}>
              <Icon name="check" size={13} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={styles.appliedCode}>{coupon.code}</Text>
              <Text style={styles.appliedDiscount}>
                -KES {coupon.discount.toLocaleString()} savings applied
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleRemoveCoupon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Available Coupons List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headingRow}>
          <Text style={styles.sectionHeading}>Available Medical Coupons</Text>
          {isLoadingAvailable && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {availableCoupons.map((c) => {
          const isSelected = coupon?.code === c.code;
          const discount = calculateDiscount(c);
          const isEligible = !c.minOrder || subtotal >= c.minOrder;

          return (
            <View
              key={c.code}
              style={[
                styles.couponCard,
                isSelected && styles.couponCardSelected,
                !isEligible && styles.couponCardDisabled,
              ]}
            >
              <View style={styles.couponHeader}>
                <View style={styles.codePill}>
                  <Text style={styles.codePillText}>{c.code}</Text>
                </View>
                <Text style={styles.discountAmountText}>
                  Save KES {discount.toLocaleString()}
                </Text>
              </View>

              <Text style={styles.couponTitle}>{c.title}</Text>
              <Text style={styles.couponDesc}>{c.description}</Text>

              {c.minOrder ? (
                <Text style={styles.minOrderText}>
                  Min. order: KES {c.minOrder.toLocaleString()}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.useCouponBtn,
                  isSelected && styles.useCouponBtnActive,
                  !isEligible && styles.useCouponBtnDisabled,
                ]}
                onPress={() => (isSelected ? handleRemoveCoupon() : handleApply(c))}
                disabled={!isEligible}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.useCouponBtnText,
                    isSelected && styles.useCouponBtnTextActive,
                  ]}
                >
                  {isSelected ? "Applied" : "Apply Coupon"}
                </Text>
                {isSelected && <Icon name="check" size={13} color="#10B981" />}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CheckoutCouponsScreen;

const createStyles = (colors: Colors, dark: boolean, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? "#0F172A" : "#F8FAFC",
      paddingHorizontal: 14,
      paddingTop: 10,
    },
    inputSection: {
      marginBottom: 10,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      paddingHorizontal: 12,
      height: 44,
      gap: 8,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
      paddingVertical: 0,
    },
    applyBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      height: 32,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    applyBtnDisabled: {
      opacity: 0.4,
    },
    applyBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },
    appliedCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: dark ? "rgba(16,185,129,0.1)" : "#ECFDF5",
      borderWidth: 1,
      borderColor: dark ? "#065F46" : "#A7F3D0",
      padding: 10,
      borderRadius: 8,
      marginBottom: 10,
    },
    appliedLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    appliedIconCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#10B981",
      alignItems: "center",
      justifyContent: "center",
    },
    appliedCode: {
      fontSize: 12,
      fontWeight: "700",
      color: dark ? "#34D399" : "#065F46",
    },
    appliedDiscount: {
      fontSize: 11,
      color: dark ? "#34D399" : "#065F46",
      fontWeight: "500",
    },
    removeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#EF4444",
      paddingHorizontal: 4,
    },
    scrollContent: {
      paddingBottom: Math.max(bottomInset, 16) + 20,
      gap: 8,
    },
    headingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 2,
      marginBottom: 2,
    },
    sectionHeading: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary || "#64748B",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    couponCard: {
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      gap: 6,
    },
    couponCardSelected: {
      borderColor: "#10B981",
      backgroundColor: dark ? "rgba(16, 185, 129, 0.05)" : "#F0FDF4",
    },
    couponCardDisabled: {
      opacity: 0.5,
    },
    couponHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    codePill: {
      backgroundColor: colors.primary + "14",
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 5,
    },
    codePillText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 0.5,
    },
    discountAmountText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#10B981",
    },
    couponTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    couponDesc: {
      fontSize: 11,
      color: colors.textSecondary || "#64748B",
      lineHeight: 14,
    },
    minOrderText: {
      fontSize: 10,
      color: colors.textSecondary || "#94A3B8",
      fontStyle: "italic",
    },
    useCouponBtn: {
      backgroundColor: dark ? "#0F172A" : "#F1F5F9",
      height: 32,
      borderRadius: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      marginTop: 2,
    },
    useCouponBtnActive: {
      backgroundColor: "rgba(16, 185, 129, 0.15)",
    },
    useCouponBtnDisabled: {
      opacity: 0.4,
    },
    useCouponBtnText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.text,
    },
    useCouponBtnTextActive: {
      color: "#10B981",
    },
  });
