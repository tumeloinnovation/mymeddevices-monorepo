import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Icon from "@/components/common/Icon";
import { formatCurrency } from "@/utils/formatTime";

interface OrderReviewSectionProps {
  items: any[];
  subtotal: number;
  shipping: number;
  packagingFee: number;
  servicesFee: number;
  total: number;
  paymentMethod: string;
  customerPhone?: string;
  onEditContact?: () => void;
  setPaymentMethod: (method: string) => void;
}

const OrderReviewSection: React.FC<OrderReviewSectionProps> = ({
  items,
  subtotal,
  shipping,
  packagingFee,
  servicesFee,
  total,
  paymentMethod,
  customerPhone,
  onEditContact,
  setPaymentMethod,
}) => {
  const { colors, dark } = useTheme();
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);

  const handleSelectPayment = (method: string) => {
    Haptics.selectionAsync().catch(() => {});
    setPaymentMethod(method);
  };

  const isMpesa = paymentMethod === "mpesa";
  const isCod = paymentMethod === "cod";
  const totalItemCount = items.reduce((s, i) => s + (i.quantity || 1), 0);

  return (
    <View style={styles.reviewSection}>
      {/* 1. Payment Method Selection */}
      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          Select Payment Option
        </Text>

        <View style={styles.paymentCards}>
          {/* M-Pesa STK Push */}
          <TouchableOpacity
            style={[
              styles.paymentOptionCard,
              {
                backgroundColor: dark ? colors.background : "#FFFFFF",
                borderColor: isMpesa ? "#10B981" : colors.border,
                borderWidth: isMpesa ? 2 : 1,
              },
            ]}
            onPress={() => handleSelectPayment("mpesa")}
            activeOpacity={0.8}
          >
            <View style={styles.paymentCardHeader}>
              <View style={[styles.paymentIconBox, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                <Icon name="phone" size={18} color="#10B981" />
              </View>
              <View style={styles.paymentInfo}>
                <View style={styles.paymentTitleRow}>
                  <Text style={[styles.paymentTitle, { color: colors.text }]}>
                    M-Pesa STK Push
                  </Text>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Recommended</Text>
                  </View>
                </View>
                <Text style={[styles.paymentDesc, { color: colors.textSecondary || colors.text }]}>
                  Instant PIN prompt sent to your mobile phone
                </Text>
              </View>
              <View
                style={[
                  styles.radioIndicator,
                  {
                    borderColor: isMpesa ? "#10B981" : colors.border,
                    backgroundColor: isMpesa ? "#10B981" : "transparent",
                  },
                ]}
              >
                {isMpesa && <Icon name="check" size={11} color="#FFFFFF" />}
              </View>
            </View>

            {/* M-Pesa Phone Confirmation */}
            {isMpesa && customerPhone ? (
              <View style={[styles.mpesaPromptNotice, { backgroundColor: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.2)" }]}>
                <Icon name="phone" size={14} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mpesaNoticeText, { color: colors.textSecondary || colors.text }]}>
                    Prompt will be sent to: <Text style={{ fontWeight: "700", color: "#10B981" }}>{customerPhone}</Text>
                  </Text>
                </View>
                {onEditContact && (
                  <TouchableOpacity onPress={onEditContact} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={[styles.changePhoneText, { color: colors.primary }]}>Change</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Cash on Delivery (COD) */}
          <TouchableOpacity
            style={[
              styles.paymentOptionCard,
              {
                backgroundColor: dark ? colors.background : "#FFFFFF",
                borderColor: isCod ? colors.primary : colors.border,
                borderWidth: isCod ? 2 : 1,
              },
            ]}
            onPress={() => handleSelectPayment("cod")}
            activeOpacity={0.8}
          >
            <View style={styles.paymentCardHeader}>
              <View style={[styles.paymentIconBox, { backgroundColor: colors.primary + "14" }]}>
                <Icon name="package" size={18} color={colors.primary} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentTitle, { color: colors.text }]}>
                  Pay on Delivery
                </Text>
                <Text style={[styles.paymentDesc, { color: colors.textSecondary || colors.text }]}>
                  Pay via Cash or M-Pesa upon receiving goods
                </Text>
              </View>
              <View
                style={[
                  styles.radioIndicator,
                  {
                    borderColor: isCod ? colors.primary : colors.border,
                    backgroundColor: isCod ? colors.primary : "transparent",
                  },
                ]}
              >
                {isCod && <Icon name="check" size={11} color="#FFFFFF" />}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Order Items (Compact Visual Preview + Collapsible Breakdown) */}
      <View style={styles.sectionBlock}>
        <View style={styles.itemsHeaderRow}>
          <View style={styles.itemsHeaderLeft}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Items in Order
            </Text>
            <View style={[styles.itemCountBadge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.itemCountBadgeText, { color: colors.primary }]}>
                {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.expandToggleBtn}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setIsItemsExpanded((prev) => !prev);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.expandToggleText, { color: colors.primary }]}>
              {isItemsExpanded ? "Hide Details" : "View Details"}
            </Text>
            <Icon
              name={isItemsExpanded ? "chevron-up" : "chevron-down"}
              size={13}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.compactItemsCard,
            {
              backgroundColor: dark ? colors.background : "#F8FAFC",
              borderColor: colors.border,
            },
          ]}
        >
          {/* Horizontal Thumbnail Gallery */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailScroll}
          >
            {items.map((item, idx) => {
              const imageUri =
                item.images?.[0]?.src ||
                (typeof item.images?.[0] === "string" ? item.images[0] : null) ||
                item.image?.src ||
                (typeof item.image === "string" ? item.image : null) ||
                item.featured_image ||
                item.thumbnail;

              return (
                <View key={item.id || idx} style={styles.thumbWrapper}>
                  <View
                    style={[
                      styles.thumbBox,
                      {
                        backgroundColor: dark ? colors.card : "#FFFFFF",
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Image
                      source={imageUri || require("@/assets/images/placeholder.png")}
                      style={styles.thumbImage}
                      contentFit="contain"
                      placeholder={require("@/assets/images/placeholder.png")}
                      transition={200}
                    />
                  </View>
                  {item.quantity > 1 && (
                    <View style={[styles.qtyBubble, { backgroundColor: colors.primary }]}>
                      <Text style={styles.qtyBubbleText}>×{item.quantity}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Expandable Item Breakdown */}
          {isItemsExpanded && (
            <View style={[styles.expandedList, { borderTopColor: colors.border }]}>
              {items.map((item, index) => {
                const imageUri =
                  item.images?.[0]?.src ||
                  (typeof item.images?.[0] === "string" ? item.images[0] : null) ||
                  item.image?.src ||
                  (typeof item.image === "string" ? item.image : null) ||
                  item.featured_image ||
                  item.thumbnail;

                return (
                  <View
                    key={item.id || index}
                    style={[
                      styles.itemRow,
                      index < items.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.rowThumbBox,
                        {
                          backgroundColor: dark ? colors.card : "#FFFFFF",
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Image
                        source={imageUri || require("@/assets/images/placeholder.png")}
                        style={styles.rowThumbImage}
                        contentFit="contain"
                        placeholder={require("@/assets/images/placeholder.png")}
                      />
                    </View>
                    <View style={styles.itemMain}>
                      <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </Text>
                    </View>
                    <Text style={[styles.itemTotal, { color: colors.text }]}>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* 3. Cost Breakdown */}
      <View
        style={[
          styles.breakdownCard,
          {
            backgroundColor: dark ? colors.background : "#F8FAFC",
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
            Subtotal
          </Text>
          <Text style={[styles.breakdownVal, { color: colors.text }]}>
            {formatCurrency(subtotal)}
          </Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
            Shipping & Dispatch
          </Text>
          <Text style={[styles.breakdownVal, { color: colors.text }]}>
            {shipping === 0 ? "Free" : formatCurrency(shipping)}
          </Text>
        </View>

        {packagingFee > 0 && (
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Medical Packaging
            </Text>
            <Text style={[styles.breakdownVal, { color: colors.text }]}>
              {formatCurrency(packagingFee)}
            </Text>
          </View>
        )}

        {servicesFee > 0 && (
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Regulatory & Handling Fee
            </Text>
            <Text style={[styles.breakdownVal, { color: colors.text }]}>
              {formatCurrency(servicesFee)}
            </Text>
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.totalRow}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total Amount
            </Text>
            <Text style={[styles.taxInclusiveText, { color: colors.textSecondary }]}>
              Includes all taxes and delivery
            </Text>
          </View>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            {formatCurrency(total)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  reviewSection: {
    gap: 16,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  paymentCards: {
    gap: 10,
  },
  paymentOptionCard: {
    padding: 12,
    borderRadius: 14,
  },
  paymentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  popularBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadgeText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "700",
  },
  paymentDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  mpesaPromptNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  mpesaNoticeText: {
    fontSize: 11,
    lineHeight: 15,
  },
  changePhoneText: {
    fontSize: 11,
    fontWeight: "700",
  },
  itemsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemCountBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  expandToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  expandToggleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  compactItemsCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  thumbnailScroll: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    alignItems: "center",
  },
  thumbWrapper: {
    position: "relative",
    width: 52,
    height: 52,
  },
  thumbBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  rowThumbBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rowThumbImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  qtyBubble: {
    position: "absolute",
    top: -5,
    right: -5,
    borderRadius: 9,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1.5,
    zIndex: 10,
  },
  qtyBubbleText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  expandedList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    gap: 8,
  },
  itemMain: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "600",
  },
  itemSub: {
    fontSize: 11,
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: "700",
  },
  breakdownCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  taxInclusiveText: {
    fontSize: 10,
    marginTop: 1,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "800",
  },
});

export default OrderReviewSection;
