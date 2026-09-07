import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { toast } from "sonner-native";
import * as Haptics from "expo-haptics";

import { Product } from "@/types/product";
import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";

interface ProductSpecsTableProps {
  product: Product;
  defaultExpanded?: boolean;
}

export const ProductSpecsTable: React.FC<ProductSpecsTableProps> = ({
  product,
  defaultExpanded = false,
}) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const brandAttr = product?.attributes?.find((a) => a.name.toLowerCase() === "brand");
  const modelAttr = product?.attributes?.find((a) => a.name.toLowerCase() === "model");

  const otherAttrs = (product?.attributes || []).filter(
    (a) => a.name.toLowerCase() !== "brand" && a.name.toLowerCase() !== "model"
  );

  const handleCopySku = () => {
    Haptics.selectionAsync().catch(() => {});
    toast.success("SKU copied to clipboard", {
      description: product.sku || `MMD-${product.id}`,
    });
  };

  const toggleAccordion = () => {
    Haptics.selectionAsync().catch(() => {});
    setIsExpanded((prev) => !prev);
  };

  const identificationGroup = [
    {
      label: "Brand Name",
      value: brandAttr?.options?.join(", ") || "MyMed Certified",
    },
    {
      label: "Model / Series",
      value: modelAttr?.options?.join(", ") || product?.name || "Standard Model",
    },
    {
      label: "SKU / Reference",
      value: product?.sku || `MMD-${product?.id}`,
      isSku: true,
    },
    {
      label: "Product Category",
      value:
        product?.categories?.[0]?.name &&
        product?.categories?.[0]?.name !== "Uncategorized"
          ? product.categories[0].name
          : "Medical Device",
    },
  ];

  const physicalGroup = [
    {
      label: "Dimensions (L × W × H)",
      value:
        product?.dimensions?.length && Number(product.dimensions.length) > 0
          ? `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} cm`
          : "Standard Package Dimension",
    },
    {
      label: "Package Status",
      value: "Sealed & Brand New",
    },
    {
      label: "Stock Condition",
      value:
        product?.stock_status === "instock"
          ? `In Stock (${product?.stock_quantity ?? "Available"} Units)`
          : "Order on Request",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Accordion Toggle Header */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleAccordion}
        style={styles.accordionHeader}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Icon name="check-list" size={15} color={colors.primary} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Technical Specifications</Text>
            <Text style={styles.subtitle}>
              {identificationGroup[0].value} • {physicalGroup[2].value}
            </Text>
          </View>
        </View>
        <Icon
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.textSecondary || "#64748B"}
        />
      </TouchableOpacity>

      {/* Accordion Content Body */}
      {isExpanded && (
        <View style={styles.accordionContent}>
          {/* 1. Identification Section */}
          <View style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <Icon name="award" size={14} color={colors.primary} />
              <Text style={styles.groupTitle}>Device Identification</Text>
            </View>

            <View style={styles.table}>
              {identificationGroup.map((item, index) => {
                const isLast = index === identificationGroup.length - 1;
                return (
                  <View
                    key={item.label}
                    style={[styles.row, !isLast && styles.rowBorder]}
                  >
                    <Text style={styles.labelCol}>{item.label}</Text>
                    <View style={styles.valueWrap}>
                      <Text style={styles.valueCol}>{item.value}</Text>
                      {item.isSku && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={handleCopySku}
                          style={styles.copyButton}
                        >
                          <Icon name="pencil" size={11} color={colors.primary} />
                          <Text style={styles.copyText}>Copy</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 2. Physical & Packaging Section */}
          <View style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <Icon name="package" size={14} color="#0284C7" />
              <Text style={styles.groupTitle}>Physical & Packaging Specs</Text>
            </View>

            <View style={styles.table}>
              {physicalGroup.map((item, index) => {
                const isLast = index === physicalGroup.length - 1;
                return (
                  <View
                    key={item.label}
                    style={[styles.row, !isLast && styles.rowBorder]}
                  >
                    <Text style={styles.labelCol}>{item.label}</Text>
                    <Text style={styles.valueCol}>{item.value}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 3. Additional Dynamic Technical Attributes (if available) */}
          {otherAttrs.length > 0 && (
            <View style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Icon name="check-list" size={14} color="#7C3AED" />
                <Text style={styles.groupTitle}>Technical Attributes</Text>
              </View>

              <View style={styles.table}>
                {otherAttrs.map((attr, index) => {
                  const isLast = index === otherAttrs.length - 1;
                  return (
                    <View
                      key={attr.name + index}
                      style={[styles.row, !isLast && styles.rowBorder]}
                    >
                      <Text style={styles.labelCol}>{attr.name}</Text>
                      <Text style={styles.valueCol}>
                        {attr.options?.join(", ") || "—"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default ProductSpecsTable;

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    container: {
      gap: 10,
    },
    accordionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.primary + "14",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTextWrap: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    subtitle: {
      fontSize: 11,
      color: colors.textSecondary || "#64748B",
    },
    accordionContent: {
      gap: 10,
      paddingTop: 6,
    },
    groupCard: {
      backgroundColor: dark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    groupHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: dark ? "rgba(255,255,255,0.02)" : "#F1F5F9",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    groupTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    table: {
      paddingHorizontal: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 9,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: dark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
    },
    labelCol: {
      width: "42%",
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary || "#64748B",
    },
    valueWrap: {
      width: "58%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
    },
    valueCol: {
      flex: 1,
      fontSize: 11,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 15,
    },
    copyButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      backgroundColor: colors.primary + "14",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    copyText: {
      fontSize: 9,
      fontWeight: "700",
      color: colors.primary,
    },
  });
