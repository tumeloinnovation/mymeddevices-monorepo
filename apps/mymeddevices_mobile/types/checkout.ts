import { Billing, Shipping } from "./user";

export type CheckoutMode = "guest" | "new_account" | "returning";

export interface CheckoutAddress {
  address: string;
  lat?: number;
  lon?: number;
  region?: string;
}

export interface CheckoutCustomer {
  name: string;
  phone: string;
  email?: string;
}

export interface CheckoutCoupon {
  code: string;
  discount: number;
  title: string;
}

export interface CheckoutState {
  mode: CheckoutMode | null;
  activeStep: number;
  isAddressConfirmed: boolean;
  delivery: CheckoutAddress | null;
  customer: CheckoutCustomer;
  shipping: number;
  paymentMethod: string;
  coupon: CheckoutCoupon | null;
  redeemLoyaltyPoints: boolean;
  pointsToRedeem: number;
}

export interface OrderLineItem {
  product_id: number;
  quantity: number;
  variation_id?: number;
}

export interface OrderShippingLine {
  method_id: string;
  method_title: string;
  total: string;
}

export interface OrderFeeLine {
  name: string;
  total: string;
  tax_class?: string;
  tax_status?: "taxable" | "none";
}

export interface OrderMetaData {
  key: string;
  value: string;
}

export interface CreateOrderPayload {
  customer_id: number | string;
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing: Billing;
  shipping: Shipping;
  line_items: OrderLineItem[];
  shipping_lines?: OrderShippingLine[];
  fee_lines?: OrderFeeLine[];
  meta_data?: OrderMetaData[];
  note?: string;
}

export interface DeviceInfo {
  model: string;
  os: string;
  appVersion: string;
  deviceType: string;
}
