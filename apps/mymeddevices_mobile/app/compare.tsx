import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Share,
  useWindowDimensions,
} from "react-native";
import { toast } from "sonner-native";
import useCompareStore from "@/features/compare/stores/useCompareStore";
import { Product } from "@/types/product";
import CustomText from "@/components/common/CustomText";
import { router, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/components/common/Icon";
import { useTheme } from "@react-navigation/native";
import EmptyState from "@/components/common/EmptyState";
import RenderHTML from "react-native-render-html";
import useAppStore from "@/stores/useAppStore";
import useCartStore from "@/features/cart/stores/useCartStore";
import CompareHeader from "@/features/compare/components/CompareHeader";
import CompareTable from "@/features/compare/components/CompareTable";
import { Colors } from "@/types/app";
import { getProductAttribute } from "@/utils/product";

const LABEL_WIDTH = 100;

const ProductComparison = () => {
  const { compare_list, removeFromCompare } = useCompareStore();
  const addToCart = useCartStore((state) => state.addToCart);
  const product1 = compare_list[0];
  const product2 = compare_list[1];
  const closeRelatedProducts = useAppStore((s) => s.closeRelatedProducts);
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  const handleClearAll = () => {
    closeRelatedProducts();
    useCompareStore.getState().clearCompare();
  };

  const handleShare = async () => {
    if (compare_list.length === 0) return;
    const header = compare_list.map((p) => p.name).join("  vs  ");
    const lines = [header, ""];
    compare_list.forEach((p, i) => {
      const price = Number(p.price);
      const regular = Number(p.regular_price);
      lines.push(`Product ${i + 1}: ${p.name}`);
      lines.push(
        `Price: Ksh.${price.toLocaleString()}` +
          (p.on_sale && regular > price
            ? ` (was Ksh.${regular.toLocaleString()})`
            : "")
      );
      lines.push(`Rating: ${p.average_rating}/5`);
      lines.push(
        `Availability: ${
          p.stock_status === "instock" ? "In Stock" : "Out of Stock"
        }`
      );
      if (p.sku) lines.push(`SKU: ${p.sku}`);
      const brand = getProductAttribute(p, "Brand");
      if (brand) lines.push(`Brand: ${brand}`);
      const model = getProductAttribute(p, "Model");
      if (model) lines.push(`Model: ${model}`);
      lines.push("");
    });
    try {
      await Share.share({
        message: lines.join("\n"),
        title: "Product Comparison",
      });
    } catch {
      toast.error("Unable to share comparison");
    }
  };

  const handleAddBoth = () => {
    const added: string[] = [];
    if (product1 && product1.stock_status === "instock") {
      addToCart(product1);
      added.push(product1.name);
    }
    if (product2 && product2.stock_status === "instock") {
      addToCart(product2);
      added.push(product2.name);
    }
    if (added.length) {
      toast.success(`Added ${added.length} item${added.length > 1 ? "s" : ""} to cart`);
    } else {
      toast.error("Selected items are out of stock");
    }
  };

  React.useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const price1 = Number(product1?.price);
  const price2 = Number(product2?.price);
  const rating1 = Number(product1?.average_rating);
  const rating2 = Number(product2?.average_rating);
  const cheaper = price1 < price2 ? 0 : price2 < price1 ? 1 : -1;
  const higherRated = rating1 > rating2 ? 0 : rating2 > rating1 ? 1 : -1;

  const score1 = rating1 / (price1 || 1);
  const score2 = rating2 / (price2 || 1);
  const bestValue = score1 > score2 ? 0 : score2 > score1 ? 1 : -1;

  const cat1 = product1?.categories.map((c) => c?.name).join(", ") ?? "";
  const cat2 = product2?.categories.map((c) => c?.name).join(", ") ?? "";
  const desc1 = product1?.short_description ?? "";
  const desc2 = product2?.short_description ?? "";
  const brand1 = getProductAttribute(product1, "Brand");
  const brand2 = getProductAttribute(product2, "Brand");
  const model1 = getProductAttribute(product1, "Model");
  const model2 = getProductAttribute(product2, "Model");
  const sku1 = product1?.sku ?? "";
  const sku2 = product2?.sku ?? "";

  const hasBoth = compare_list.length >= 2;
  const priceDiffer = price1 !== price2;
  const ratingDiffer = rating1 !== rating2;
  const availDiffer =
    product1?.stock_status !== product2?.stock_status ||
    (product1?.stock_quantity ?? null) !== (product2?.stock_quantity ?? null);
  const catDiffer = cat1 !== cat2;
  const descDiffer = desc1 !== desc2;
  const brandDiffer = brand1 !== brand2;
  const modelDiffer = model1 !== model2;
  const skuDiffer = sku1 !== sku2;

  const imageSize = (width - LABEL_WIDTH) / 2 - 28;
  const descWidth = (width - LABEL_WIDTH) / 2 - 20;

  const renderStars = (rating: number) => {
    const full = Math.round(rating);
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Icon
            key={i}
            name={i <= full ? "star-filled" : "star"}
            size={16}
            color={colors.warning}
          />
        ))}
      </View>
    );
  };

  const renderPrice = (product: Product, isBest: boolean) => {
    const price = Number(product?.price);
    const regular = Number(product?.regular_price);
    const onSale = product?.on_sale && regular > price;
    const discount = onSale
      ? Math.round(((regular - price) / regular) * 100)
      : null;
    return (
      <View style={styles.priceWrap}>
        {onSale && (
          <CustomText style={styles.oldPrice}>
            Ksh.{regular.toLocaleString()}
          </CustomText>
        )}
        <View style={styles.priceRow}>
          <CustomText variant="h6" style={[styles.price, isBest && styles.bestPrice]}>
            Ksh.{price.toLocaleString()}
          </CustomText>
          {onSale && discount != null && (
            <View style={[styles.discountTag, { backgroundColor: colors.success }]}>
              <CustomText style={styles.discountText}>-{discount}%</CustomText>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderStock = (status: string, qty: number | null) => {
    const inStock = status === "instock";
    return (
      <View style={styles.stockWrap}>
        <View
          style={[
            styles.stockDot,
            { backgroundColor: inStock ? colors.success : colors.error },
          ]}
        />
        <CustomText
          style={[
            styles.cellText,
            { color: inStock ? colors.success : colors.error, fontWeight: "500" },
          ]}
        >
          {inStock ? "In Stock" : "Out of Stock"}
          {qty != null ? ` (${qty})` : ""}
        </CustomText>
      </View>
    );
  };

  const renderText = (value: string) => (
    <CustomText style={styles.cellText}>{value || "—"}</CustomText>
  );

  const renderDescription = (product: Product) => (
    <ScrollView
      style={styles.descScroll}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      <RenderHTML
        contentWidth={descWidth}
        ignoredDomTags={["img", "button"]}
        source={{
          html: product?.short_description
            ? product.short_description
            : "<p>No description available for this product.</p>",
        }}
        defaultTextProps={{ style: { color: colors.textSecondary } }}
      />
    </ScrollView>
  );

  const renderAddSlot = () => (
    <Pressable
      style={[
        styles.addSlot,
        { borderColor: colors.border, minHeight: imageSize + 24 },
      ]}
      onPress={() => router.navigate("/category")}
      accessibilityLabel="Add product to compare"
      hitSlop={4}
    >
      <Icon name="plus" size={32} color={colors.primary} />
      <CustomText
        variant="caption"
        style={[styles.addSlotText, { color: colors.textSecondary }]}
      >
        Add product
      </CustomText>
    </Pressable>
  );

  if (compare_list.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CompareHeader
          colors={colors}
          topInset={insets.top}
          hasItems={false}
          onBack={() => router.back()}
          onShare={handleShare}
          onClear={() => {
            handleClearAll();
            router.back();
          }}
        />
        <View style={styles.emptyWrap}>
          <EmptyState
            title="Comparison cleared"
            desc="You've removed all products from the comparison. Add products to compare or browse the catalog."
            buttonText="Browse Products"
            image={require("@/assets/illustrations/empty_cart.svg")}
            onPress={() => router.navigate("/category")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CompareHeader
        colors={colors}
        topInset={insets.top}
        hasItems={compare_list.length > 0}
        onBack={() => router.back()}
        onShare={handleShare}
        onClear={() => {
          handleClearAll();
          router.back();
        }}
      />
      <CompareTable
        product1={product1}
        product2={product2}
        colors={colors}
        imageSize={imageSize}
        onRemove={removeFromCompare}
        onAddBoth={handleAddBoth}
        renderPrice={renderPrice}
        renderStars={renderStars}
        renderStock={renderStock}
        renderDescription={renderDescription}
        renderText={renderText}
        renderAddSlot={renderAddSlot}
        diffs={{
          hasBoth,
          priceDiffer,
          ratingDiffer,
          availDiffer,
          brandDiffer,
          modelDiffer,
          skuDiffer,
          catDiffer,
          descDiffer,
          cheaper,
          higherRated,
          bestValue,
          brand1,
          brand2,
          model1,
          model2,
          sku1,
          sku2,
          cat1,
          cat2,
          rating1,
          rating2,
        }}
      />
    </View>
  );
};

export default ProductComparison;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    cellText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.text,
    },
    priceWrap: {
      alignItems: "flex-start",
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    price: {
      fontSize: 15,
      color: colors.text,
    },
    bestPrice: {
      fontWeight: "bold",
      color: colors.primary,
    },
    oldPrice: {
      fontSize: 12,
      color: colors.textSecondary,
      textDecorationLine: "line-through",
      marginBottom: 2,
    },
    discountTag: {
      marginLeft: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    discountText: {
      color: "#ffffff",
      fontSize: 11,
      fontWeight: "700",
    },
    stars: {
      flexDirection: "row",
    },
    stockWrap: {
      flexDirection: "row",
      alignItems: "center",
    },
    stockDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    descScroll: {
      maxHeight: 220,
    },
    addSlot: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderStyle: "dashed",
      borderRadius: 12,
      paddingVertical: 12,
    },
    addSlotText: {
      marginTop: 6,
      fontWeight: "600",
    },
    emptyWrap: {
      flex: 1,
    },
  });
