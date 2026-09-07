import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
} from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { toast } from "sonner-native";

import Icon from "@/components/common/Icon";
import { Order } from "@/types/order";
import { Colors } from "@/types/app";
import { SIZES } from "@/styles/sizes";
import { useCartStore } from "@/features/cart/stores/useCartStore";
import { openWhatsApp } from "@/utils/externalLinks";
import RetryPaymentModal from "./RetryPaymentModal";

interface OrderDetailsModalProps {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
}

interface StepInfo {
  id: string;
  title: string;
  desc: string;
  icon: "badge-check" | "clock" | "package" | "truck" | "map-pin" | "user-round" | "x-circle";
  isCompleted: boolean;
  isActive: boolean;
}

function computeOrderModalSteps(order: Order | null): StepInfo[] {
  const status = (order?.status || "pending").toLowerCase();

  if (status === "cancelled" || status === "refunded") {
    return [
      { id: "placed", title: "Order Placed", desc: "Order was received", icon: "badge-check", isCompleted: true, isActive: false },
      { id: "cancelled", title: "Order Cancelled", desc: "This order was cancelled", icon: "x-circle", isCompleted: false, isActive: true },
    ];
  }

  const isDelivered = status === "delivered" || status === "completed";
  const isPickupReady = isDelivered || status === "pickup" || status === "available_for_pickup" || status === "out_for_delivery";
  const isShipped = isPickupReady || status === "shipped" || status === "in_transit" || status === "transit";
  const isWaitingShipment = isShipped || status === "processing" || status === "paid";
  const isConfirmed = isWaitingShipment || status === "confirmed";

  const destinationCity = order?.shipping?.city || "your destination hub";

  return [
    {
      id: "placed",
      title: "Order Placed",
      desc: "Initial order recorded",
      icon: "badge-check",
      isCompleted: isConfirmed || isWaitingShipment || isShipped || isPickupReady || isDelivered,
      isActive: status === "pending" && !isConfirmed,
    },
    {
      id: "pending_confirmation",
      title: "Pending Confirmation",
      desc: isConfirmed ? "Verification complete" : "Awaiting seller review",
      icon: "clock",
      isCompleted: isWaitingShipment || isShipped || isPickupReady || isDelivered,
      isActive: status === "pending" || status === "on-hold",
    },
    {
      id: "waiting_shipment",
      title: "Packing & Inspection",
      desc: isShipped ? "Packaged & sealed safely" : "Quality check & packaging",
      icon: "package",
      isCompleted: isShipped || isPickupReady || isDelivered,
      isActive: status === "processing" || status === "paid",
    },
    {
      id: "shipped",
      title: "Out for Delivery",
      desc: isPickupReady ? `On the way to ${destinationCity}` : `Dispatched & on the way to ${destinationCity}`,
      icon: "truck",
      isCompleted: isPickupReady || isDelivered,
      isActive: status === "shipped" || status === "in_transit" || status === "transit",
    },
    {
      id: "pickup",
      title: "Arrived in Your Area",
      desc: isDelivered ? `Arrived in ${destinationCity}` : `Arrived in ${destinationCity} for delivery`,
      icon: "map-pin",
      isCompleted: isDelivered,
      isActive: isPickupReady && !isDelivered,
    },
    {
      id: "delivered",
      title: "Delivered",
      desc: isDelivered ? "Delivered & completed" : "Delivered to your doorstep",
      icon: "user-round",
      isCompleted: isDelivered,
      isActive: isDelivered,
    },
  ];
}

