/**
 * Centralized query keys and cache configurations
 * 
 * Cache Strategy:
 * - STATIC: Data that rarely changes (categories, product details)
 * - DYNAMIC: Data that changes frequently (orders, cart, customer)
 * - REAL_TIME: Data that should always be fresh (order status)
 */

export const CACHE_TIMES = {
  // Static data - 10 minutes stale, 30 minutes gc
  STATIC: {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
  // Semi-static data - 5 minutes stale, 15 minutes gc
  SEMI_STATIC: {
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  },
  // Dynamic data - 5 minutes stale, 10 minutes gc
  DYNAMIC: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  // Real-time data - always stale, 2 minutes gc
  REAL_TIME: {
    staleTime: 0,
    gcTime: 2 * 60 * 1000,
  },
} as const;

export const queryKeys = {
  // Products - STATIC/SEMI_STATIC
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: <T extends object>(params: T) =>
      [...queryKeys.products.lists(), params] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string | number) =>
      [...queryKeys.products.details(), id] as const,
    search: (query: string) =>
      [...queryKeys.products.all, "search", query] as const,
    onSale: () => [...queryKeys.products.all, "on-sale"] as const,
    newest: () => [...queryKeys.products.all, "newest"] as const,
  },

  // Categories - STATIC
  categories: {
    all: ["categories"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.categories.all, params] as const,
  },

  // Orders - DYNAMIC/REAL_TIME
  orders: {
    all: ["orders"] as const,
    list: <T extends object>(params?: T) =>
      [...queryKeys.orders.all, "list", params] as const,
    detail: (id: string | number) =>
      [...queryKeys.orders.all, "detail", id] as const,
    guest: (phone: string) =>
      [...queryKeys.orders.all, "guest", phone] as const,
  },

  // Customer - DYNAMIC
  customer: {
    all: ["customer"] as const,
    detail: (id: string | number) =>
      [...queryKeys.customer.all, id] as const,
  },

  // Reviews - SEMI_STATIC
  reviews: {
    all: ["reviews"] as const,
    list: (productId: string | number) =>
      [...queryKeys.reviews.all, "list", productId] as const,
  },

  // Wishlist - DYNAMIC
  wishlist: {
    all: ["wishlist"] as const,
  },

  // Cart - DYNAMIC
  cart: {
    all: ["cart"] as const,
  },

  // Backend notifications - DYNAMIC
  notifications: {
    all: ["backend-notifications"] as const,
    lists: () => [...queryKeys.notifications.all, "list"] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unread-count"] as const,
  },
} as const;
