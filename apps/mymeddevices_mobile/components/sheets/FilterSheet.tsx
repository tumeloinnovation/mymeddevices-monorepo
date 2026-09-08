import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Icon from "@/components/common/Icon";
import useShopStore from "@/stores/useShopStore";
import { Colors, SheetRefProps } from "@/types/app";
import { SIZES } from "@/styles/sizes";

const ANIMATION_DURATION = 240;

const PRICE_PRESETS = [
  { label: "Under 5k", min: "0", max: "5000" },
  { label: "5k - 20k", min: "5000", max: "20000" },
  { label: "20k - 50k", min: "20000", max: "50000" },
  { label: "50k+", min: "50000", max: "250000" },
];

const FilterSheet = forwardRef<SheetRefProps, {}>((_props, ref) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.bottom), [colors, insets.bottom]);

  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(550)).current;

  const { params, tempParams, applyParams, setTempParam, resetParams, resetTempParams } =
    useShopStore();

  const [minPriceInput, setMinPriceInput] = useState(params.min_price || "");
  const [maxPriceInput, setMaxPriceInput] = useState(params.max_price || "");
  const [isOnSale, setIsOnSale] = useState(Boolean(params.on_sale));

  useImperativeHandle(ref, () => ({
    openSheet: () => {
      setMinPriceInput(params.min_price || tempParams.min_price || "");
      setMaxPriceInput(params.max_price || tempParams.max_price || "");
      setIsOnSale(Boolean(tempParams.on_sale ?? params.on_sale));
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
          toValue: 550,
          duration: ANIMATION_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, backdropOpacity, sheetTranslateY]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const handleApply = useCallback(() => {
    setTempParam("min_price", minPriceInput.trim() ? minPriceInput.trim() : undefined);
    setTempParam("max_price", maxPriceInput.trim() ? maxPriceInput.trim() : undefined);
    setTempParam("on_sale", isOnSale ? true : undefined);
    applyParams();
    handleClose();
  }, [minPriceInput, maxPriceInput, isOnSale, setTempParam, applyParams, handleClose]);

  const handleReset = useCallback(() => {
    setMinPriceInput("");
    setMaxPriceInput("");
    setIsOnSale(false);
    resetParams();
    handleClose();
  }, [resetParams, handleClose]);

  const handlePresetSelect = (min: string, max: string) => {
    setMinPriceInput(min);
    setMaxPriceInput(max);
  };

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
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
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
          {/* Top Grab Handle */}
          <View style={styles.handleBar} />

          {/* Sheet Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <Icon name="filter" size={18} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Filter Medical Devices</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Icon name="close" size={18} color={colors.textSecondary || colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Price Range Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Price Range (KSh)
              </Text>

              {/* Custom Min / Max Inputs */}
              <View style={styles.priceInputRow}>
                <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.currencyLabel, { color: colors.textSecondary || colors.text }]}>Min</Text>
                  <TextInput
                    style={[styles.numericInput, { color: colors.text }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textDisabled}
                    value={minPriceInput}
                    onChangeText={setMinPriceInput}
                  />
                </View>

                <View style={styles.priceDash}>
                  <Text style={{ color: colors.textSecondary || colors.text, fontWeight: "600" }}>—</Text>
                </View>

                <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.currencyLabel, { color: colors.textSecondary || colors.text }]}>Max</Text>
                  <TextInput
                    style={[styles.numericInput, { color: colors.text }]}
                    keyboardType="numeric"
                    placeholder="250,000"
                    placeholderTextColor={colors.textDisabled}
                    value={maxPriceInput}
                    onChangeText={setMaxPriceInput}
                  />
                </View>
              </View>

              {/* Quick Presets */}
              <View style={styles.presetChipsRow}>
                {PRICE_PRESETS.map((preset, idx) => {
                  const isSelected =
                    minPriceInput === preset.min && maxPriceInput === preset.max;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isSelected ? colors.primary + "16" : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handlePresetSelect(preset.min, preset.max)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Special Deals / On-Sale Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Promotions & Discounts
              </Text>

              <TouchableOpacity
                style={[
                  styles.saleToggleRow,
                  {
                    backgroundColor: isOnSale ? colors.primary + "10" : colors.background,
                    borderColor: isOnSale ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setIsOnSale(!isOnSale)}
                activeOpacity={0.7}
              >
                <View style={styles.saleToggleLeft}>
                  <View style={[styles.saleIconBox, { backgroundColor: colors.primary + "18" }]}>
                    <Icon name="sparkles" size={18} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.saleToggleTitle, { color: colors.text }]}>
                      On Sale & Discounted
                    </Text>
                    <Text style={[styles.saleToggleSubtitle, { color: colors.textSecondary || colors.text }]}>
                      Show only medical items with active deals
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.checkboxBox,
                    {
                      borderColor: isOnSale ? colors.primary : colors.border,
                      backgroundColor: isOnSale ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {isOnSale && <Icon name="badge-check" size={14} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Action Footer */}
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
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

export default FilterSheet;

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
      maxHeight: "85%",
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
      marginBottom: 10,
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
    scrollBody: {
      paddingVertical: 8,
    },
    section: {
      marginBottom: 22,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 10,
      opacity: 0.8,
    },
    priceInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    inputBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: SIZES.radius_medium,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    currencyLabel: {
      fontSize: 12,
      fontWeight: "600",
      marginRight: 8,
      opacity: 0.7,
    },
    numericInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      padding: 0,
    },
    priceDash: {
      paddingHorizontal: 2,
    },
    presetChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    presetChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
    },
    presetChipText: {
      fontSize: 12,
    },
    saleToggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1.5,
      borderRadius: SIZES.radius_medium,
      padding: 12,
    },
    saleToggleLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    saleIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    saleToggleTitle: {
      fontSize: 14,
      fontWeight: "600",
    },
    saleToggleSubtitle: {
      fontSize: 11,
      opacity: 0.7,
      marginTop: 2,
    },
    checkboxBox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
    footerRow: {
      flexDirection: "row",
      gap: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
