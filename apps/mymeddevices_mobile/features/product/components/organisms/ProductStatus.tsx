import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useTheme } from "@react-navigation/native";
import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";
import { Product } from "@/types/product";

interface props {
  data: Product | null;
}

const ProductStatus: React.FC<props> = ({ data }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const ratingNum = parseFloat(data?.average_rating || "0");
  const isRated = ratingNum > 0;

  return (
    <View style={styles.container}>
      <View style={styles.ratings}>
        <Icon name="star-filled" size={14} color={isRated ? "gold" : colors.border} />
        <Text style={{ marginLeft: 5, color: colors.text, fontWeight: "bold" }}>
          {isRated ? `${ratingNum.toFixed(1)} (${data?.rating_count || 0})` : "Unrated"}
        </Text>
      </View>
      <Text
        style={{
          color:
            data?.stock_status === "instock" ? colors.success : colors.text,
          fontWeight: "bold",
        }}
      >
        {data?.stock_status ? data.stock_status.toUpperCase() : "IN STOCK"}
      </Text>
      <Text style={styles.text}>
        {data?.stock_quantity !== undefined && data.stock_quantity !== null
          ? `Qty: ${data.stock_quantity}`
          : "Available"}
      </Text>
    </View>
  );
};

export default ProductStatus;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      justifyContent: "space-between",
      flexDirection: "row",
      marginVertical: 10,
    },
    ratings: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    text: {
      color: colors.text,
      fontWeight: "bold",
    },
  });
