import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import StarRating from "react-native-star-rating-widget";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";

import { Colors } from "@/types/app";
import { useAuth } from "@/context/AuthContext";
import { useProductStore } from "@/features/product/stores/useProductStore";
import Icon from "@/components/common/Icon";
import CustomButton from "@/components/common/CustomButton";
import { usePostReview } from "../services/mutation.service";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const ANIM_DURATION = 260;

export interface ReviewBottomSheetRef {
  openModal: () => void;
  closeModal: () => void;
}

const RATING_FEEDBACK: Record<
  number,
  { label: string; color: string; icon: "star-filled" | "sparkles" | "check-circle" | "alert" }
> = {
  1: { label: "1.0 — Disappointing Quality", color: "#EF4444", icon: "alert" },
  2: { label: "2.0 — Fair / Needs Improvement", color: "#F97316", icon: "alert" },
  3: { label: "3.0 — Good / Standard", color: "#FBBF24", icon: "star-filled" },
  4: { label: "4.0 — Very Good / Recommended", color: "#10B981", icon: "sparkles" },
  5: { label: "5.0 — Excellent / Clinical Grade!", color: "#059669", icon: "sparkles" },
};

const ReviewModal = forwardRef<ReviewBottomSheetRef, {}>((_, ref) => {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, dark, insets.bottom);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const product = useProductStore((state) => state.product);

  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>("");
  const [reviewText, setReviewText] = useState<string>("");

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const postReview = usePostReview();

  const handleOpen = useCallback(() => {
    setRating(5);
    setTitle("");
    setReviewText("");
    setMounted(true);
    setVisible(true);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: ANIM_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, sheetTranslateY]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIM_DURATION - 40,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: ANIM_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setMounted(false);
    });
  }, [backdropOpacity, sheetTranslateY]);

  useImperativeHandle(ref, () => ({
    openModal: handleOpen,
    closeModal: handleClose,
  }));

  const handleRatingChange = (newRating: number) => {
    Haptics.selectionAsync().catch(() => {});
    setRating(newRating);
  };

  const submitReview = async () => {
    if (rating === 0) {
      toast.error("Rating required", {
        description: "Please select a star rating between 1 and 5.",
      });
      return;
    }

    if (reviewText.trim().length < 5) {
      toast.error("Review too short", {
        description: "Please write at least a few words about your experience.",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const payload = {
      product_id: Number(id || product?.id),
      rating,
      title: title.trim() || undefined,
      review: reviewText.trim(),
      reviewer: user?.username || user?.email?.split("@")[0] || "Customer",
      reviewer_email: user?.email,
    };

    postReview.mutate(payload, {
      onSuccess() {
        handleClose();
        setTitle("");
        setReviewText("");
        setRating(5);
      },
    });
  };

  if (!mounted) return null;

  const currentFeedback = RATING_FEEDBACK[Math.round(rating)] || RATING_FEEDBACK[5];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalRoot}>
        {/* Animated Dark Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </TouchableWithoutFeedback>

        {/* Animated Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardContainer}
          >
            {/* Sheet Handle Bar */}
            <View style={styles.handleWrap}>
              <View style={styles.handleIndicator} />
            </View>

            {/* Sheet Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <Icon name="star-filled" size={18} color="#F59E0B" />
                <Text style={styles.title}>Rate & Review</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClose}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Product Target Summary */}
              {product?.name && (
                <View style={styles.productPill}>
                  <Icon name="package" size={14} color={colors.primary} />
                  <Text style={styles.productNameText} numberOfLines={1}>
                    {product.name}
                  </Text>
                </View>
              )}

              {/* Star Rating Selector */}
              <View style={styles.ratingCard}>
                <Text style={styles.ratingPrompt}>How would you rate this item?</Text>
                <StarRating
                  rating={rating}
                  starSize={36}
                  enableSwiping={true}
                  onChange={handleRatingChange}
                  style={styles.starWidget}
                  color="#F59E0B"
                  emptyColor={dark ? "#334155" : "#E2E8F0"}
                />
                <View
                  style={[
                    styles.feedbackPill,
                    { backgroundColor: currentFeedback.color + "18" },
                  ]}
                >
                  <Icon
                    name={currentFeedback.icon}
                    size={12}
                    color={currentFeedback.color}
                  />
                  <Text
                    style={[
                      styles.feedbackText,
                      { color: currentFeedback.color },
                    ]}
                  >
                    {currentFeedback.label}
                  </Text>
                </View>
              </View>

              {/* Headline Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Review Headline <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <TextInput
                  style={styles.singleInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Reliable diagnostic accuracy, durable casing"
                  placeholderTextColor={colors.textSecondary || "#94A3B8"}
                  maxLength={80}
                  returnKeyType="next"
                />
              </View>

              {/* Detailed Experience Textarea */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Detailed Feedback</Text>
                  <Text style={styles.charCounter}>
                    {reviewText.length}/500
                  </Text>
                </View>
                <TextInput
                  style={styles.multilineInput}
                  multiline
                  numberOfLines={4}
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder="Tell other healthcare professionals about accuracy, packaging condition, calibration ease, and overall value..."
                  placeholderTextColor={colors.textSecondary || "#94A3B8"}
                  maxLength={500}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleClose}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <View style={styles.submitWrap}>
                  <CustomButton
                    disabled={postReview.isPending || reviewText.trim().length === 0}
                    onPress={submitReview}
                    title={postReview.isPending ? "Posting..." : "Submit Review"}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
});

export default ReviewModal;

const createStyles = (colors: Colors, dark: boolean, bottomInset: number) =>
  StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
    },
    sheetContainer: {
      backgroundColor: dark ? colors.card : "#FFFFFF",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomWidth: 0,
      maxHeight: SCREEN_HEIGHT * 0.85,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
        },
        android: { elevation: 12 },
      }),
    },
    keyboardContainer: {
      width: "100%",
    },
    handleWrap: {
      width: "100%",
      alignItems: "center",
      paddingVertical: 10,
    },
    handleIndicator: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: dark ? "rgba(255,255,255,0.2)" : "#CBD5E1",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitleWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: Math.max(bottomInset + 12, 24),
      gap: 16,
    },
    productPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: dark ? colors.primary + "12" : "#EFF6FF",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: dark ? colors.primary + "30" : "#DBEAFE",
    },
    productNameText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    ratingCard: {
      alignItems: "center",
      gap: 8,
      backgroundColor: dark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ratingPrompt: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
    },
    starWidget: {
      marginVertical: 4,
    },
    feedbackPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    feedbackText: {
      fontSize: 12,
      fontWeight: "700",
    },
    inputGroup: {
      gap: 6,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    optionalText: {
      fontSize: 11,
      fontWeight: "400",
      color: colors.textSecondary || "#94A3B8",
    },
    charCounter: {
      fontSize: 11,
      color: colors.textSecondary || "#94A3B8",
    },
    singleInput: {
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      backgroundColor: dark ? colors.background : "#FAFAFA",
      color: colors.text,
      fontSize: 13,
    },
    multilineInput: {
      height: 105,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      backgroundColor: dark ? colors.background : "#FAFAFA",
      color: colors.text,
      fontSize: 13,
      textAlignVertical: "top",
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 4,
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: dark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
      alignItems: "center",
      justifyContent: "center",
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
    },
    submitWrap: {
      flex: 2,
    },
  });
