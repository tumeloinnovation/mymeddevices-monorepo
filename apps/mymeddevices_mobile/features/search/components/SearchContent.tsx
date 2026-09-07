import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Icon, { IconName } from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { Product } from "@/types/product";
import useSearchHistoryStore from "@/features/search/stores/useSearchStore";
import { SIZES } from "@/styles/sizes";
import ProductItem from "@/features/product/components/organisms/ProductItem";
import { useDebounce } from "@/features/search/hooks/useDebounce";
import { useProductSearch } from "@/features/search/services/mutation.service";
import { ProductGridSkeleton } from "@/components/common/EmptyState";

const TRENDING_KEYWORDS: { label: string; icon: IconName }[] = [
  { label: "Blood Pressure Monitor", icon: "gauge" },
  { label: "Pulse Oximeter", icon: "heart-pulse" },
  { label: "Nebulizer Machine", icon: "wind" },
  { label: "Glucometer Strips", icon: "test-tube" },
  { label: "Wheelchairs", icon: "accessibility" },
  { label: "Digital Thermometer", icon: "thermometer" },
  { label: "Hospital Beds", icon: "bed" },
  { label: "First Aid Kit", icon: "shield-check" },
];

const POPULAR_SPECIALTIES = [
  { name: "Diagnostics", icon: "stethoscope" as const, color: "#2563EB" },
  { name: "Respiratory", icon: "wind" as const, color: "#059669" },
  { name: "Mobility", icon: "accessibility" as const, color: "#D97706" },
  { name: "Home Care", icon: "bed" as const, color: "#7C3AED" },
];

interface SearchContentProps {
  onClose?: () => void;
  autoFocus?: boolean;
}