const getStatusConfig = (status: string) => {
  const s = (status || "pending").toLowerCase();
  if (s === "completed" || s === "delivered") {
    return { color: "#10B981", bg: "#10B98118", label: "DELIVERED", icon: "badge-check" as const };
  }
  if (s === "pickup" || s === "available_for_pickup" || s === "out_for_delivery") {
    return { color: "#059669", bg: "#05966918", label: "READY FOR PICKUP", icon: "map-pin" as const };
  }
  if (s === "shipped" || s === "in_transit" || s === "transit") {
    return { color: "#3B82F6", bg: "#3B82F618", label: "SHIPPED", icon: "truck" as const };
  }
  if (s === "processing" || s === "paid") {
    return { color: "#8B5CF6", bg: "#8B5CF618", label: "WAITING TO BE SHIPPED", icon: "package" as const };
  }
  if (s === "cancelled" || s === "refunded") {
    return { color: "#EF4444", bg: "#EF444418", label: "CANCELLED", icon: "x-circle" as const };
  }
  return { color: "#F59E0B", bg: "#F59E0B18", label: "PENDING CONFIRMATION", icon: "clock" as const };
};

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const addToCart = useCartStore((state) => state.addToCart);

  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);
  const orderTotal = parseFloat(order.total || "0");
  const shippingTotal = parseFloat(order.shipping_total || "0");
  const discountTotal = parseFloat(order.discount_total || "0");
  const subtotal = orderTotal - shippingTotal + discountTotal;

  const canPay = ["pending", "on-hold", "failed"].includes(
    (order.status || "").toLowerCase()
  );

  const steps = computeOrderModalSteps(order);

  const handleReorder = () => {
    if (!order.line_items || order.line_items.length === 0) {
      toast.error("No items to reorder");
      return;
    }

    let addedCount = 0;
    order.line_items.forEach((item) => {
      const mockProduct: any = {
        id: item.product_id,
        name: item.name,
        price: item.price,
        stock_quantity: 99,
        sku: item.sku || "",
        images: item.image?.src ? [{ url: item.image.src }] : [],
        image_url: item.image?.src || "",
        categories: [],
      };
      for (let i = 0; i < item.quantity; i++) {
        addToCart(mockProduct);
      }
      addedCount += item.quantity;
    });

    toast.success(`Added ${addedCount} item(s) to your cart!`);
    onClose();
    router.navigate("/(shop)/cart");
  };

  const handleShareReceipt = async () => {
    try {
      await Share.share({
        message: `MyMedDevices Order #${order.id}\nStatus: ${statusConfig.label}\nTotal: KES ${orderTotal.toLocaleString()}\nItems: ${order.line_items?.length || 0}\nTrack at: https://mymeddevices.com/orders/${order.id}`,
        title: `Receipt for Order #${order.id}`,
      });
    } catch {}
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            {/* Header Bar */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Order #{order.id}</Text>
                <Text style={styles.headerSubtitle}>
                  Placed on{" "}
                  {order.date_created
                    ? new Date(order.date_created).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Status Banner */}
              <View style={[styles.statusBanner, { backgroundColor: statusConfig.bg }]}>
                <View style={styles.statusLeft}>
                  <Icon name={statusConfig.icon} size={20} color={statusConfig.color} />
                  <View>
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                    <Text style={styles.statusSubtext}>
                      Payment: {order.payment_method_title || order.payment_method?.toUpperCase() || "M-Pesa"}
                    </Text>
                  </View>
                </View>

                {canPay ? (
                  <TouchableOpacity
                    style={[styles.trackNavBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setShowRetryModal(true)}
                    activeOpacity={0.85}
                  >
                    <Icon name="credit-card" size={14} color="#FFFFFF" />
                    <Text style={styles.trackNavBtnText}>Pay Now</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.trackNavBtn}
                    onPress={() => {
                      onClose();
                      router.push({
                        pathname: "/order-tracking",
                        params: { orderId: order.id.toString() },
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.trackNavBtnText}>Live Track</Text>
                    <Icon name="arrow-right" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Progress Timeline Stepper */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeader}>Delivery Progress</Text>
                <View style={styles.stepsContainer}>
                  {steps.map((step, idx) => {
                    const isLast = idx === steps.length - 1;
                    const isNodeActive = step.isActive || step.isCompleted;

                    return (
                      <View key={step.id} style={styles.modalStepRow}>
                        <View style={styles.modalStepIconCol}>
                          <View
                            style={[
                              styles.modalStepCircle,
                              {
                                backgroundColor: step.isCompleted
                                  ? colors.primary
                                  : step.isActive
                                  ? colors.primary + "20"
                                  : colors.card,
                                borderColor: isNodeActive ? colors.primary : colors.border,
                              },
                            ]}
                          >
                            <Icon
                              name={step.icon}
                              size={11}
                              color={
                                step.isCompleted
                                  ? "#FFFFFF"
                                  : step.isActive
                                  ? colors.primary
                                  : colors.textSecondary || colors.text
                              }
                            />
                          </View>
                          {!isLast && (
                            <View
                              style={[
                                styles.modalStepLine,
                                {
                                  backgroundColor: step.isCompleted
                                    ? colors.primary
                                    : colors.border,
                                },
                              ]}
                            />
                          )}
                        </View>
                        <View style={styles.modalStepInfo}>
                          <Text
                            style={[
                              styles.modalStepTitle,
                              {
                                color: isNodeActive
                                  ? colors.text
                                  : colors.textSecondary || colors.text,
                                fontWeight: isNodeActive ? "700" : "500",
                              },
                            ]}
                          >
                            {step.title}
                          </Text>
                          <Text style={styles.modalStepDesc}>{step.desc}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Line Items Section */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeader}>Shipment Items ({order.line_items?.length || 0})</Text>

                <View style={styles.itemsList}>
                  {order.line_items?.map((item, idx) => (
                    <View key={item.id || idx} style={styles.itemRow}>
                      <Image
                        source={item.image?.src || require("@/assets/images/placeholder.png")}
                        style={styles.itemThumbnail}
                        contentFit="cover"
                      />
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        {item.sku ? (
                          <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                        ) : null}
                        <View style={styles.itemPriceRow}>
                          <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                          <Text style={styles.itemPrice}>
                            KES {Number(item.price || 0).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Price & Financial Breakdown */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeader}>Payment Summary</Text>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Items Subtotal</Text>
                  <Text style={styles.calcValue}>KES {subtotal.toLocaleString()}</Text>
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Delivery Fee</Text>
                  <Text style={styles.calcValue}>
                    {shippingTotal > 0 ? `KES ${shippingTotal.toLocaleString()}` : "Free"}
                  </Text>
                </View>

                {discountTotal > 0 ? (
                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { color: "#10B981" }]}>Discount Applied</Text>
                    <Text style={[styles.calcValue, { color: "#10B981" }]}>
                      -KES {discountTotal.toLocaleString()}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Payable</Text>
                  <Text style={styles.totalValue}>KES {orderTotal.toLocaleString()}</Text>
                </View>
              </View>

              {/* Shipping & Recipient Details */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeader}>Destination & Consignee</Text>

                <View style={styles.recipientRow}>
                  <Icon name="map-pin" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recipientName}>
                      {order.shipping?.first_name || order.billing?.first_name || "Customer"}{" "}
                      {order.shipping?.last_name || order.billing?.last_name || ""}
                    </Text>
                    <Text style={styles.recipientAddress}>
                      {order.shipping?.address_1 || order.billing?.address_1 || "Nairobi, Kenya"}
                    </Text>
                    <Text style={styles.recipientCity}>
                      {order.shipping?.city || "Nairobi"}, Kenya • {order.shipping?.phone || order.billing?.phone || ""}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Action Footer */}
            <View style={styles.footer}>
              {canPay ? (
                <TouchableOpacity
                  style={[styles.reorderBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setShowRetryModal(true)}
                  activeOpacity={0.85}
                >
                  <Icon name="credit-card" size={16} color="#FFFFFF" />
                  <Text style={styles.reorderBtnText}>Pay Now</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.reorderBtn}
                  onPress={handleReorder}
                  activeOpacity={0.85}
                >
                  <Icon name="refresh" size={16} color="#FFFFFF" />
                  <Text style={styles.reorderBtnText}>Reorder Items</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShareReceipt}
                activeOpacity={0.8}
              >
                <Icon name="share" size={16} color={colors.text} />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.supportBtn}
                onPress={() =>
                  openWhatsApp(
                    `Hello MyMedDevices Support, I need assistance regarding Order #${order.id}`
                  )
                }
                activeOpacity={0.8}
              >
                <Icon name="help" size={16} color="#25D366" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Retry Payment Modal */}
      <RetryPaymentModal
        order={order}
        visible={showRetryModal}
        onClose={() => setShowRetryModal(false)}
      />
    </>
  );
};

export default OrderDetailsModal;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    sheetContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "88%",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SIZES.spacingLG,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    scrollContent: {
      padding: SIZES.spacingMD,
      gap: 12,
      paddingBottom: 24,
    },
    statusBanner: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 14,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: "transparent",
    },
    statusLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    statusText: {
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    statusSubtext: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      marginTop: 2,
    },
    trackNavBtn: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: SIZES.radius_small,
    },
    trackNavBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },
    cardSection: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 10,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      opacity: 0.7,
      marginBottom: 2,
    },
    stepsContainer: {
      gap: 0,
      paddingVertical: 4,
    },
    modalStepRow: {
      flexDirection: "row",
      minHeight: 42,
    },
    modalStepIconCol: {
      alignItems: "center",
      width: 24,
      marginRight: 10,
    },
    modalStepCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    modalStepLine: {
      width: 2,
      flex: 1,
      marginVertical: 2,
    },
    modalStepInfo: {
      flex: 1,
      paddingBottom: 8,
    },
    modalStepTitle: {
      fontSize: 12,
    },
    modalStepDesc: {
      fontSize: 10,
      color: colors.textSecondary || colors.text,
      opacity: 0.65,
      marginTop: 1,
    },
    itemsList: {
      gap: 10,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    itemThumbnail: {
      width: 52,
      height: 52,
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemDetails: {
      flex: 1,
      gap: 2,
    },
    itemName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    itemSku: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.6,
    },
    itemPriceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 2,
    },
    itemQty: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      fontWeight: "600",
    },
    itemPrice: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    calcRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    calcLabel: {
      fontSize: 13,
      color: colors.textSecondary || colors.text,
      opacity: 0.8,
    },
    calcValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
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
      fontWeight: "800",
      color: colors.text,
    },
    totalValue: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.primary,
    },
    recipientRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    recipientName: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    recipientAddress: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.8,
      marginTop: 2,
    },
    recipientCity: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.6,
      marginTop: 1,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: SIZES.spacingMD,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    reorderBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: SIZES.radius_medium,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    reorderBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
    shareBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    shareBtnText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },
    supportBtn: {
      width: 46,
      height: 46,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: "#25D36640",
      backgroundColor: "#25D36615",
      alignItems: "center",
      justifyContent: "center",
    },
  });
