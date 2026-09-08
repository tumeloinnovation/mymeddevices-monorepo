
export interface PlatformFeeTier {
  threshold: number;
  markupPercent: number;
}

export const PLATFORM_FEE_TIERS: PlatformFeeTier[] = [
  { threshold: 0, markupPercent: 5.0 },
  { threshold: 10000, markupPercent: 3.0 },
  { threshold: 50000, markupPercent: 2.0 },
];

export const COMMISSION_FEE_PERCENT = 2.0;

export interface PlatformPricingResult {
  basePrice: number;
  costPrice: number;
  markupPercent: number;
  markupAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  customerPrice: number;
  sellerProfit: number;
  profitMargin: number;
}

export function calculatePlatformPricing(basePrice: number, costPrice: number = 0): PlatformPricingResult {
  if (!basePrice || basePrice <= 0) {
    return {
      basePrice: 0,
      costPrice: costPrice || 0,
      markupPercent: 0,
      markupAmount: 0,
      commissionPercent: COMMISSION_FEE_PERCENT,
      commissionAmount: 0,
      customerPrice: costPrice || 0,
      sellerProfit: costPrice > 0 ? -costPrice : 0,
      profitMargin: 0,
    };
  }

  let markupPercent = 2.0;
  if (basePrice <= 10000) {
    markupPercent = 5.0;
  } else if (basePrice <= 50000) {
    markupPercent = 3.0;
  }

  const markupAmount = Math.round((basePrice * (markupPercent / 100)) * 100) / 100;
  const commissionAmount = Math.round((basePrice * (COMMISSION_FEE_PERCENT / 100)) * 100) / 100;
  const customerPrice = Math.round((basePrice + markupAmount + commissionAmount) * 100) / 100;
  const sellerProfit = basePrice - costPrice;
  const profitMargin = costPrice > 0 ? Math.round(((basePrice - costPrice) / basePrice) * 100) : 0;

  return {
    basePrice,
    costPrice,
    markupPercent,
    markupAmount,
    commissionPercent: COMMISSION_FEE_PERCENT,
    commissionAmount,
    customerPrice,
    sellerProfit,
    profitMargin,
  };
}

export function calculateFromRetailPrice(price: number, costPrice: number = 0): PlatformPricingResult {
  if (!price || price <= 0) {
    return calculatePlatformPricing(0, costPrice);
  }

  let markupPercent = 2.0;
  if (price <= 10700) {
    markupPercent = 5.0;
  } else if (price <= 52500) {
    markupPercent = 3.0;
  }

  const totalMultiplier = 1 + (markupPercent + COMMISSION_FEE_PERCENT) / 100;
  const basePrice = Math.round((price / totalMultiplier) * 100) / 100;
  return calculatePlatformPricing(basePrice, costPrice);
}

export function formatPricingBreakdown(pricing: PlatformPricingResult) {
  return {
    basePrice: pricing.basePrice,
    platformMarkup: pricing.markupAmount,
    platformMarkupPercent: pricing.markupPercent,
    commissionFee: pricing.commissionAmount,
    commissionFeePercent: pricing.commissionPercent,
    customerPrice: pricing.customerPrice,
  };
}
