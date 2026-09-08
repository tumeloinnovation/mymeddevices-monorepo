import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Animated } from "react-native";
import { useTheme } from "@react-navigation/native";
import StarRating from "react-native-star-rating-widget";
import * as Haptics from "expo-haptics";

import { Colors } from "@/types/app";
import { ProductReview } from "@/types/review";
import Avatar from "@/components/common/Avatar";
import Icon from "@/components/common/Icon";
import { formatTimeAgo } from "@/utils/formatTime";

interface ReviewCardProps {
  reviews: ProductReview;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ reviews }) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const [helpfulCount, setHelpfulCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const handleHelpful = () => {
    Haptics.selectionAsync().catch(() => {});
    if (hasLiked) {
      setHelpfulCount((prev) => Math.max(0, prev - 1));
      setHasLiked(false);
    } else {
      setHelpfulCount((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  const reviewerName =
    reviews.reviewer_name || reviews.reviewer || "Verified Healthcare Buyer";

  return (
    <View style={styles.container}>
      {/* Top Header: Avatar, Name, Rating, Date */}
      <View style={styles.topRow}>
        <View style={styles.userSection}>
          <Avatar name={reviewerName} />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {reviewerName}
              </Text>
              {reviews.is_verified_buyer && (
                <View style={styles.verifiedBadge}>
                  <Icon name="badge-check" size={12} color="#059669" />
                  <Text style={styles.verifiedText}>Verified Buyer</Text>
                </View>
              )}
            </View>

            <View style={styles.ratingRow}>
              <StarRating
                onChange={() => {}}
                rating={Number(reviews.rating) || 5}
                starSize={14}
                enableSwiping={false}
                starStyle={styles.star}
              />
              <Text style={styles.dateText}>
                {formatTimeAgo(reviews.date_created)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Review Title if present */}
      {reviews.title ? (
        <Text style={styles.reviewTitle}>{reviews.title}</Text>
      ) : null}

      {/* Review Body */}
      <Text style={styles.reviewBody}>
        {reviews.review || "Great quality medical equipment. Prompt delivery."}
      </Text>

      {/* Helpful Action Bar */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleHelpful}
          style={[styles.helpfulButton, hasLiked && styles.helpfulButtonActive]}
        >
          <Icon
            name="check"
            size={12}
            color={hasLiked ? colors.primary : colors.textSecondary || "#64748B"}
          />
          <Text
            style={[
              styles.helpfulText,
              hasLiked && styles.helpfulTextActive,
            ]}
          >
            {helpfulCount > 0
              ? `Helpful (${helpfulCount})`
              : "Helpful"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ReviewCard;

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    userSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    userInfo: {
      flex: 1,
      gap: 3,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
    },
    userName: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: dark ? "#064E3B33" : "#ECFDF5",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    verifiedText: {
      fontSize: 10,
      fontWeight: "700",
      color: dark ? "#34D399" : "#059669",
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    star: {
      marginHorizontal: 0,
    },
    dateText: {
      fontSize: 11,
      color: colors.textSecondary || "#94A3B8",
    },
    reviewTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginTop: 2,
    },
    reviewBody: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 19,
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 2,
    },
    helpfulButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: dark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
      borderWidth: 1,
      borderColor: colors.border,
    },
    helpfulButtonActive: {
      backgroundColor: colors.primary + "14",
      borderColor: colors.primary,
    },
    helpfulText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
    },
    helpfulTextActive: {
      color: colors.primary,
      fontWeight: "700",
    },
  });

export const ReviewCardSkeleton: React.FC = () => {
  const { colors, dark } = useTheme();
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
    <View
      style={{
        backgroundColor: dark ? colors.card : "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Animated.View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.border,
            opacity,
          }}
        />
        <View style={{ flex: 1, gap: 5 }}>
          <Animated.View
            style={{
              width: "45%",
              height: 12,
              borderRadius: 6,
              backgroundColor: colors.border,
              opacity,
            }}
          />
          <Animated.View
            style={{
              width: "30%",
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.border,
              opacity,
            }}
          />
        </View>
      </View>
      <Animated.View
        style={{
          width: "100%",
          height: 12,
          borderRadius: 6,
          backgroundColor: colors.border,
          opacity,
        }}
      />
      <Animated.View
        style={{
          width: "80%",
          height: 12,
          borderRadius: 6,
          backgroundColor: colors.border,
          opacity,
        }}
      />
    </View>
  );
};