const SearchContent: React.FC<SearchContentProps> = ({
  onClose,
  autoFocus = true,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);

  const {
    addSearchTerm,
    removeSearchTerm,
    clearSearchHistory,
    loadSearchHistory,
    getRecentSearches,
  } = useSearchHistoryStore();

  const searchMutation = useProductSearch();

  useEffect(() => {
    loadSearchHistory();
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim() !== "") {
      searchMutation.mutate(debouncedQuery);
      addSearchTerm(debouncedQuery.trim());
    }
  }, [debouncedQuery]);

  const handleSelectKeyword = (keyword: string) => {
    setQuery(keyword);
    inputRef.current?.focus();
  };

  const handleClearInput = useCallback(() => {
    setQuery("");
    searchMutation.reset();
    Keyboard.dismiss();
  }, [searchMutation]);

  const recentSearches = getRecentSearches(8);

  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.gridItem} key={item.id}>
        <ProductItem data={item} />
      </View>
    ),
    [styles.gridItem]
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 12) },
      ]}
    >
      {/* Top Search Header Bar */}
      <View style={styles.topBar}>
        {onClose && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Icon name="chevron-left" color={colors.text} size={24} />
          </TouchableOpacity>
        )}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="search" color={colors.primary} size={18} />
          <TextInput
            ref={inputRef}
            value={query}
            style={[styles.searchInput, { color: colors.text }]}
            onChangeText={setQuery}
            placeholder="Search blood pressure, nebulizers, wheelchairs..."
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoFocus={autoFocus}
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <TouchableOpacity
              style={styles.clearIconBtn}
              onPress={handleClearInput}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" color={colors.textSecondary || colors.text} size={16} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Body Views */}
      {searchMutation.isPending ? (
        <ProductGridSkeleton count={6} />
      ) : query.trim() !== "" && searchMutation.data ? (
        /* Results Mode */
        <FlatList
          data={searchMutation.data}
          renderItem={renderProductItem}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsGrid}
          ListHeaderComponent={
            searchMutation.data.length > 0 ? (
              <View style={styles.resultsCountHeader}>
                <Text style={[styles.resultsCountText, { color: colors.textSecondary || colors.text }]}>
                  Found {searchMutation.data.length} {searchMutation.data.length === 1 ? "device" : "devices"} for "{query}"
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + "12" }]}>
                <Icon name="search" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Matches Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary || colors.text }]}>
                We couldn't find any medical devices matching "{query}". Check spelling or try browsing popular categories.
              </Text>

              {/* Suggestions */}
              <View style={styles.emptySuggestionsBox}>
                <Text style={styles.suggestionsTitle}>Suggested Searches:</Text>
                <View style={styles.suggestChipsRow}>
                  {TRENDING_KEYWORDS.slice(0, 4).map((kw, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.suggestChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => handleSelectKeyword(kw.label)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.suggestChipText, { color: colors.primary }]}>{kw.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          }
        />
      ) : (
        /* Default / Idle Mode: Recent Searches + Trending Hub */
        <ScrollView
          style={styles.idleScroll}
          contentContainerStyle={styles.idleContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Icon name="repeat" size={16} color={colors.primary} />
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>Recent Searches</Text>
                </View>
                <TouchableOpacity onPress={clearSearchHistory} activeOpacity={0.7}>
                  <Text style={[styles.clearAllText, { color: colors.primary }]}>Clear All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chipsWrap}>
                {recentSearches.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.recentChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <TouchableOpacity
                      style={styles.chipTextWrapper}
                      onPress={() => handleSelectKeyword(item.term)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipLabel, { color: colors.text }]} numberOfLines={1}>
                        {item.term}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.chipDeleteBtn}
                      onPress={() => removeSearchTerm(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="close" size={12} color={colors.textSecondary || colors.text} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 2. Trending Medical Devices */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Icon name="sparkles" size={16} color="#F59E0B" />
                <Text style={[styles.sectionHeading, { color: colors.text }]}>Trending Searches</Text>
              </View>
            </View>

            <View style={styles.trendingGrid}>
              {TRENDING_KEYWORDS.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.trendingTile, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleSelectKeyword(item.label)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.trendingIconBox, { backgroundColor: colors.primary + "12" }]}>
                    <Icon name={item.icon} size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.trendingLabel, { color: colors.text }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 3. Browse By Specialty Grid */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Icon name="check-list" size={16} color="#10B981" />
                <Text style={[styles.sectionHeading, { color: colors.text }]}>Browse Specialties</Text>
              </View>
            </View>

            <View style={styles.specialtiesRow}>
              {POPULAR_SPECIALTIES.map((spec, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.specialtyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    onClose?.();
                    router.push("/(shop)/category");
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.specialtyIconBox, { backgroundColor: spec.color + "16" }]}>
                    <Icon name={spec.icon} size={20} color={spec.color} />
                  </View>
                  <Text style={[styles.specialtyName, { color: colors.text }]}>{spec.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default SearchContent;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SIZES.spacingMD,
      paddingBottom: 12,
      gap: 10,
    },
    backButton: {
      padding: 4,
    },
    searchBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      paddingHorizontal: 12,
      height: 44,
      gap: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      paddingVertical: 0,
    },
    clearIconBtn: {
      padding: 4,
    },
    resultsGrid: {
      paddingHorizontal: 6,
      paddingBottom: 40,
    },
    gridItem: {
      width: "50%",
    },
    resultsCountHeader: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    resultsCountText: {
      fontSize: 12,
      fontWeight: "600",
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
      paddingVertical: 50,
    },
    emptyIconCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 19,
      fontWeight: "700",
      marginBottom: 6,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
      opacity: 0.75,
      marginBottom: 24,
    },
    emptySuggestionsBox: {
      width: "100%",
      alignItems: "center",
    },
    suggestionsTitle: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginBottom: 10,
    },
    suggestChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 8,
    },
    suggestChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
    },
    suggestChipText: {
      fontSize: 12,
      fontWeight: "600",
    },
    idleScroll: {
      flex: 1,
    },
    idleContent: {
      paddingHorizontal: SIZES.spacingMD,
      paddingBottom: 40,
      gap: 22,
    },
    sectionBlock: {
      gap: 12,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionHeading: {
      fontSize: 14,
      fontWeight: "700",
    },
    clearAllText: {
      fontSize: 12,
      fontWeight: "600",
    },
    chipsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    recentChip: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 20,
      borderWidth: 1,
      paddingVertical: 6,
      paddingLeft: 12,
      paddingRight: 8,
      gap: 6,
    },
    chipTextWrapper: {
      maxWidth: 160,
    },
    chipLabel: {
      fontSize: 12,
      fontWeight: "500",
    },
    chipDeleteBtn: {
      padding: 2,
    },
    trendingGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    trendingTile: {
      width: "48.5%",
      flexDirection: "row",
      alignItems: "center",
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      padding: 10,
      gap: 8,
    },
    trendingIconBox: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    trendingLabel: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
    },
    specialtiesRow: {
      flexDirection: "row",
      gap: 10,
    },
    specialtyCard: {
      flex: 1,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: "center",
      gap: 8,
    },
    specialtyIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    specialtyName: {
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
    },
  });
