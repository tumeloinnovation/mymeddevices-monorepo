import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useNavigation, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";

import { Colors } from "@/types/app";
import { useCheckoutFlow } from "@/features/checkout/hooks/useCheckoutFlow";
import { useCheckoutStore } from "@/features/checkout/stores/useCheckoutStore";
import useDeliveryLocationStore from "@/stores/useDeliveryLocationStore";
import { useAuth } from "@/context/AuthContext";
import EmptyCartView from "@/features/checkout/components/EmptyCartView";
import AuthGateModal from "@/features/checkout/components/AuthGateModal";
import PaymentMethodSelector from "@/features/checkout/components/PaymentMethodSelector";
import CheckoutItemCard from "@/features/checkout/components/CheckoutItemCard";
import OrderSuccessModal from "@/features/checkout/components/OrderSuccessModal";
import CostBreakdownSheet, { InfoFeeType } from "@/features/checkout/components/CostBreakdownSheet";
import CheckoutDestinationCard from "@/features/checkout/components/CheckoutDestinationCard";
import CheckoutRecipientCard from "@/features/checkout/components/CheckoutRecipientCard";
import CheckoutCouponCard from "@/features/checkout/components/CheckoutCouponCard";
import LoyaltyPointsRedemptionCard from "@/features/checkout/components/LoyaltyPointsRedemptionCard";
import CheckoutCostBreakdownCard from "@/features/checkout/components/CheckoutCostBreakdownCard";
import CheckoutBottomBar from "@/features/checkout/components/CheckoutBottomBar";
import OrderProcessingModal from "@/features/checkout/components/OrderProcessingModal";

