import {
  formatKsh,
  getProductAttribute,
  calculateDiscountPercentage,
} from "@/utils/product";
import { Product } from "@/types/product";

describe("Product Utilities", () => {
  describe("formatKsh", () => {
    it("formats numbers and numeric strings as Kenya Shillings", () => {
      expect(formatKsh(5000)).toBe("Ksh.5,000");
      expect(formatKsh("12500")).toBe("Ksh.12,500");
      expect(formatKsh(0)).toBe("Ksh.0");
    });
  });

  describe("getProductAttribute", () => {
    const product: Product = {
      id: 1,
      name: "Nebulizer",
      slug: "nebulizer",
      permalink: "",
      status: "publish",
      description: "",
      short_description: "",
      sku: "NEB-1",
      price: "3500",
      regular_price: "3500",
      sale_price: "3500",
      date_on_sale_from_gmt: null,
      date_on_sale_to_gmt: null,
      on_sale: false,
      purchasable: true,
      total_sales: 0,
      stock_quantity: 5,
      stock_status: "instock",
      average_rating: "0",
      rating_count: 0,
      categories: [],
      images: [],
      attributes: [
        { id: 1, name: "Brand", options: ["Philips"] },
        { id: 2, name: "Model", options: ["InnoSpire"] },
      ],
      quantity: 0,
      dimensions: { length: "", width: "", height: "" },
      related_ids: [],
    };

    it("extracts attribute case-insensitively", () => {
      expect(getProductAttribute(product, "brand")).toBe("Philips");
      expect(getProductAttribute(product, "BRAND")).toBe("Philips");
      expect(getProductAttribute(product, "model")).toBe("InnoSpire");
      expect(getProductAttribute(product, "Warranty")).toBe("");
    });

    it("returns empty string when product or attributes are undefined", () => {
      expect(getProductAttribute(undefined, "brand")).toBe("");
    });
  });

  describe("calculateDiscountPercentage", () => {
    it("calculates percentage discount accurately", () => {
      expect(calculateDiscountPercentage(10000, 8000)).toBe(20);
      expect(calculateDiscountPercentage("5000", "4000")).toBe(20);
    });

    it("returns null when regular price <= sale price or invalid", () => {
      expect(calculateDiscountPercentage(5000, 5000)).toBeNull();
      expect(calculateDiscountPercentage(4000, 5000)).toBeNull();
      expect(calculateDiscountPercentage(0, 0)).toBeNull();
    });
  });
});
