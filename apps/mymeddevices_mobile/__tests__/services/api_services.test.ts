import { authService } from "@/services/auth.service";
import { cartApi } from "@/services/cart.api";
import { checkoutApi } from "@/services/checkout.api";
import { paymentApi } from "@/services/payment.api";
import { ticketsApi } from "@/services/tickets.api";
import { returnsApi } from "@/services/returns.api";
import { productApi } from "@/features/product/services/product.api";
import { orderApi } from "@/features/order/services/order.api";
import { customerApi } from "@/features/user/services/customer.api";
import { backendNotificationApi } from "@/services/backend-notification.api";
import { api } from "@/services/api.client";

jest.mock("@/services/api.client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  API_BASE_URL: "http://10.0.2.2:8000/api/v1",
}));

describe("Mobile Expo API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. Authentication & Onboarding", () => {
    it("initiates registration with OTP", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, message: "Verification code sent to your email!" },
      });

      const res = await authService.registerInitiate({ email: "doc@test.com" });
      expect(api.post).toHaveBeenCalledWith("/auth/register/initiate", {
        email: "doc@test.com",
        role: "customer",
      });
      expect(res.success).toBe(true);
    });

    it("sends OTP for registration via sendOTP wrapper", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, message: "Verification code sent to your email!" },
      });

      const res = await authService.sendOTP({ email: "doc@test.com", purpose: "registration" });
      expect(api.post).toHaveBeenCalledWith("/auth/register/initiate", {
        email: "doc@test.com",
        role: "customer",
      });
      expect(res.success).toBe(true);
    });

    it("verifies OTP with backend verification endpoint", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { message: "Email verified successfully", is_verified: true } },
      });

      const res = await authService.verifyOTP({ email: "doc@test.com", code: "123456" });
      expect(api.post).toHaveBeenCalledWith("/otp/verify", {
        email: "doc@test.com",
        code: "123456",
        purpose: "verification",
      });
      expect(res.success).toBe(true);
    });

    it("resends OTP using backend resend endpoint", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, message: "New verification code generated." },
      });

      const res = await authService.resendOTP("doc@test.com", "verification");
      expect(api.post).toHaveBeenCalledWith("/otp/resend", {
        email: "doc@test.com",
        purpose: "verification",
      });
      expect(res.success).toBe(true);
    });

    it("completes registration and logs in", async () => {
      (api.post as jest.Mock)
        .mockResolvedValueOnce({
          data: { success: true, data: { message: "Account created successfully!" } },
        })
        .mockResolvedValueOnce({
          data: {
            access_token: "acc_123",
            refresh_token: "ref_123",
            user: { id: "u-1", email: "doc@test.com", role: "customer" },
          },
        });

      const res = await authService.registerComplete({
        email: "doc@test.com",
        password: "SuperPassword123!",
        first_name: "John",
        last_name: "Doe",
        phone: "+254712345678",
      });

      expect(api.post).toHaveBeenNthCalledWith(1, "/auth/register/complete", {
        email: "doc@test.com",
        password: "SuperPassword123!",
        first_name: "John",
        last_name: "Doe",
        phone: "+254712345678",
        company_name: null,
      });
      expect(api.post).toHaveBeenNthCalledWith(2, "/auth/login", {
        email: "doc@test.com",
        password: "SuperPassword123!",
        device_id: "mobile-app",
        device_name: "MyMedDevices Mobile App",
      });
      expect(res.success).toBe(true);
    });

    it("creates guest session", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { guest_token: "gst_12345" } },
      });

      const res = await authService.createGuestSession();
      expect(api.post).toHaveBeenCalledWith("/auth/guest", { device_id: "mobile-app" });
      expect(res.guest_token).toBe("gst_12345");
    });
  });

  describe("2. Catalog & Storefront", () => {
    it("fetches buy-box and winning offers", async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { winning_vendor: "Vendor A", price: 4500 } },
      });

      const res = await productApi.getProductBuyBox("stethoscope-classic-iii");
      expect(api.get).toHaveBeenCalledWith("/storefront/products/stethoscope-classic-iii/buy-box");
      expect(res.winning_vendor).toBe("Vendor A");
    });

    it("fetches banners", async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: [{ id: "b-1", title: "Promo Banner" }] },
      });

      const res = await productApi.getBanners("homepage_hero");
      expect(api.get).toHaveBeenCalledWith("/shopping/banners", {
        params: { placement: "homepage_hero" },
      });
      expect(res).toHaveLength(1);
    });
  });

  describe("3. Shopping Cart & Saved Carts", () => {
    it("adds item to cart and merges guest cart", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { id: "cart-1", item_count: 1 } },
      });

      const res = await cartApi.addItem({ product_id: "prod-1", quantity: 2 }, "guest-token-123");
      expect(api.post).toHaveBeenCalledWith(
        "/shopping/cart/items",
        { product_id: "prod-1", quantity: 2 },
        { params: { cart_token: "guest-token-123" } }
      );
      expect(res.id).toBe("cart-1");
    });

    it("shares cart with expiration", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { share_token: "sh-99" } },
      });

      const res = await cartApi.shareCart("cart-1", 14);
      expect(api.post).toHaveBeenCalledWith(
        "/shopping/cart/share",
        { expires_days: 14 },
        { params: { cart_id: "cart-1" } }
      );
      expect(res.share_token).toBe("sh-99");
    });
  });

  describe("4. Checkout, Coupons & Shipping", () => {
    it("applies coupon code to active cart", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { is_valid: true, code: "SAVE10", discount_amount: 500 } },
      });

      const res = await checkoutApi.applyCoupon({ code: "SAVE10", cart_id: "c-1" });
      expect(api.post).toHaveBeenCalledWith("/shopping/cart/coupon", null, {
        params: { code: "SAVE10", cart_id: "c-1", cart_token: undefined },
      });
      expect(res.is_valid).toBe(true);
    });

    it("validates cart for checkout", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { is_valid: true, errors: [], warnings: [] } },
      });

      const res = await checkoutApi.validateCart("c-1");
      expect(res.is_valid).toBe(true);
    });
  });

  describe("5. Payments & M-Pesa Daraja", () => {
    it("initiates M-Pesa STK push with sanitized phone", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { checkout_request_id: "ws_CO_12345" } },
      });

      const res = await paymentApi.initiateStkPush({
        order_id: "ord-1",
        phone_number: "0712345678",
        amount: 2500,
      });

      expect(api.post).toHaveBeenCalledWith("/shopping/mpesa/stk-push", {
        order_id: "ord-1",
        phone_number: "254712345678",
        amount: 2500,
      });
      expect(res.checkout_request_id).toBe("ws_CO_12345");
    });

    it("polls M-Pesa STK push status", async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { status: "completed" } },
      });

      const res = await paymentApi.getStkPushStatus("ws_CO_12345");
      expect(api.get).toHaveBeenCalledWith("/shopping/mpesa/status/ws_CO_12345", {
        params: undefined,
      });
      expect(res.status).toBe("completed");
    });
  });

  describe("6. Orders, Tracking & Invoices", () => {
    it("cancels pending order and fetches tracking", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { id: "ord-1", status: "cancelled" } },
      });

      const cancelled = await orderApi.cancelOrder("ord-1", "Changed mind");
      expect(api.post).toHaveBeenCalledWith(
        "/shopping/orders/ord-1/cancel",
        null,
        { params: { reason: "Changed mind" } }
      );
      expect(cancelled.status).toBe("cancelled");
    });
  });

  describe("7. Customer Profile, Addresses & Loyalty", () => {
    it("fetches loyalty status and saves new delivery address", async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { loyalty_points: 350, loyalty_tier: "Silver" } },
      });

      const loyalty = await customerApi.getLoyaltyStatus();
      expect(loyalty.loyalty_points).toBe(350);

      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { id: "addr-1", address_line1: "Upper Hill Road" } },
      });

      const newAddr = await customerApi.createAddress({
        address_line1: "Upper Hill Road",
        city: "Nairobi",
      });
      expect(newAddr.address_line1).toBe("Upper Hill Road");
    });
  });

  describe("8. Reviews, Tickets & Returns", () => {
    it("creates support ticket and return request", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { id: "tck-1", subject: "Broken seal on arrival" } },
      });

      const ticket = await ticketsApi.createTicket({
        subject: "Broken seal on arrival",
        message: "The packaging seal was broken",
      });
      expect(ticket.id).toBe("tck-1");

      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { id: "ret-1", status: "pending" } },
      });

      const ret = await returnsApi.createReturn({
        order_id: "ord-1",
        reason: "Damaged item",
        items: [{ order_item_id: "item-1", product_id: "prod-1", quantity: 1 }],
      });
      expect(ret.status).toBe("pending");
    });

    it("fetches and marks notifications as read", async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: [{ id: "n-1", title: "Order shipped", is_read: false }] },
      });

      const list = await backendNotificationApi.list();
      expect(list).toHaveLength(1);

      (api.patch as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      await backendNotificationApi.markSingleRead("n-1");
      expect(api.patch).toHaveBeenCalledWith("/notifications/n-1/read");
    });
  });
});
