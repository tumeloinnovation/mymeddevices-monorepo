
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
  vendorPayout: number;
  wholesalePrice: number;
  markupPercent: number;
  markupAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  customerPrice: number;
  sellerProfit: number;
  profitMargin: number;
}

export function calculatePlatformPricing(vendorPayout: number, wholesalePrice: number = 0): PlatformPricingResult {
  if (!vendorPayout || vendorPayout <= 0) {
    return {
      vendorPayout: 0,
      wholesalePrice: wholesalePrice || 0,
      markupPercent: 0,
      markupAmount: 0,
      commissionPercent: COMMISSION_FEE_PERCENT,
      commissionAmount: 0,
      customerPrice: wholesalePrice || 0,
      sellerProfit: wholesalePrice > 0 ? -wholesalePrice : 0,
      profitMargin: 0,
    };
  }

  const feeBase = wholesalePrice > 0 ? wholesalePrice : vendorPayout;

  let tier = PLATFORM_FEE_TIERS[PLATFORM_FEE_TIERS.length - 1];
  for (const feeTier of PLATFORM_FEE_TIERS) {
    if (feeBase <= feeTier.threshold) {
      tier = feeTier;
      break;
    }
  }

  const markupAmount = Math.round((feeBase * (tier.markupPercent / 100)) * 100) / 100;
  const commissionAmount = Math.round((feeBase * (COMMISSION_FEE_PERCENT / 100)) * 100) / 100;
  const customerPrice = Math.round((vendorPayout + markupAmount + commissionAmount) * 100) / 100;
  const sellerProfit = vendorPayout - wholesalePrice;
  const profitMargin = wholesalePrice > 0 ? Math.round(((vendorPayout - wholesalePrice) / vendorPayout) * 100) : 0;

  return {
    vendorPayout,
    wholesalePrice,
    markupPercent: tier.markupPercent,
    markupAmount,
    commissionPercent: COMMISSION_FEE_PERCENT,
    commissionAmount,
    customerPrice,
    sellerProfit,
    profitMargin,
  };
}

export function formatPricingBreakdown(pricing: PlatformPricingResult) {
  return {
    vendorPayout: pricing.vendorPayout,
    platformMarkup: pricing.markupAmount,
    platformMarkupPercent: pricing.markupPercent,
    commissionFee: pricing.commissionAmount,
    commissionFeePercent: pricing.commissionPercent,
    customerPrice: pricing.customerPrice,
  };
}
