import { mapBackendOrder } from "@/features/order/services/order.mapper";
import { BackendOrder } from "@/types/order";

describe("Order Mapper (mapBackendOrder)", () => {
  it("correctly maps a FastAPI BackendOrder with items and totals", () => {
    const backendOrder: BackendOrder = {
      id: "ord-999",
      order_number: 1042,
      user_id: "user-1",
      status: "processing",
      total_amount: 9500,
      shipping_amount: 350,
      discount_amount: 500,
      currency: "KES",
      created_at: "2026-08-29T10:00:00Z",
      updated_at: "2026-08-29T10:30:00Z",
      shipping_address: {
        first_name: "Alice",
        last_name: "Mwangi",
        phone: "+254700000000",
        address: "Upper Hill Road",
        city: "Nairobi",
        state: "Nairobi",
      },
      items: [
        {
          id: "item-1",
          order_id: "ord-999",
          product_id: "prod-1",
          product_name: "Stethoscope Classic III",
          quantity: 2,
          unit_price: 4500,
          subtotal: 9000,
          product: {
            id: "prod-1",
            name: "Stethoscope Classic III",
            sku: "STETH-3",
            image_url: "https://example.com/steth.jpg",
          },
        },
      ],
    };

    const order = mapBackendOrder(backendOrder);

    expect(order.id).toBe(1042);
    expect(order.status).toBe("processing");
    expect(order.total).toBe("9500");
    expect(order.shipping_total).toBe("350");
    expect(order.discount_total).toBe("500");
    expect(order.currency).toBe("KES");
    expect(order.billing.first_name).toBe("Alice");
    expect(order.billing.phone).toBe("+254700000000");

    // Line items
    expect(order.line_items).toHaveLength(1);
    expect(order.line_items[0].name).toBe("Stethoscope Classic III");
    expect(order.line_items[0].quantity).toBe(2);
    expect(order.line_items[0].price).toBe(4500);
    expect(order.line_items[0].total).toBe("9000");
    expect(order.line_items[0].sku).toBe("STETH-3");
    expect(order.line_items[0].image.src).toBe("https://example.com/steth.jpg");
  });

  it("handles empty and default fields gracefully", () => {
    const emptyOrder = mapBackendOrder({});
    expect(emptyOrder.id).toBe(1);
    expect(emptyOrder.status).toBe("pending");
    expect(emptyOrder.currency).toBe("KES");
    expect(emptyOrder.billing.city).toBe("Nairobi");
    expect(emptyOrder.shipping.city).toBe("Nairobi");
    expect(emptyOrder.line_items).toEqual([]);
  });
});

