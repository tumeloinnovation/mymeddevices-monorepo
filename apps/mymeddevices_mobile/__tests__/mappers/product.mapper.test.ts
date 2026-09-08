import { mapProduct } from "@/features/product/services/product.api";
import { BackendProduct } from "@/types/product";

describe("Product Mapper (mapProduct)", () => {
  it("correctly maps a standard FastAPI BackendProduct to Product model", () => {
    const backendProduct: BackendProduct = {
      id: "prod-101",
      name: "Digital Blood Pressure Monitor",
      slug: "digital-bp-monitor",
      sku: "BPM-001",
      description: "Accurate oscillometric BP monitor",
      short_description: "Compact BP monitor",
      category_id: 5,
      category_name: "Diagnostic",
      category_slug: "diagnostic",
      price: 4500,
      compare_at_price: 5000,
      currency: "KES",
      is_on_sale: true,
      in_stock: true,
      stock_quantity: 15,
      brand: "Omron",
      model_number: "M3-Comfort",
      average_rating: 4.6,
      review_count: 8,
      images: [
        {
          id: "img-1",
          url: "https://example.com/bp1.jpg",
          alt_text: "Front View",
        },
      ],
    };

    const product = mapProduct(backendProduct);

    expect(product.name).toBe("Digital Blood Pressure Monitor");
    expect(product.sku).toBe("BPM-001");
    expect(product.price).toBe("4500");
    expect(product.regular_price).toBe("5000");
    expect(product.sale_price).toBe("4500");
    expect(product.on_sale).toBe(true);
    expect(product.stock_quantity).toBe(15);
    expect(product.stock_status).toBe("instock");
    expect(product.average_rating).toBe("4.6");
    expect(product.rating_count).toBe(8);
    expect(product.categories).toEqual([
      { id: 5, name: "Diagnostic", slug: "diagnostic" },
    ]);
    expect(product.images).toHaveLength(1);
    expect(product.images[0].src).toBe("https://example.com/bp1.jpg");

    // Attributes check for Brand & Model
    const brandAttr = product.attributes.find((a) => a.name === "Brand");
    expect(brandAttr?.options).toEqual(["Omron"]);

    const modelAttr = product.attributes.find((a) => a.name === "Model");
    expect(modelAttr?.options).toEqual(["M3-Comfort"]);
  });

  it("handles fallback single image_url when images array is empty", () => {
    const backendProduct: BackendProduct = {
      id: 202,
      name: "Pulse Oximeter",
      slug: "pulse-oximeter",
      price: 1800,
      image_url: "https://example.com/oximeter.jpg",
    };

    const product = mapProduct(backendProduct);

    expect(product.images).toHaveLength(1);
    expect(product.images[0].src).toBe("https://example.com/oximeter.jpg");
  });

  it("handles out of stock products honestly without fabricated defaults", () => {
    const backendProduct: BackendProduct = {
      id: 303,
      name: "Nebulizer Kit",
      slug: "nebulizer-kit",
      price: 2500,
      in_stock: false,
      stock_quantity: 0,
      average_rating: null,
      review_count: 0,
    };

    const product = mapProduct(backendProduct);

    expect(product.stock_quantity).toBe(0);
    expect(product.stock_status).toBe("outofstock");
    expect(product.average_rating).toBe("0");
    expect(product.rating_count).toBe(0);
  });
});
