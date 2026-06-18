/**
 * Custom metrics utility for tracking business KPIs (Mocked)
 */

export const trackProductView = (productId: number | string, productName: string) => {
  console.log(`[Metric] Product Viewed: ${productName} (ID: ${productId})`);
};

export const trackAddToCart = (productId: number | string, productName: string, price: number) => {
  console.log(`[Metric] Added to Cart: ${productName} (ID: ${productId}) at Ksh ${price}`);
};

export const trackCheckoutStarted = (cartTotal: number, itemCount: number) => {
  console.log(`[Metric] Checkout Started: ${itemCount} items, Total: Ksh ${cartTotal}`);
};

export const trackOrderPlaced = (orderId: number | string, total: number) => {
  console.log(`[Metric] Order Placed: #${orderId}, Total: Ksh ${total}`);
};

export const trackSearchQuery = (query: string, resultsCount: number, hasResults: boolean) => {
  console.log(`[Metric] Search: "${query}" - Found ${resultsCount} results (Success: ${hasResults})`);
};

export const trackWishlistAction = (productId: number | string, action: 'add' | 'remove') => {
  console.log(`[Metric] Wishlist ${action === 'add' ? 'Addition' : 'Removal'}: Product ID ${productId}`);
};

export const trackVendorAction = (vendorId: number | string, action: string) => {
  console.log(`[Metric] Vendor Action (ID: ${vendorId}): ${action}`);
};
