import { create } from "zustand";
import {
  CheckoutMode,
  CheckoutAddress,
  CheckoutCustomer,
  CheckoutState,
  CheckoutCoupon,
} from "@/types/checkout";

interface CheckoutStoreState extends CheckoutState {
  isShippingLoading: boolean;
  setMode: (mode: CheckoutMode | null) => void;
  setActiveStep: (step: number) => void;
  setAddressConfirmed: (confirmed: boolean) => void;
  setDelivery: (delivery: CheckoutAddress | null) => void;
  setCustomer: (customer: CheckoutCustomer) => void;
  setShipping: (shipping: number) => void;
  setShippingLoading: (loading: boolean) => void;
  setPaymentMethod: (method: string) => void;
  setCoupon: (coupon: CheckoutCoupon | null) => void;
  setRedeemLoyaltyPoints: (redeem: boolean) => void;
  setPointsToRedeem: (points: number) => void;
  clearCheckout: () => void;
}

const initialState: CheckoutState = {
  mode: null,
  activeStep: 0,
  isAddressConfirmed: false,
  delivery: null,
  customer: { name: "", phone: "" },
  shipping: 0,
  paymentMethod: "mpesa",
  coupon: null,
  redeemLoyaltyPoints: false,
  pointsToRedeem: 0,
};

export const useCheckoutStore = create<CheckoutStoreState>((set) => ({
  ...initialState,
  isShippingLoading: false,
  setMode: (mode) => set({ mode }),
  setActiveStep: (activeStep) => set({ activeStep }),
  setAddressConfirmed: (isAddressConfirmed) => set({ isAddressConfirmed }),
  setDelivery: (delivery) => set({ delivery }),
  setCustomer: (customer) => set({ customer }),
  setShipping: (shipping) => set({ shipping }),
  setShippingLoading: (isShippingLoading) => set({ isShippingLoading }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCoupon: (coupon) => set({ coupon }),
  setRedeemLoyaltyPoints: (redeemLoyaltyPoints) => set({ redeemLoyaltyPoints }),
  setPointsToRedeem: (pointsToRedeem) => set({ pointsToRedeem }),
  clearCheckout: () => set({ ...initialState, isShippingLoading: false }),
}));

// Re-export types for convenience
export type { CheckoutAddress, CheckoutCustomer, CheckoutMode, CheckoutCoupon };
