import { Order } from "@/types/order";
import { orderApi } from "@/features/order/services/order.api";
import {
  CheckoutMode,
  CheckoutAddress,
  CheckoutCustomer,
  OrderLineItem,
  DeviceInfo,
} from "@/types/checkout";
import * as Application from "expo-application";
import * as Device from "expo-device";

// Constants
export const PACKAGING_FEE = 100;
export const SERVICES_FEE = 50;

interface CartItem {
  id: number;
  quantity: number;
  variation_id?: number;
}

interface CreateOrderParams {
  customerId: string | number;
  paymentMethod: string;
  customer: CheckoutCustomer;
  delivery: CheckoutAddress;
  cartItems: CartItem[];
  shipping: number;
  checkoutMode: CheckoutMode;
}

/**
 * Get device information for debugging
 */
export const getDeviceInfo = (): DeviceInfo => ({
  model: Device.modelName || "Unknown",
  os: `${Device.osName || "Unknown"} ${Device.osVersion || ""}`.trim(),
  appVersion: Application.nativeApplicationVersion || "Unknown",
  deviceType: Device.deviceType?.toString() || "Unknown",
});

/**
 * Build device info note for order
 */
export const buildDeviceNote = (): string => {
  const info = getDeviceInfo();
  return [
    `Device Model: ${info.model}`,
    `Operating System: ${info.os}`,
    `App Version: ${info.appVersion}`,
    `Device Type: ${info.deviceType}`,
  ].join("\n\n");
};

/**
 * Build line items from cart with variation support
 */
export const buildLineItems = (cartItems: CartItem[]): OrderLineItem[] =>
  cartItems.map((item) => ({
    product_id: item.id,
    quantity: item.quantity,
    ...(item.variation_id && { variation_id: item.variation_id }),
  }));

/**
 * Create order with device note - single source of truth
 */
export const createOrder = async (params: CreateOrderParams): Promise<Order> => {
  return orderApi.createOrder({
    customer_id: params.customerId,
    payment_method: params.paymentMethod,
    payment_method_title: params.paymentMethod === "cod" ? "Cash on Delivery" : "M-Pesa",
    set_paid: false,
    shipping: {
      first_name: params.customer.name.split(" ")[0] || "",
      last_name: params.customer.name.split(" ").slice(1).join(" ") || "",
      address_1: params.delivery.address,
      city: params.delivery.region || "Nairobi",
      state: params.delivery.region || "Nairobi",
      postcode: "00100",
      country: "KE",
      phone: params.customer.phone,
      company: "",
      address_2: "",
    },
    billing: {
      first_name: params.customer.name.split(" ")[0] || "",
      last_name: params.customer.name.split(" ").slice(1).join(" ") || "",
      address_1: params.delivery.address,
      city: params.delivery.region || "Nairobi",
      state: params.delivery.region || "Nairobi",
      postcode: "00100",
      country: "KE",
      phone: params.customer.phone,
      email: params.customer.email || "info@mymeddevices.com",
      company: "",
      address_2: "",
    },
    line_items: buildLineItems(params.cartItems) as any,
    note: buildDeviceNote(),
  });
};

/**
 * Initiate M-Pesa payment for an order
 */
export const initiateMpesaPayment = async (
  orderId: number | string,
  phone: string,
  amount?: number
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await orderApi.initiatePayment({
      order: orderId,
      phone,
      amount,
    });
    return { success: true, message: res?.message || "M-Pesa prompt sent" };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to initiate M-Pesa payment",
    };
  }
};

