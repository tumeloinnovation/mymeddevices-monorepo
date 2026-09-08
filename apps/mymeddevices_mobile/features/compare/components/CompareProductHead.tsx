import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import Icon from "@/components/common/Icon";
import CustomText from "@/components/common/CustomText";
import { Product } from "@/types/product";
import { Colors } from "@/types/app";

interface CompareProductHeadProps {
  product: Product;
  imageSize: number;
  colors: Colors;
  onRemove: (product: Product) => void;
  bestBadgeLabel?: string;
}

export const CompareProductHead: React.FC<CompareProductHeadProps> = ({
  product,
  imageSize,
  colors,
  onRemove,
  bestBadgeLabel,
}) => {
  const styles = createStyles(colors);
  const src = product?.images?.[0]?.src;

  return (
    <View style={styles.headProduct}>
      <Pressable
        style={styles.removeBtn}
        onPress={() => onRemove(product)}
        hitSlop={6}
        accessibilityLabel={`Remove ${product.name} from comparison`}
      >
        <Icon
          name="close"
          size={20}
          color={colors.textDisabled}
        />
      </Pressable>
      {src ? (
        <Image
          source={{ uri: src }}
          style={[styles.productImage, { width: imageSize, height: imageSize }]}
          resizeMode="contain"
        />
      ) : (
        <View
          style={[
            styles.imagePlaceholder,
            { width: imageSize, height: imageSize },
          ]}
        >
          <Icon
            name="image-off"
            size={40}
            color={colors.textDisabled}
          />
        </View>
      )}
      <CustomText
        variant="caption"
        style={styles.productName}
        numberOfLines={2}
      >
        {product.name}
      </CustomText>
      {bestBadgeLabel && (
        <View style={[styles.bestBadge, { backgroundColor: colors.success }]}>
          <Icon name="award" size={12} color="#ffffff" />
          <CustomText style={styles.bestBadgeText}>
            {bestBadgeLabel}
          </CustomText>
        </View>
      )}
    </View>
  );
};

export default CompareProductHead;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    headProduct: {
      alignItems: "center",
      position: "relative",
      width: "100%",
    },
    removeBtn: {
      position: "absolute",
      top: -6,
      right: -2,
      zIndex: 1,
    },
    productImage: {
      borderRadius: 8,
    },
    imagePlaceholder: {
      borderRadius: 8,
      backgroundColor: colors.border + "40",
      alignItems: "center",
      justifyContent: "center",
    },
    productName: {
      fontSize: 13,
      fontWeight: "bold",
      textAlign: "center",
      color: colors.text,
      marginTop: 8,
    },
    bestBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    bestBadgeText: {
      color: "#ffffff",
      fontSize: 11,
      fontWeight: "700",
      marginLeft: 4,
    },
  });