const Checkout = () => {
  const { colors, dark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, dark, insets.bottom);

  const flow = useCheckoutFlow();
  const { customer: authCustomer } = useAuth();
  const { currentLocation } = useDeliveryLocationStore();

  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const [pointsInput, setPointsInput] = useState("");
  const [infoModalType, setInfoModalType] = useState<InfoFeeType | null>(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Order Confirmation",
      headerBackTitle: "Cart",
      headerStyle: {
        backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      },
    });
  }, [navigation, dark]);

  // Synchronize delivery if set in delivery location store but not yet in checkout store
  const { setDelivery } = useCheckoutStore();
  useEffect(() => {
    if (!flow.delivery?.address && currentLocation?.formattedAddress) {
      const reg = currentLocation.state?.replace(/\s*County$/i, "").trim() || "";
      setDelivery({
        address: currentLocation.formattedAddress,
        region: reg,
      });
    }
  }, [currentLocation, flow.delivery?.address, setDelivery]);

  // If cart is empty and no order was just placed, display empty view
  if (flow.cart_list.length === 0 && !flow.isPending && !flow.showSuccessModal) {
    return <EmptyCartView />;
  }

  // Available loyalty points
  const availablePoints =
    authCustomer?.loyalty_points ??
    (authCustomer as any)?.loyalty_point ??
    250;

  // Maximum redeemable: cannot exceed available balance or 50% of subtotal
  const maxRedeemablePoints = Math.min(
    availablePoints,
    Math.round(flow.subtotal * 0.5 * 2) // 2 points = 1 KES
  );

  const userEnteredPoints = flow.pointsToRedeem || 0;
  const pointsDiscount = Math.floor(userEnteredPoints / 2);
  const couponDiscount = flow.coupon?.discount || 0;
  const finalTotal = Math.max(0, flow.total - couponDiscount - pointsDiscount);

  // Address logic: prioritize flow.delivery, then currentLocation
  const effectiveAddress = flow.delivery?.address || currentLocation?.formattedAddress || null;
  const effectiveRegion =
    flow.delivery?.region ||
    currentLocation?.state?.replace(/\s*County$/i, "").trim() ||
    "";

  const hasDeliverySet = Boolean(effectiveAddress);
  const hasContact = Boolean(flow.customer.name.trim() && flow.customer.phone.trim());
  const isFormComplete = Boolean(hasDeliverySet && hasContact);

  const handleApplyPoints = () => {
    const parsed = parseInt(pointsInput, 10);
    if (isNaN(parsed) || parsed <= 0) {
      flow.setPointsToRedeem(0);
      setPointsInput("");
      toast.info("Loyalty points cleared");
      return;
    }

    if (parsed > availablePoints) {
      toast.error(`You have ${availablePoints.toLocaleString()} points available`);
      return;
    }

    if (parsed > maxRedeemablePoints) {
      toast.error(`Maximum allowed for this order is ${maxRedeemablePoints.toLocaleString()} points`);
      return;
    }

    Haptics.selectionAsync().catch(() => {});
    flow.setPointsToRedeem(parsed);
    toast.success(`Applied ${parsed.toLocaleString()} points (-KES ${Math.floor(parsed / 2).toLocaleString()})`);
  };

  const handleClearPoints = () => {
    Haptics.selectionAsync().catch(() => {});
    flow.setPointsToRedeem(0);
    setPointsInput("");
  };

  const handlePlaceOrder = () => {
    if (!effectiveAddress) {
      router.push("/checkout-address");
      toast.error("Please specify your delivery address");
      return;
    }

    if (!hasContact) {
      router.push("/checkout-contact");
      toast.error("Please provide recipient contact name and phone number");
      return;
    }

    // Ensure delivery in checkout store is synced before checkout
    if (!flow.delivery?.address && effectiveAddress) {
      setDelivery({
        address: effectiveAddress,
        region: effectiveRegion,
      });
      flow.handleAddressConfirmed();
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    flow.handleOrder();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Delivery Destination Card */}
        <CheckoutDestinationCard
          effectiveAddress={effectiveAddress}
          effectiveRegion={effectiveRegion}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push("/checkout-address");
          }}
        />

        {/* 2. Recipient Contact Card */}
        <CheckoutRecipientCard
          name={flow.customer.name}
          phone={flow.customer.phone}
          email={flow.customer.email}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push("/checkout-contact");
          }}
        />

        {/* 3. Payment Method Selector */}
        <PaymentMethodSelector
          selectedMethod={flow.paymentMethod}
          onSelectMethod={flow.setPaymentMethod}
          phone={flow.customer.phone}
          onPhoneChange={(newPhone) => {
            flow.setCustomer({
              ...flow.customer,
              phone: newPhone,
            });
          }}
          defaultPhone={authCustomer?.billing?.phone || authCustomer?.shipping?.phone}
        />

        {/* 4. Medical Supplies Item Preview */}
        <CheckoutItemCard
          items={flow.cart_list}
          isExpanded={isItemsExpanded}
          onToggleExpand={() => setIsItemsExpanded((prev) => !prev)}
        />

        {/* 5. Coupons & Promotions */}
        <CheckoutCouponCard
          coupon={flow.coupon}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push("/checkout-coupons");
          }}
        />

        {/* 6. Loyalty Points Redemption */}
        <LoyaltyPointsRedemptionCard
          availablePoints={availablePoints}
          userEnteredPoints={userEnteredPoints}
          pointsDiscount={pointsDiscount}
          maxRedeemablePoints={maxRedeemablePoints}
          pointsInput={pointsInput}
          onChangePointsInput={setPointsInput}
          onApplyPoints={handleApplyPoints}
          onClearPoints={handleClearPoints}
        />

        {/* 7. Comprehensive Order Cost Breakdown */}
        <CheckoutCostBreakdownCard
          subtotal={flow.subtotal}
          vatAmount={flow.vatAmount}
          shipping={flow.shipping}
          isShippingLoading={flow.isShippingLoading}
          effectiveRegion={effectiveRegion}
          couponDiscount={couponDiscount}
          couponCode={flow.coupon?.code}
          pointsDiscount={pointsDiscount}
          userEnteredPoints={userEnteredPoints}
          finalTotal={finalTotal}
          onOpenFeeInfo={(type) => setInfoModalType(type)}
        />

        {/* 8. Terms Disclaimer */}
        <Text style={styles.termsText}>
          By placing this order, you acknowledge our{" "}
          <Text
            style={styles.termsLink}
            onPress={() => router.push("/(aux)/privacy-policy")}
          >
            terms of service & delivery policies
          </Text>
          .
        </Text>
      </ScrollView>

      {/* 9. Docked Bottom Bar */}
      <CheckoutBottomBar
        finalTotal={finalTotal}
        isFormComplete={isFormComplete}
        isPending={flow.isPending}
        bottomInset={insets.bottom}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* Auth Gate for Returning Users */}
      <AuthGateModal
        visible={flow.showAuthModal}
        onClose={flow.handleAuthModalClose}
        onSelectMode={flow.handleModeSelect}
      />

      {/* Info Fee Details BottomSheet */}
      <CostBreakdownSheet
        visible={infoModalType !== null}
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
        shippingRegion={effectiveRegion}
      />

      {/* Placing Order Processing HUD */}
      <OrderProcessingModal visible={flow.isPending} />

      {/* Order Success Celebration Modal */}
      {flow.createdOrder && (
        <OrderSuccessModal
          visible={flow.showSuccessModal}
          orderId={flow.createdOrder.id || flow.createdOrder.number || "0000"}
          totalAmount={finalTotal}
          paymentMethod={flow.paymentMethod}
          customerPhone={flow.customer.phone}
          estimatedDelivery={
            effectiveRegion.toLowerCase().includes("nairobi")
              ? "Same-Day / Next-Day"
              : "1 - 3 Business Days"
          }
          onTrackOrder={() => {
            const ordId = flow.createdOrder?.id?.toString() || "";
            flow.handleCloseSuccessModal();
            router.replace({
              pathname: "/order-tracking",
              params: { orderId: ordId },
            });
          }}
          onContinueShopping={() => {
            flow.handleCloseSuccessModal();
            router.replace("/(shop)");
          }}
        />
      )}
    </View>
  );
};

export default Checkout;

const createStyles = (colors: Colors, dark: boolean, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? "#0F172A" : "#F8FAFC",
    },
    scrollContent: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: Math.max(bottomInset, 16) + 72,
      gap: 8,
    },
    termsText: {
      fontSize: 10,
      color: colors.textSecondary || "#94A3B8",
      textAlign: "center",
      lineHeight: 14,
      paddingHorizontal: 8,
      marginTop: 1,
      marginBottom: 4,
    },
    termsLink: {
      color: colors.primary,
      textDecorationLine: "underline",
    },
  });
