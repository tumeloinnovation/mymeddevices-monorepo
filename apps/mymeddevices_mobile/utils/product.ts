import { Product } from "@/types/product";

/**
 * Format a number as Kenya Shillings currency string
 */
export const formatKsh = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
  return `Ksh.${num.toLocaleString()}`;
};

/**
 * Safely extract an attribute value by name from a product
 */
export const getProductAttribute = (
  product: Product | undefined,
  attributeName: string
): string => {
  if (!product?.attributes) return "";
  const attr = product.attributes.find(
    (a) => a.name?.toLowerCase() === attributeName.toLowerCase()
  );
  return attr ? attr.options.join(", ") : "";
};

/**
 * Calculate the percentage discount between regular and sale price
 */
export const calculateDiscountPercentage = (
  regularPrice: number | string,
  salePrice: number | string
): number | null => {
  const reg = typeof regularPrice === "string" ? parseFloat(regularPrice) : regularPrice;
  const sale = typeof salePrice === "string" ? parseFloat(salePrice) : salePrice;

  if (!reg || !sale || reg <= sale) return null;
  return Math.round(((reg - sale) / reg) * 100);
};
