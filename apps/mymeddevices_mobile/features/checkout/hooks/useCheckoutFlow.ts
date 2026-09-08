import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner-native";
import useCartStore from "@/features/cart/stores/useCartStore";
import { useAuth } from "@/context/AuthContext";
import { getShippingRates } from "@/services/shipping.api";
import { useCheckoutStore, CheckoutMode } from "@/features/checkout/stores/useCheckoutStore";
import {
  createOrder,
  initiateMpesaPayment,
  PACKAGING_FEE,
  SERVICES_FEE,
} from "@/services/order.service";
import { Order } from "@/types/order";

export const useCheckoutFlow = () => {
  const {
    mode,
    activeStep,
    isAddressConfirmed,
    delivery,
    customer,
    shipping,
    isShippingLoading,
    paymentMethod,
    coupon,
    redeemLoyaltyPoints,
    pointsToRedeem,
    setMode,
    setActiveStep,
    setAddressConfirmed,
    setCustomer,
    setShipping,
    setShippingLoading,
    setPaymentMethod,
    setCoupon,
    setRedeemLoyaltyPoints,
    setPointsToRedeem,
    clearCheckout,
  } = useCheckoutStore();

  const [isPending, setIsPending] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { cart_list, clearCart, getTotalCost } = useCartStore();
  const { isAuthenticated, user: authUser, customer: customerProfile } = useAuth();

  // Financial calculations aligned with backend CartCalculationService
  const subtotal = getTotalCost();
  
  // 16% VAT standard across medical devices/supplies (backend _compute_tax formula)
  const vatRate = 0.16;
  const vatAmount = Math.round(subtotal * vatRate);

  // Total includes Subtotal + 16% VAT + Courier Shipping + Packaging Fee (KES 100) + Service Fee (KES 50)
  const total = subtotal + vatAmount + shipping + PACKAGING_FEE + SERVICES_FEE;

  // Set mode to returning if already authenticated
  useEffect(() => {
    if (isAuthenticated && authUser && !mode) {
      setMode("returning");
    }
  }, [isAuthenticated, authUser, mode, setMode]);

  // Prefill customer info when authenticated
  useEffect(() => {
    if (isAuthenticated && customerProfile) {
      const fullName = `${customerProfile.first_name || ""} ${customerProfile.last_name || ""}`.trim();
      const phone = customerProfile.billing?.phone || customerProfile.shipping?.phone || "";
      const email = customerProfile.email;

      setCustomer({
        name: fullName || customer.name,
        phone: phone || customer.phone,
        email: email || customer.email,
      });
    } else if (isAuthenticated && authUser) {
      let fullName = `${authUser.first_name || ""} ${authUser.last_name || ""}`.trim();
      if (!fullName && authUser.display_name && !authUser.display_name.includes("@")) {
        fullName = authUser.display_name;
      }
      const phone = authUser.phone || "";

      setCustomer({
        name: fullName || customer.name,
        phone: phone || customer.phone,
        email: authUser.email || customer.email,
      });
    }
  }, [isAuthenticated, authUser, customerProfile, setCustomer]);

  // Debounced shipping calculation
  const shippingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCalculateShipping = useCallback(
    (region: string) => {
      if (shippingTimeoutRef.current) {
        clearTimeout(shippingTimeoutRef.current);
      }

      setShippingLoading(true);

      shippingTimeoutRef.current = setTimeout(async () => {
        try {
          const shippingRates = await getShippingRates(region, subtotal.toString());
          if (shippingRates && shippingRates[0]) {
            setShipping(shippingRates[0].rate);
          }
        } catch {
          toast.error("Failed to calculate shipping", {
            description: "Please try again in a moment.",
          });
        } finally {
          setShippingLoading(false);
        }
      }, 500);
    },
    [subtotal, setShipping, setShippingLoading]
  );

  useEffect(() => {
    return () => {
      if (shippingTimeoutRef.current) {
        clearTimeout(shippingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (delivery?.region) {
      handleCalculateShipping(delivery.region);
    }
  }, [delivery, handleCalculateShipping]);

  const handleModeSelect = (selectedMode: CheckoutMode) => {
    if (selectedMode === "returning") {
      setShowAuthModal(true);
    } else {
      setMode(selectedMode);
    }
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
  };

  const handleAddressConfirmed = () => {
    setAddressConfirmed(true);
    setActiveStep(1);
  };

  const handleCustomerNext = () => {
    setActiveStep(2);
  };

  const handleOrder = async () => {
    if (!delivery?.address) {
      toast.error("Please provide a valid delivery destination");
      return;
    }

    if (!customer?.name?.trim() || !customer?.phone?.trim()) {
      toast.error("Please provide recipient contact details");
      return;
    }

    setIsPending(true);

    try {
      const order = await createOrder({
        customerId: authUser?.id || 0,
        paymentMethod,
        customer,
        delivery,
        cartItems: cart_list.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          variation_id: item.variation_id,
        })),
        shipping,
        checkoutMode: mode || "guest",
      });

      setCreatedOrder(order);

      if (paymentMethod === "mpesa") {
        try {
          await initiateMpesaPayment(order.id, customer.phone);
          toast.success("Order Placed", {
            description: "Check your phone to enter M-Pesa PIN",
          });
        } catch (mpesaError: any) {
          toast.error("M-Pesa Push Failed", {
            description: mpesaError?.message || "Retry payment from order history.",
          });
        }
      } else {
        toast.success("Order Confirmed", {
          description: "Your order has been placed successfully.",
        });
      }

      // Show the post-order confirmation celebration modal
      setShowSuccessModal(true);

      // Clean cart & form inputs
      clearCart();
      clearCheckout();
    } catch (error: any) {
      toast.error("Failed to place order", {
        description: error?.message || "Please try again later.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  return {
    mode,
    activeStep,
    isAddressConfirmed,
    delivery,
    customer,
    shipping,
    isShippingLoading,
    paymentMethod,
    coupon,
    redeemLoyaltyPoints,
    pointsToRedeem,
    isPending,
    showAuthModal,
    showSuccessModal,
    createdOrder,
    cart_list,
    subtotal,
    vatAmount,
    total,
    isAuthenticated,
    setPaymentMethod,
    setActiveStep,
    setCustomer,
    setCoupon,
    setRedeemLoyaltyPoints,
    setPointsToRedeem,
    handleModeSelect,
    handleAuthModalClose,
    handleAddressConfirmed,
    handleCustomerNext,
    handleOrder,
    handleCloseSuccessModal,
  };
};
