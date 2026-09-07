import React, { useRef, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import StarRating from "react-native-star-rating-widget";
import { useTheme } from "@react-navigation/native";
import { toast } from "sonner-native";
import * as Haptics from "expo-haptics";

import { Colors } from "@/types/app";
import { Product } from "@/types/product";
import { ProductReviewsQueryParams } from "@/types/api";
import CustomButton from "@/components/common/CustomButton";
import Icon from "@/components/common/Icon";
import { useAuth } from "@/context/AuthContext";
import { useProductReviews } from "../services/query.service";
import ReviewCard, { ReviewCardSkeleton } from "./ReviewCard";
import ReviewModal, { ReviewBottomSheetRef } from "./ReviewModal";

interface Props {
  product: Product | null;
}

const ReviewProduct: React.FC<Props> = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const reviewModalRef = useRef<ReviewBottomSheetRef>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const openReviewModal = () => {
    Haptics.selectionAsync().catch(() => {});
    if (isAuthenticated) {
      reviewModalRef.current?.openModal();
    } else {
      toast.error("Sign in required", {
        description: "Please sign in to your account to post a review.",
      });
    }
  };

  const productTarget = String(product?.slug || product?.id || "");
  const params: ProductReviewsQueryParams = {
    status: "approved",
    orderby: "date",
    product: productTarget,
    order: "desc",
  };

  const { data, isPending, isError, error, refetch } = useProductReviews(params);
  const reviewsList = data?.pages?.flat() || [];

  const rawRating = parseFloat(product?.average_rating || "0");
  const reviewCount = reviewsList.length > 0 ? reviewsList.length : (product?.rating_count || 0);
  const hasReviews = reviewCount > 0 && reviewsList.length > 0;
  const ratingNum = hasReviews ? (rawRating > 0 ? rawRating : (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length)) : 0;

  // Calculate histogram percentages accurately from actual reviews
  const histogram = [5, 4, 3, 2, 1].map((stars) => {
    const matching = reviewsList.filter((r) => Math.round(Number(r.rating)) === stars);
    const count = matching.length;
    const percentage = hasReviews && reviewsList.length > 0 ? (count / reviewsList.length) * 100 : 0;
    return { stars, count, percentage };
  });

  // Filter reviews
  const filteredReviews = reviewsList.filter((r) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "verified") return r.is_verified_buyer;
    return Math.round(Number(r.rating)) === Number(selectedFilter);
  });

  return (
    <View style={styles.container}>
      {/* 1. Rating Overview & Breakdown Histogram Card */}
      <View style={styles.summaryCard}>
        <View style={styles.scoreBlock}>
          <Text style={styles.bigScore}>
            {hasReviews ? ratingNum.toFixed(1) : "0.0"}
          </Text>
          <StarRating
            onChange={() => {}}
            rating={hasReviews ? ratingNum : 0}
            starSize={18}
            enableSwiping={false}
          />
          <Text style={styles.totalReviewsText}>
            {reviewCount} {reviewCount === 1 ? "Customer Review" : "Customer Reviews"}
          </Text>
        </View>

        <View style={styles.histogramBlock}>
          {histogram.map((h) => (
            <View key={h.stars} style={styles.histogramRow}>
              <Text style={styles.starNumber}>{h.stars}★</Text>
              <View style={styles.barTrack}>
                {h.percentage > 0 && (
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(100, Math.max(6, h.percentage))}%`,
                      },
                    ]}
                  />
                )}
              </View>
              <Text style={styles.countText}>{h.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 2. Write Review CTA Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openReviewModal}
        style={styles.writeButton}
      >
        <Icon name="pencil" size={14} color="#FFFFFF" />
        <Text style={styles.writeButtonText}>Write a Review</Text>
      </TouchableOpacity>

      {/* 3. Filter Pills */}
      {reviewsList.length > 0 && (
        <View style={styles.filtersRow}>
          {[
            { key: "all", label: `All (${reviewsList.length})` },
            { key: "5", label: "5 Stars" },
            { key: "4", label: "4 Stars" },
            { key: "verified", label: "Verified Buyers" },
          ].map((f) => {
            const isActive = selectedFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSelectedFilter(f.key);
                }}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 4. Review Cards List */}
      {isPending ? (
        <View style={styles.reviewsList}>
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
        </View>
      ) : isError ? (
        <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="alert-circle" size={24} color={colors.error || "#EF4444"} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to load reviews</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary || colors.text }]}>
            {error?.message || "There was a network problem loading reviews."}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
            activeOpacity={0.8}
          >
            <Icon name="refresh" size={14} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.reviewsList}>
          {filteredReviews.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon
                name="star"
                size={34}
                color={colors.textSecondary || "#94A3B8"}
              />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to share your experience with this medical equipment.
              </Text>
            </View>
          ) : (
            filteredReviews.map((item) => (
              <ReviewCard key={item.id} reviews={item} />
            ))
          )}
        </View>
      )}

      {/* Review Modal Sheet */}
      <ReviewModal ref={reviewModalRef} />
    </View>
  );
};

export default ReviewProduct;

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    container: {
      paddingVertical: 6,
      gap: 14,
    },
    summaryCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 14,
    },
    scoreBlock: {
      alignItems: "center",
      gap: 4,
      width: "40%",
    },
    bigScore: {
      fontSize: 34,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.5,
    },
    totalReviewsText: {
      fontSize: 11,
      color: colors.textSecondary || "#64748B",
      fontWeight: "500",
      marginTop: 2,
    },
    histogramBlock: {
      flex: 1,
      gap: 5,
    },
    histogramRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    starNumber: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
      width: 20,
    },
    barTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: "#F59E0B",
    },
    countText: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textSecondary || "#94A3B8",
      width: 14,
      textAlign: "right",
    },
    writeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
      height: 42,
      borderRadius: 10,
      width: "100%",
    },
    writeButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
    filtersRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: dark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary + "14",
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
    },
    filterChipTextActive: {
      color: colors.primary,
      fontWeight: "700",
    },
    reviewsList: {
      gap: 10,
    },
    emptyCard: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
      paddingHorizontal: 20,
      gap: 8,
      backgroundColor: dark ? colors.card : "#FAFAFA",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    emptySubtitle: {
      fontSize: 12,
      color: colors.textSecondary || "#64748B",
      textAlign: "center",
      lineHeight: 18,
    },
    errorCard: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
      paddingHorizontal: 20,
      gap: 8,
      borderRadius: 14,
      borderWidth: 1,
    },
    errorTitle: {
      fontSize: 14,
      fontWeight: "700",
    },
    errorSubtitle: {
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
    },
    retryButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginTop: 4,
    },
    retryButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
    },
  });
