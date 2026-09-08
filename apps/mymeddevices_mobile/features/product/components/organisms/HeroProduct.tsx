import React, { useCallback, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  Dimensions,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";

import { productApi } from "../../services/product.api";
import { queryKeys, CACHE_TIMES } from "@/services/queryKeys";
import LoadingIndicator from "@/components/common/LoadingIndicator";
import { Colors } from "@/types/app";
import { Product } from "@/types/product";
import { useQuery } from "@tanstack/react-query";
import CategoryNames from "../atoms/CategoryNames";
import CompareButton from "../atoms/CompareButton";
import LikeButton from "../atoms/LikeButton";
import ProductName from "../atoms/ProductName";
import InCartButton from "../molecules/InCartButton";
import SalePrice from "../molecules/SalePrice";
import { router } from "expo-router";
import { useProductStore } from "../../stores/useProductStore";
import { ProductQueryParams } from "@/types/api";

const { width: screenWidth } = Dimensions.get("window");
const VIEWABILITY_CONFIG = {
  viewAreaCoveragePercentThreshold: 50,
};
const ItemSeparator = () => <View style={{ width: 20 }} />;

const HeroProduct: React.FC = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { setProduct } = useProductStore();
  const flatListRef = useRef<FlatList>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const params: ProductQueryParams = {
    per_page: 10,
    orderby: "popularity",
    order: "asc",
  };
  const { isLoading, isError, data, error, isSuccess } = useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productApi.getProducts(params),
    ...CACHE_TIMES.SEMI_STATIC,
  });

  const loopedData = isSuccess ? [...data, ...data.slice(0, 1)] : [];

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index % (data?.length || 1);
        setCurrentIndex(newIndex);
      }
    },
    [data?.length]
  );

  React.useEffect(() => {
    if (loopedData.length <= 1) return;

    const autoplayInterval = setInterval(() => {
      if (flatListRef.current) {
        const nextIndex = (currentIndex + 1) % loopedData.length;
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
    }, 3000);

    return () => clearInterval(autoplayInterval);
  }, [currentIndex, loopedData.length]);

  const handleNavigation = useCallback((product: Product) => {
    setProduct(product);
    router.push({
      pathname: "/product-view",
      params: { id: product?.id },
    });
  }, [setProduct]);
  const itemWidth = screenWidth - 40; // 20 on each side
  const itemSpacing = 20;
  const renderItem = useCallback(
    ({ item: product, index }: { item: Product; index: number }) => (
      <TouchableOpacity
        key={`${product.id}-${index}`}
        style={[styles.container, { width: itemWidth }]}
        onPress={() => handleNavigation(product)}
      >
        <View style={styles.row}>
          <CategoryNames categories={product.categories} />
          <View style={styles.iconContainer}>
            <CompareButton item={product} />
            <LikeButton item={product} />
          </View>
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <ProductName product={product.name} size="large" />
            <SalePrice product={product} />
            <InCartButton product={product} />
          </View>
          <View style={styles.imageContainer}>
            <Image
              style={styles.image}
              source={product.images[0]?.src}
              // placeholder={require("@/assets/images/placeholder.png")}
              contentFit="cover"
              transition={1000}
            />
          </View>
        </View>
      </TouchableOpacity>
    ),
    [styles, handleNavigation, itemWidth]
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { height: 250 }]}>
        <LoadingIndicator text="Products" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { height: 250 }]}>
        <Text> {error.message} </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={loopedData}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      snapToAlignment="center"
      snapToInterval={itemWidth + itemSpacing}
      contentContainerStyle={{ paddingHorizontal: itemSpacing / 2 }}
      decelerationRate="fast"
      ItemSeparatorComponent={ItemSeparator}
      onMomentumScrollEnd={(event) => {
        const newIndex = Math.round(
          event.nativeEvent.contentOffset.x / (itemWidth + itemSpacing)
        );
        setCurrentIndex(newIndex);
      }}
      // @ts-ignore
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={VIEWABILITY_CONFIG}
    />
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    carouselContainer: {
      height: 250,
    },
    container: {
      padding: 15,
      borderWidth: 1,
      borderRadius: 15,
      borderColor: colors.textDisabled,
      backgroundColor: colors.card,
      // justifyContent: "space-evenly",
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    iconContainer: {
      flexDirection: "row",
      width: "25%",
      justifyContent: "space-around",
    },
    contentContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    textContainer: {
      flex: 1,
      justifyContent: "space-between",
    },
    imageContainer: {
      width: "45%",
      aspectRatio: 1,
      borderRadius: 10,
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    paginationContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 10,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textDisabled,
      marginHorizontal: 4,
    },
    paginationDotActive: {
      backgroundColor: colors.primary,
      width: 12,
      height: 12,
      borderRadius: 6,
    },
  });

export default HeroProduct;
