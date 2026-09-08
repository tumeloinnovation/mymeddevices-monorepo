import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Platform,
  StatusBar,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Icon from "@/components/common/Icon";
import useShopStore from "@/stores/useShopStore";
import { Colors, SheetRefProps } from "@/types/app";
import { SIZES } from "@/styles/sizes";

const ANIMATION_DURATION = 240;

const SortSheet = forwardRef<SheetRefProps, {}>((_props, ref) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.bottom), [colors, insets.bottom]);

  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(350)).current;

  const { params, tempParams, setTempParam, applyParams, resetParams } = useShopStore();

  useImperativeHandle(ref, () => ({
    openSheet: () => {
      setMounted(true);
      setVisible(true);
    },
    close: () => {
      handleClose();
    },
  }));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 350,
          duration: ANIMATION_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, backdropOpacity, sheetTranslateY]);

  const handleClose = () => {
    setVisible(false);
  };

  const handleApply = () => {
    applyParams();
    handleClose();
  };

  const handleReset = () => {
    resetParams();
    handleClose();
  };

  const sortOptions = [
    { label: "Most Popular", orderby: "popularity", order: "asc", icon: "zap" as const },
    { label: "Top Customer Rating", orderby: "rating", order: "desc", icon: "star-filled" as const },
    { label: "Newest Arrivals", orderby: "date", order: "desc", icon: "sparkles" as const },
    { label: "Price: Low to High", orderby: "price", order: "asc", icon: "sort-asc" as const },
    { label: "Price: High to Low", orderby: "price", order: "desc", icon: "sort-desc" as const },
  ];

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.card,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          {/* Header & Handle */}
          <View style={styles.handleBar} />
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <Icon name="sort" size={18} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Sort Medical Devices</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Icon name="close" size={18} color={colors.textSecondary || colors.text} />
            </TouchableOpacity>
          </View>

          {/* Sort Options List */}
          <View style={styles.optionsContainer}>
            {sortOptions.map((opt, idx) => {
              const isActive =
                (tempParams.orderby === opt.orderby && (tempParams.order || "asc") === opt.order) ||
                (tempParams.orderby === undefined &&
                  params.orderby === opt.orderby &&
                  (params.order || "asc") === opt.order);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionRow,
                    {
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? colors.primary + "10" : colors.background,
                    },
                  ]}
                  onPress={() => {
                    setTempParam("orderby", opt.orderby);
                    setTempParam("order", opt.order);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <Icon
                      name={opt.icon}
                      size={18}
                      color={isActive ? colors.primary : colors.textSecondary || colors.text}
                    />
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color: isActive ? colors.primary : colors.text,
                          fontWeight: isActive ? "700" : "500",
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isActive ? colors.primary : colors.border,
                        backgroundColor: isActive ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    {isActive && <View style={styles.radioInnerDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: colors.border }]}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetBtnText, { color: colors.text }]}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: colors.primary }]}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Apply Sort</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

export default SortSheet;

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    sheetContainer: {
      borderTopLeftRadius: SIZES.radius_large,
      borderTopRightRadius: SIZES.radius_large,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Math.max(bottomInset + 12, 24),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 10,
    },
    handleBar: {
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 14,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 14,
    },
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "700",
    },
    closeBtn: {
      padding: 4,
    },
    optionsContainer: {
      gap: 10,
      marginBottom: 20,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1.5,
    },
    optionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    optionLabel: {
      fontSize: 14,
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    radioInnerDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#FFFFFF",
    },
    footerRow: {
      flexDirection: "row",
      gap: 12,
    },
    resetBtn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    resetBtnText: {
      fontSize: 14,
      fontWeight: "600",
    },
    applyBtn: {
      flex: 2,
      paddingVertical: 13,
      borderRadius: SIZES.radius_medium,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    applyBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
  });
