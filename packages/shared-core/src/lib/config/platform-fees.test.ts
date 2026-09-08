import { describe, it, expect } from 'vitest';
import {
  calculatePlatformPricing,
  calculateFromRetailPrice,
  formatPricingBreakdown,
  COMMISSION_FEE_PERCENT,
} from './platform-fees';

describe('platform-fees (Medical Device Platform Pricing Calculator)', () => {
  it('1. handles 0 or negative base prices gracefully without NaN or negative fee calculations', () => {
    const zeroPricing = calculatePlatformPricing(0);
    expect(zeroPricing.customerPrice).toBe(0);
    expect(zeroPricing.markupAmount).toBe(0);
    expect(zeroPricing.commissionAmount).toBe(0);

    const negativePricing = calculatePlatformPricing(-500);
    expect(negativePricing.customerPrice).toBe(0);
    expect(negativePricing.markupAmount).toBe(0);
  });

  it('2. applies 5.0% tier markup + 2.0% commission fee for basePrice <= 10,000 KES', () => {
    const basePrice = 5000;
    const pricing = calculatePlatformPricing(basePrice, 3500);

    expect(pricing.markupPercent).toBe(5.0);
    expect(pricing.markupAmount).toBe(250); // 5% of 5000
    expect(pricing.commissionPercent).toBe(COMMISSION_FEE_PERCENT);
    expect(pricing.commissionAmount).toBe(100); // 2% of 5000
    expect(pricing.customerPrice).toBe(5350); // 5000 + 250 + 100
    expect(pricing.sellerProfit).toBe(1500); // 5000 - 3500
    expect(pricing.profitMargin).toBe(30); // (1500 / 5000) * 100
  });

  it('3. applies 3.0% tier markup + 2.0% commission fee for basePrice between 10,001 and 50,000 KES', () => {
    const basePrice = 20000;
    const pricing = calculatePlatformPricing(basePrice, 16000);

    expect(pricing.markupPercent).toBe(3.0);
    expect(pricing.markupAmount).toBe(600); // 3% of 20000
    expect(pricing.commissionAmount).toBe(400); // 2% of 20000
    expect(pricing.customerPrice).toBe(21000); // 20000 + 600 + 400
    expect(pricing.sellerProfit).toBe(4000);
  });

  it('4. applies 2.0% tier markup + 2.0% commission fee for basePrice > 50,000 KES', () => {
    const basePrice = 100000;
    const pricing = calculatePlatformPricing(basePrice, 80000);

    expect(pricing.markupPercent).toBe(2.0);
    expect(pricing.markupAmount).toBe(2000); // 2% of 100000
    expect(pricing.commissionAmount).toBe(2000); // 2% of 100000
    expect(pricing.customerPrice).toBe(104000); // 100000 + 2000 + 2000
    expect(pricing.sellerProfit).toBe(20000);
  });

  it('5. reverse-calculates basePrice accurately from customer retail price', () => {
    const retailPrice = 5350;
    const reversePricing = calculateFromRetailPrice(retailPrice);

    expect(reversePricing.basePrice).toBe(5000);
    expect(reversePricing.customerPrice).toBe(5350);
  });

  it('6. formats pricing breakdown structure for API / UI display', () => {
    const pricing = calculatePlatformPricing(10000);
    const formatted = formatPricingBreakdown(pricing);

    expect(formatted).toEqual({
      basePrice: 10000,
      platformMarkup: 500,
      platformMarkupPercent: 5.0,
      commissionFee: 200,
      commissionFeePercent: 2.0,
      customerPrice: 10700,
    });
  });
});
