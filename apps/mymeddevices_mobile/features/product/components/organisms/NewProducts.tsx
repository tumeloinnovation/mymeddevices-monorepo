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

const NewProducts = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const { isPending, data, error, isError, isSuccess } = useQuery({
    queryKey: queryKeys.products.newest(),
    queryFn: productApi.getNewestProducts,
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

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Discover New Arrivals</Text>
        <Text style={styles.subtitle}>
          Check out the latest additions to our collection. Stay ahead with the
          newest trends and best products.
        </Text>
      </View>
      {isPending && <LoadingIndicator text="Products" />}
      {isError && <Text>{error.message}</Text>}
      {isSuccess && (
        <FlatList
          data={data}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item.id}-${index}`}
        />
      )}
    </View>
  );
};

export default NewProducts;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      paddingTop: SIZES.paddingMD,
    },
    title: {
      fontWeight: "bold",
      fontSize: 20,
      color: colors.text,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: "semibold",
      color: colors.text,
      paddingBottom: SIZES.paddingMD,
    },
  });
