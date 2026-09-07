import React, { useState, useEffect, useLayoutEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Share,
} from "react-native";
import { useLocalSearchParams, useNavigation, router } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { toast } from "sonner-native";

import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { SIZES } from "@/styles/sizes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { orderApi } from "@/features/order/services/order.api";
import { Order } from "@/types/order";
import { useCartStore } from "@/features/cart/stores/useCartStore";
import OrderDetailsModal from "@/features/order/components/OrderDetailsModal";
import RetryPaymentModal from "@/features/order/components/RetryPaymentModal";
import TrackingProgressStepper, { StepInfo } from "@/features/order/components/TrackingProgressStepper";
import OrderOverviewCard from "@/features/order/components/OrderOverviewCard";
import OrderShipmentItemsPreview from "@/features/order/components/OrderShipmentItemsPreview";
import OrderSupportActionCard from "@/features/order/components/OrderSupportActionCard";
import OrderTrackingSearchHeader from "@/features/order/components/OrderTrackingSearchHeader";
import OrderTrackingEmptyState from "@/features/order/components/OrderTrackingEmptyState";

function computeTrackingSteps(order: Order | null): {
  steps: StepInfo[];
  statusLabel: string;
  statusBadgeColor: string;
  statusBadgeBg: string;
  estimatedArrival: string;
} {
  const status = (order?.status || "pending").toLowerCase();

  if (status === "cancelled" || status === "refunded") {
    return {
      steps: [
        { id: "placed", title: "Order Placed", desc: "Order was received", icon: "badge-check", isCompleted: true, isActive: false },
        { id: "cancelled", title: "Order Cancelled", desc: "This order was cancelled", icon: "x-circle", isCompleted: false, isActive: true },
      ],
      statusLabel: status.toUpperCase(),
      statusBadgeColor: "#EF4444",
      statusBadgeBg: "#EF444418",
      estimatedArrival: "Order Cancelled",
    };
  }

  const isDelivered = status === "delivered" || status === "completed";
  const isPickupReady = isDelivered || status === "pickup" || status === "available_for_pickup" || status === "out_for_delivery";
  const isShipped = isPickupReady || status === "shipped" || status === "in_transit" || status === "transit";
  const isWaitingShipment = isShipped || status === "processing" || status === "paid";
  const isConfirmed = isWaitingShipment || status === "confirmed";

  const dateCreated = order?.date_created
    ? new Date(order.date_created).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Verified timestamp";

  const destinationCity = order?.shipping?.city || "your destination hub";

  const steps: StepInfo[] = [
    {
      id: "placed",
      title: "Order Placed",
      desc: `Order received on ${dateCreated}`,
      icon: "badge-check",
      isCompleted: isConfirmed || isWaitingShipment || isShipped || isPickupReady || isDelivered,
      isActive: status === "pending" && !isConfirmed,
    },
    {
      id: "pending_confirmation",
      title: "Payment Confirmation",
      desc: isConfirmed
        ? "Order & payment confirmed"
        : "Awaiting payment or confirmation",
      icon: "clock",
      isCompleted: isWaitingShipment || isShipped || isPickupReady || isDelivered,
      isActive: status === "pending" || status === "on-hold",
    },
    {
      id: "waiting_shipment",
      title: "Packing & Inspection",
      desc: isShipped
        ? "Items checked, tested & packed"
        : "Quality check and safe packaging in progress",
      icon: "package",
      isCompleted: isShipped || isPickupReady || isDelivered,
      isActive: status === "processing" || status === "paid",
    },
    {
      id: "shipped",
      title: "Out for Delivery",
      desc: isPickupReady
        ? `On the way to ${destinationCity}`
        : `Dispatched & on the way to ${destinationCity}`,
      icon: "truck",
      isCompleted: isPickupReady || isDelivered,
      isActive: status === "shipped" || status === "in_transit" || status === "transit",
    },
    {
      id: "pickup",
      title: "Arrived in Your Area",
      desc: isDelivered
        ? `Arrived in ${destinationCity}`
        : `Arrived in ${destinationCity} for doorstep delivery`,
      icon: "map-pin",
      isCompleted: isDelivered,
      isActive: isPickupReady && !isDelivered,
    },
    {
      id: "delivered",
      title: "Delivered",
      desc: isDelivered
        ? `Delivered on ${order?.date_completed ? new Date(order.date_completed).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) : "Today"}`
        : "Package delivered to your doorstep",
      icon: "user-round",
      isCompleted: isDelivered,
      isActive: isDelivered,
    },
  ];

  // Determine location-dependent delivery timeline
  const locationNormalized = `${order?.shipping?.city || ""} ${order?.shipping?.state || ""} ${order?.shipping?.address_1 || ""}`.toLowerCase();
  const isNairobiMetro =
    locationNormalized.includes("nairobi") ||
    locationNormalized.includes("kiambu") ||
    locationNormalized.includes("kajiado") ||
    locationNormalized.includes("machakos");

  const isMajorCity =
    locationNormalized.includes("mombasa") ||
    locationNormalized.includes("nakuru") ||
    locationNormalized.includes("kisumu") ||
    locationNormalized.includes("eldoret") ||
    locationNormalized.includes("uasin gishu");

  const isRemoteRegion =
    locationNormalized.includes("turkana") ||
    locationNormalized.includes("mandera") ||
    locationNormalized.includes("marsabit") ||
    locationNormalized.includes("wajir") ||
    locationNormalized.includes("garissa") ||
    locationNormalized.includes("lamu");

  let statusLabel = "PENDING CONFIRMATION";
  let statusBadgeColor = "#F59E0B";
  let statusBadgeBg = "#F59E0B18";
  let estimatedArrival = isNairobiMetro
    ? "Same-Day / Next-Day"
    : isMajorCity
    ? "1 - 2 Business Days"
    : isRemoteRegion
    ? "3 - 5 Business Days"
    : "2 - 3 Business Days";

  if (isDelivered) {
    statusLabel = "DELIVERED";
    statusBadgeColor = "#10B981";
    statusBadgeBg = "#10B98118";
    estimatedArrival = "Delivered";
  } else if (isPickupReady) {
    statusLabel = "AVAILABLE FOR PICKUP";
    statusBadgeColor = "#059669";
    statusBadgeBg = "#05966918";
    estimatedArrival = "Ready for Collection";
  } else if (isShipped) {
    statusLabel = "SHIPPED";
    statusBadgeColor = "#3B82F6";
    statusBadgeBg = "#3B82F618";
    estimatedArrival = isNairobiMetro
      ? "Within 24 Hours"
      : isMajorCity
      ? "1 - 2 Days"
      : isRemoteRegion
      ? "2 - 4 Days"
      : "1 - 3 Days";
  } else if (isWaitingShipment) {
    statusLabel = "WAITING TO BE SHIPPED";
    statusBadgeColor = "#8B5CF6";
    statusBadgeBg = "#8B5CF618";
    estimatedArrival = isNairobiMetro
      ? "1 - 2 Days"
      : isMajorCity
      ? "2 - 3 Days"
      : isRemoteRegion
      ? "3 - 5 Days"
      : "2 - 4 Days";
  } else {
    statusLabel = "PENDING CONFIRMATION";
    statusBadgeColor = "#F59E0B";
    statusBadgeBg = "#F59E0B18";
    estimatedArrival = isNairobiMetro
      ? "1 - 2 Days (upon confirmation)"
      : isMajorCity
      ? "2 - 3 Days (upon confirmation)"
      : isRemoteRegion
      ? "3 - 5 Days (upon confirmation)"
      : "2 - 4 Days (upon confirmation)";
  }

  return { steps, statusLabel, statusBadgeColor, statusBadgeBg, estimatedArrival };
}

