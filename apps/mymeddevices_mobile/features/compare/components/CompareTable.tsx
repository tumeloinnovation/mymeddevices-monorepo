import React, { ReactNode } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Product } from "@/types/product";
import { Colors } from "@/types/app";
import CustomButton from "@/components/common/CustomButton";
import CompareRow from "./CompareRow";
import CompareProductHead from "./CompareProductHead";
import CartButton from "@/features/product/components/atoms/CartButton";
import CustomText from "@/components/common/CustomText";
import Icon from "@/components/common/Icon";

interface CompareTableProps {
  product1?: Product;
  product2?: Product;
  colors: Colors;
  imageSize: number;
  onRemove: (product: Product) => void;
  onAddBoth: () => void;
  renderPrice: (product: Product, isBest: boolean) => ReactNode;
  renderStars: (rating: number) => ReactNode;
  renderStock: (status: string, quantity: number | null) => ReactNode;
  renderDescription: (product: Product) => ReactNode;
  renderText: (text: string) => ReactNode;
  renderAddSlot: () => ReactNode;
  diffs: {
    hasBoth: boolean;
    priceDiffer: boolean;
    ratingDiffer: boolean;
    availDiffer: boolean;
    brandDiffer: boolean;
    modelDiffer: boolean;
    skuDiffer: boolean;
    catDiffer: boolean;
    descDiffer: boolean;
    cheaper: number;
    higherRated: number;
    bestValue: number;
    brand1: string;
    brand2: string;
    model1: string;
    model2: string;
    sku1: string;
    sku2: string;
    cat1: string;
    cat2: string;
    rating1: number;
    rating2: number;
  };
}

const MissingCell: React.FC<{ textColor: string; style?: object }> = ({
  textColor,
  style,
}) => (
  <CustomText style={[style, { color: textColor }]}>
    —
  </CustomText>
);

export const CompareTable: React.FC<CompareTableProps> = ({
  product1,
  product2,
  colors,
  imageSize,
  onRemove,
  onAddBoth,
  renderPrice,
  renderStars,
  renderStock,
  renderDescription,
  renderText,
  renderAddSlot,
  diffs,
}) => {
  const styles = createStyles(colors);

  const addBothLabel =
    product1 && product2 ? "Add Both to Cart" : "Add to Cart";

  const renderMissing = () => (
    <MissingCell textColor={colors.textSecondary} style={styles.cellText} />
  );

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      stickyHeaderIndices={[0]}
    >
      <CompareRow
        colors={colors}
        label=""
        left={
          product1 ? (
            <CompareProductHead
              product={product1}
              imageSize={imageSize}
              colors={colors}
              onRemove={onRemove}
              bestBadgeLabel={
                diffs.hasBoth && diffs.bestValue === 0
                  ? "Best Value"
                  : undefined
              }
            />
          ) : (
            renderAddSlot()
          )
        }
        right={
          product2 ? (
            <CompareProductHead
              product={product2}
              imageSize={imageSize}
              colors={colors}
              onRemove={onRemove}
              bestBadgeLabel={
                diffs.hasBoth && diffs.bestValue === 1
                  ? "Best Value"
                  : undefined
              }
            />
          ) : (
            renderAddSlot()
          )
        }
      />

      <CompareRow
        colors={colors}
        label="Price"
        left={
          product1 ? (
            renderPrice(product1, diffs.hasBoth && diffs.cheaper === 0)
          ) : (
            renderMissing()
          )
        }
        right={
          product2 ? (
            renderPrice(product2, diffs.hasBoth && diffs.cheaper === 1)
          ) : (
            renderMissing()
          )
        }
      />

      <CompareRow
        colors={colors}
        label="Rating"
        left={
          product1 ? (
            <View style={styles.ratingWrap}>
              {renderStars(diffs.rating1)}
              <CustomText
                variant="caption"
                style={[
                  styles.ratingValue,
                  diffs.hasBoth &&
                    diffs.higherRated === 0 && { color: colors.success },
                ]}
              >
                {diffs.rating1 || "—"}
              </CustomText>
            </View>
          ) : (
            renderMissing()
          )
        }
        right={
          product2 ? (
            <View style={styles.ratingWrap}>
              {renderStars(diffs.rating2)}
              <CustomText
                variant="caption"
                style={[
                  styles.ratingValue,
                  diffs.hasBoth &&
                    diffs.higherRated === 1 && { color: colors.success },
                ]}
              >
                {diffs.rating2 || "—"}
              </CustomText>
            </View>
          ) : (
            renderMissing()
          )
        }
      />

      <CompareRow
        colors={colors}
        label="Availability"
        left={
          product1 ? (
            renderStock(
              product1.stock_status,
              product1.stock_quantity ?? null
            )
          ) : (
            renderMissing()
          )
        }
        right={
          product2 ? (
            renderStock(
              product2.stock_status,
              product2.stock_quantity ?? null
            )
          ) : (
            renderMissing()
          )
        }
      />

      <CompareRow
        colors={colors}
        label="Brand"
        left={renderText(diffs.brand1)}
        right={renderText(diffs.brand2)}
      />

      <CompareRow
        colors={colors}
        label="Model"
        left={renderText(diffs.model1)}
        right={renderText(diffs.model2)}
      />

      <CompareRow
        colors={colors}
        label="SKU"
        left={renderText(diffs.sku1)}
        right={renderText(diffs.sku2)}
      />

      <CompareRow
        colors={colors}
        label="Categories"
        left={renderText(diffs.cat1)}
        right={renderText(diffs.cat2)}
      />

      <CompareRow
        colors={colors}
        label="Description"
        left={product1 ? renderDescription(product1) : renderMissing()}
        right={product2 ? renderDescription(product2) : renderMissing()}
      />

      <CompareRow
        colors={colors}
        label=""
        left={product1 ? <CartButton item={product1} /> : renderMissing()}
        right={product2 ? <CartButton item={product2} /> : renderMissing()}
      />

      <View style={styles.footer}>
        <CustomButton
          title={addBothLabel}
          size="large"
          onPress={onAddBoth}
        />
      </View>
    </ScrollView>
  );
};

export default CompareTable;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    content: {
      paddingBottom: 24,
    },
    cellText: {
      fontSize: 13,
      lineHeight: 18,
    },
    ratingWrap: {
      flexDirection: "row",
      alignItems: "center",
    },
    ratingValue: {
      marginLeft: 6,
      fontWeight: "600",
      color: colors.text,
    },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
  });
