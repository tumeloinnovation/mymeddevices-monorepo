import { FlatList, StyleSheet, Text, View } from "react-native";
import React, { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "../../services/product.api";
import { queryKeys, CACHE_TIMES } from "@/services/queryKeys";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import { useTheme } from "@react-navigation/native";
import LoadingIndicator from "@/components/common/LoadingIndicator";
import { Product } from "@/types/product";
import ProductItem from "./ProductItem";

const OnSaleProducts = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const { isPending, data, error, isError, isSuccess } = useQuery({
    queryKey: queryKeys.products.onSale(),
    queryFn: productApi.getOnSaleProducts,
    ...CACHE_TIMES.SEMI_STATIC,
  });
  const itemWidth = 160;
  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      return (
        <View style={{ width: itemWidth }} key={`${item.id}-${index}`}>
          <ProductItem data={item} />
        </View>
      );
    },
    []
  );

  if (!isSuccess || !data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Essential Medical Savings
        </Text>
        <Text style={styles.subtitle}>
          Limited time deals & discounts on verified devices
        </Text>
      </View>
      <FlatList
        data={data}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        keyExtractor={(item, index) => `${item.id}-${index}`}
      />
    </View>
  );
};

export default OnSaleProducts;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      paddingTop: SIZES.paddingSM,
      marginBottom: SIZES.paddingMD,
    },
    header: {
      marginBottom: 6,
    },
    title: {
      fontWeight: "bold",
      fontSize: 18,
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      marginTop: 2,
    },
  });