const OrderTrackingPage = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const styles = createStyles(colors, insets.bottom);
  const params = useLocalSearchParams<{ orderId?: string }>();

  const [orderQuery, setOrderQuery] = useState(params.orderId || "");
  const [trackedOrderNumber, setTrackedOrderNumber] = useState(params.orderId || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Track Order",
      headerBackTitle: "Store",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(shop)");
            }
          }}
          style={{ paddingRight: 14, paddingVertical: 6 }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.text]);

  const fetchOrderDetails = useCallback(async (orderId: string) => {
    if (!orderId.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const fetchedOrder = await orderApi.getOrder(orderId.trim());
      if (fetchedOrder && (fetchedOrder.id || fetchedOrder.number)) {
        setOrder(fetchedOrder);
      } else {
        const guestOrders = await orderApi.getGuestOrders(orderId.trim());
        if (guestOrders && guestOrders.length > 0) {
          setOrder(guestOrders[0]);
        } else {
          setErrorMessage(`No order record found for #${orderId}. Please check the number and retry.`);
          setOrder(null);
        }
      }
    } catch {
      // Fallback minimal order representation
      setOrder({
        id: orderId,
        number: orderId,
        status: "pending",
        currency: "KES",
        total: "0",
        date_created: new Date().toISOString(),
        shipping: {
          first_name: "Customer",
          last_name: "",
          company: "",
          address_1: "Nairobi, Kenya",
          address_2: "",
          city: "Nairobi",
          state: "Nairobi",
          postcode: "00100",
          country: "KE",
          phone: "",
        },
        billing: {
          first_name: "Customer",
          last_name: "",
          company: "",
          address_1: "Nairobi, Kenya",
          address_2: "",
          city: "Nairobi",
          state: "Nairobi",
          postcode: "00100",
          country: "KE",
          email: "",
          phone: "",
        },
        line_items: [],
        payment_method: "mpesa",
        payment_method_title: "M-Pesa Express",
      } as any);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params.orderId) {
      setOrderQuery(params.orderId);
      setTrackedOrderNumber(params.orderId);
      fetchOrderDetails(params.orderId);
    }
  }, [params.orderId, fetchOrderDetails]);

  const handleTrack = () => {
    if (orderQuery.trim()) {
      setTrackedOrderNumber(orderQuery.trim());
      fetchOrderDetails(orderQuery.trim());
    }
  };

  const handleReorder = () => {
    if (!order?.line_items || order.line_items.length === 0) {
      toast.error("No items in this order to reorder");
      return;
    }
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
    });
    toast.success("Order items added to cart!");
    router.navigate("/(shop)/cart");
  };

  const handleShareTracking = async () => {
    if (!trackedOrderNumber) return;
    try {
      await Share.share({
        message: `Track MyMedDevices Order #${trackedOrderNumber} status: ${statusLabel}\nhttps://mymeddevices.com/orders/${trackedOrderNumber}`,
        title: `Order #${trackedOrderNumber}`,
      });
    } catch {}
  };

  const canPay = ["pending", "on-hold", "failed"].includes(
    (order?.status || "").toLowerCase()
  );

  const { steps, statusLabel, statusBadgeColor, statusBadgeBg, estimatedArrival } =
    computeTrackingSteps(order);

  const isDelivered =
    (order?.status || "").toLowerCase() === "delivered" ||
    (order?.status || "").toLowerCase() === "completed";

  const destinationCity =
    order?.shipping?.city ||
    order?.shipping?.address_1 ||
    "Nairobi, Kenya";

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Search / Lookup Header */}
        <OrderTrackingSearchHeader
          orderQuery={orderQuery}
          isLoading={isLoading}
          onChangeQuery={setOrderQuery}
          onClearQuery={() => setOrderQuery("")}
          onSubmit={handleTrack}
        />

        {/* Error Banner */}
        {errorMessage && (
          <View style={styles.errorCard}>
            <Icon name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Tracking Details View */}
        {trackedOrderNumber ? (
          <>
            {/* Status Overview Card */}
            <OrderOverviewCard
              order={order}
              trackedOrderNumber={trackedOrderNumber}
              statusLabel={statusLabel}
              statusBadgeColor={statusBadgeColor}
              statusBadgeBg={statusBadgeBg}
              estimatedArrival={estimatedArrival}
              destinationCity={destinationCity}
              canPay={canPay}
              isDelivered={isDelivered}
              onPayNow={() => setShowRetryModal(true)}
              onViewDetails={() => setShowDetailsModal(true)}
              onShare={handleShareTracking}
            />

            {/* Stepper Timeline */}
            <TrackingProgressStepper steps={steps} />

            {/* Order Items Preview */}
            {order?.line_items && order.line_items.length > 0 && (
              <OrderShipmentItemsPreview
                items={order.line_items}
                onViewAll={() => setShowDetailsModal(true)}
              />
            )}

            {/* Quick Navigation & Support Actions */}
            <OrderSupportActionCard
              trackedOrderNumber={trackedOrderNumber}
              onReorder={handleReorder}
            />
          </>
        ) : (
          /* Empty / Initial State */
          <OrderTrackingEmptyState />
        )}
      </ScrollView>

      {/* Interactive Order Details Modal */}
      <OrderDetailsModal
        order={order}
        visible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      {/* Retry Payment Modal */}
      <RetryPaymentModal
        order={order}
        visible={showRetryModal}
        onClose={() => setShowRetryModal(false)}
        onSuccess={() => {
          if (trackedOrderNumber) fetchOrderDetails(trackedOrderNumber);
        }}
      />
    </>
  );
};

export default OrderTrackingPage;

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: SIZES.spacingMD,
      gap: 14,
      paddingBottom: Math.max(bottomInset, 16) + 24,
    },
    errorCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#EF444415",
      borderWidth: 1,
      borderColor: "#EF444430",
      borderRadius: SIZES.radius_medium,
      padding: 12,
    },
    errorText: {
      flex: 1,
      fontSize: 12,
      color: "#EF4444",
      fontWeight: "600",
    },
  });
