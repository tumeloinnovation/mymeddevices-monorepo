import { useCartStore } from "@/features/cart/stores/useCartStore";
import { Product } from "@/types/product";

const mockProduct: Product = {
  id: 101,
  name: "Thermometer",
  slug: "thermometer",
  permalink: "",
  status: "publish",
  description: "",
  short_description: "",
  sku: "THERM-1",
  price: "1200",
  regular_price: "1200",
  sale_price: "1200",
  date_on_sale_from_gmt: null,
  date_on_sale_to_gmt: null,
  on_sale: false,
  purchasable: true,
  total_sales: 0,
  stock_quantity: 10,
  stock_status: "instock",
  average_rating: "4.5",
  rating_count: 5,
  categories: [],
  images: [{ id: 1, src: "https://example.com/t.jpg", alt: "", date_created: "", date_created_gmt: "", date_modified: "", date_modified_gmt: "", name: "" }],
  attributes: [],
  quantity: 0,
  dimensions: { length: "", width: "", height: "" },
  related_ids: [],
};

describe("Cart Store (useCartStore)", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("adds an item to the cart and calculates quantity", () => {
    const store = useCartStore.getState();
    store.addToCart(mockProduct);

    expect(useCartStore.getState().cart_items).toBe(1);
    expect(useCartStore.getState().isInCart(101)).toBe(true);
    expect(useCartStore.getState().getProductQuantity(101)).toBe(1);
    expect(useCartStore.getState().getTotalCost()).toBe(1200);
  });

  it("increments quantity when adding same product", () => {
    const store = useCartStore.getState();
    store.addToCart(mockProduct);
    store.addToCart(mockProduct);

    expect(useCartStore.getState().cart_items).toBe(2);
    expect(useCartStore.getState().getProductQuantity(101)).toBe(2);
    expect(useCartStore.getState().getTotalCost()).toBe(2400);
  });

  it("reduces quantity and removes item when quantity reaches 0", () => {
    const store = useCartStore.getState();
    store.addToCart(mockProduct);
    store.addToCart(mockProduct);

    store.reduceFromCart(mockProduct);
    expect(useCartStore.getState().getProductQuantity(101)).toBe(1);

    store.reduceFromCart(mockProduct);
    expect(useCartStore.getState().getProductQuantity(101)).toBe(0);
    expect(useCartStore.getState().isInCart(101)).toBe(false);
  });

  it("removes product completely with removeFromCart", () => {
    const store = useCartStore.getState();
    store.addToCart(mockProduct);
    store.addToCart(mockProduct);

    store.removeFromCart(mockProduct);
    expect(useCartStore.getState().cart_items).toBe(0);
    expect(useCartStore.getState().isInCart(101)).toBe(false);
  });

  it("clears cart with clearCart", () => {
    const store = useCartStore.getState();
    store.addToCart(mockProduct);
    store.clearCart();

    expect(useCartStore.getState().cart_items).toBe(0);
    expect(useCartStore.getState().cart_list).toEqual([]);
  });
});
