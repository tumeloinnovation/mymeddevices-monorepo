import { Animated, DimensionValue, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { Product } from "@/types/product";
import { Colors } from "@/types/app";
import { SIZES } from "@/styles/sizes";
import Icon from "@/components/common/Icon";
import ProductName from "../atoms/ProductName";
import SalePrice from "../molecules/SalePrice";
import CategoryNames from "../atoms/CategoryNames";
import { useProductStore } from "../../stores/useProductStore";
import useCompareStore from "@/features/compare/stores/useCompareStore";
import { useCompareToggle } from "@/features/compare/hooks/useCompareToggle";

export const RELATED_CARD_GAP = SIZES.spacingMD;
export const RELATED_CARD_WIDTH =
  (SIZES.width - SIZES.paddingMD * 2 - RELATED_CARD_GAP) / 2;

const CARD_HEIGHT = 280;

interface Props {
  data: Product;
  width?: number;
}

const RelatedProductCard: React.FC<Props> = ({ data, width = RELATED_CARD_WIDTH }) => {
  const { colors } = useTheme();
  const { setProduct } = useProductStore();
  const { toggle, isSelected } = useCompareToggle(data);
  const styles = createStyles(colors, width);

  const selected = isSelected;

  const handlePress = () => {
    setProduct(data);
    router.push({ pathname: "/product-view", params: { id: data.id } });
  };

  const handleToggle = () => {
    const before = useCompareStore.getState().compare_list.length;
    const result = toggle(data);

    if (result !== "added") return;

    if (before === 1) {
      router.navigate("/compare");
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.container}>
      <CategoryNames categories={data?.categories} />
      <Image
        style={styles.image}
        source={data?.images[0]?.src}
        contentFit="contain"
        placeholder={require("@/assets/images/placeholder.png")}
      />
      <View style={styles.body}>
        <ProductName product={data?.name} size="small" />
        <SalePrice product={data} size="sm" />
      </View>
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.85}
        style={[styles.addButton, selected && styles.addButtonSelected]}
      >
        <Icon
          name={selected ? "badge-check" : "plus"}
          size={16}
          color={selected ? colors.card : colors.primary}
        />
        <Text style={[styles.addButtonText, selected && styles.addButtonTextSelected]}>
          {selected ? "Added" : "Add to compare"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default RelatedProductCard;

/* ------------------------------- Skeleton -------------------------------- */

const SkeletonBlock: React.FC<{
  width: DimensionValue;
  height: number;
  style?: object;
}> = ({ width, height, style }) => {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ width, height, opacity }, style]} />;
};

export const RelatedProductCardSkeleton: React.FC<{ width?: number }> = ({
  width = RELATED_CARD_WIDTH,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors, width);
  const sk = { backgroundColor: colors.border };

  return (
    <View style={styles.container}>
      <SkeletonBlock width="50%" height={12} style={sk} />
      <SkeletonBlock width="100%" height={100} style={{ ...sk, borderRadius: 12, marginTop: 8 }} />
      <View style={styles.body}>
        <SkeletonBlock width="100%" height={14} style={sk} />
        <SkeletonBlock width="70%" height={14} style={sk} />
        <SkeletonBlock width="60%" height={16} style={sk} />
      </View>
      <SkeletonBlock width="100%" height={40} style={{ ...sk, borderRadius: 20, marginTop: 8 }} />
    </View>
  );
};

/* ------------------------------- Styles ---------------------------------- */

const createStyles = (colors: Colors, width: number) =>
  StyleSheet.create({
    container: {
      width,
      height: CARD_HEIGHT,
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 4.65,
      elevation: 6,
    },
    image: {
      width: "100%",
      height: 100,
      borderRadius: 12,
      backgroundColor: "#fff",
      marginVertical: 8,
    },
    body: {
      flex: 1,
      gap: 4,
    },
    addButton: {
      marginTop: 8,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.card,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
    },
    addButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    addButtonText: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: 13,
    },
    addButtonTextSelected: {
      color: colors.card,
    },
  });
