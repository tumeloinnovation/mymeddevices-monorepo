import { useNavigation } from "expo-router";
import { ScrollView, StyleSheet, View, Text } from "react-native";
import React, { useCallback, useEffect, useState } from "react";

import { Image } from "expo-image";
import { Colors } from "@/types/app";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWishlistStore } from "@/features/wishlist/stores/useWishlistStore";
import EmptyState from "@/components/common/EmptyState";
import ColumnContainer from "@/components/layout/ColumnContainer";
import RowContainer from "@/components/layout/RowContainer";
import { SIZES } from "@/styles/sizes";
import ProductItem from "@/features/product/components/organisms/ProductItem";

const Page = () => {
  const navigation = useNavigation();

  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: "My Wishlist",
      headerBackTitle: "Back",
    });
  }, []);

  const wishlist_products = useWishlistStore((state) => state.wishlist_list);

  const [data] = useState(wishlist_products);
  const [filteredData, setFilteredData] = useState(wishlist_products);

  // const handleSearch = useCallback((text: string) => {
  //   if (text) {
  //     const newData = data.filter((item) =>
  //       item.name.toLowerCase().includes(text.toLowerCase())
  //     );
  //     setFilteredData(newData);
  //   } else {
  //     setFilteredData(data);
  //   }
  // }, []);

  //   useEffect(() => {
  //     navigation.setOptions({
  //       header: () => (
  //         <LocalSearchHeader
  //           onSearch={handleSearch}
  //           placeholder="Search wishlist"
  //           layout
  //         />
  //       ),
  //     });
  //   }, [navigation]);

  if (!wishlist_products.length) {
    return (
      <EmptyState
        title="Your Wishlist is Empty"
        desc="Start saving your favorite items here! Browse through our collection and add items to your wishlist for easy access later."
        buttonText="Explore Products"
        image={require("@/assets/illustrations/wishlist.svg")}
      />
    );
  }

  if (!filteredData.length) {
    return (
      <View style={styles.emptyState}>
        <Image
          source={require("@/assets/illustrations/empty_search.svg")}
          style={{
            height: 250,
            width: 250,
            marginVertical: SIZES.paddingMD,
          }}
          contentFit="contain"
        />
        <Text style={styles.emptyStateText}>No results found</Text>
        <Text style={styles.emptyStateSubText}>
          Looking for something specific? Enter keywords in the search bar to
          find products you love.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <RowContainer>
        {filteredData.map((data, index) => (
          <ColumnContainer width={"50%"} key={`grid-${index}`}>
            <ProductItem data={data} />
          </ColumnContainer>
        ))}
      </RowContainer>
    </ScrollView>
  );
};

export default Page;

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    contentContainer: {
      flexGrow: 1,
      paddingTop: 10,
      paddingHorizontal: SIZES.paddingMD,
      paddingBottom: Math.max(bottomInset, 16) + 24,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      height: 600,
    },
    emptyStateText: {
      fontSize: 20,
      marginTop: 5,
      fontWeight: "700",
      color: colors.text,
    },
    emptyStateSubText: {
      fontWeight: "500",
      fontSize: 16,
      marginVertical: 15,
      textAlign: "center",
      width: "70%",
      color: colors.text,
    },
  });
