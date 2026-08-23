from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP


@dataclass(frozen=True)
class PricingBreakdown:
    vendor_price: Decimal
    markup_amount: Decimal
    commission_amount: Decimal
    customer_price: Decimal
    pricing_rule_version: str = "v1.0"

    @property
    def effective_markup_rate(self) -> Decimal:
        """Effective markup percentage as a decimal."""
        if self.vendor_price <= 0:
            return Decimal("0.00")
        return (self.markup_amount / self.vendor_price).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

    @property
    def total_fee_amount(self) -> Decimal:
        """Total platform fee (markup + commission)."""
        return self.markup_amount + self.commission_amount


class PricingEngine:
    """
    Authoritative stateless progressive pricing calculation engine for MyMedDevices.
    
    Principles:
    - Pure Decimal arithmetic with 2 decimal place financial precision (ROUND_HALF_UP).
    - Continuous progressive marginal markup brackets (zero cliff inversions).
    - Platform commission: 2% of vendor price.
    - Strictly monotonically increasing customer price function.
    """

    VERSION: str = "v1.0"

    # Marginal Markup Brackets
    BRACKET_1_LIMIT: Decimal = Decimal("10000.00")
    BRACKET_1_RATE: Decimal = Decimal("0.05")  # 5% on [0, 10,000]

    BRACKET_2_LIMIT: Decimal = Decimal("50000.00")
    BRACKET_2_RATE: Decimal = Decimal("0.03")  # 3% on (10,000, 50,000]
    BRACKET_1_MAX_MARKUP: Decimal = Decimal("500.00")  # 10,000 * 0.05

    BRACKET_3_RATE: Decimal = Decimal("0.02")  # 2% on (50,000, inf)
    BRACKET_2_MAX_MARKUP: Decimal = Decimal("1700.00")  # 500 + 40,000 * 0.03

    COMMISSION_RATE: Decimal = Decimal("0.02")  # 2% constant across all price levels

    @classmethod
    def calculate_markup(cls, vendor_price: Decimal) -> Decimal:
        """
        Calculate continuous progressive marginal markup.
        
        Formula:
        - If Pv <= 10,000: Pv * 0.05
        - If 10,000 < Pv <= 50,000: 500 + (Pv - 10,000) * 0.03
        - If Pv > 50,000: 1,700 + (Pv - 50,000) * 0.02
        """
        if vendor_price <= Decimal("0.00"):
            return Decimal("0.00")

        if vendor_price <= cls.BRACKET_1_LIMIT:
            markup = vendor_price * cls.BRACKET_1_RATE
        elif vendor_price <= cls.BRACKET_2_LIMIT:
            markup = cls.BRACKET_1_MAX_MARKUP + (vendor_price - cls.BRACKET_1_LIMIT) * cls.BRACKET_2_RATE
        else:
            markup = cls.BRACKET_2_MAX_MARKUP + (vendor_price - cls.BRACKET_2_LIMIT) * cls.BRACKET_3_RATE

        return markup.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @classmethod
    def calculate_commission(cls, vendor_price: Decimal) -> Decimal:
        """
        Calculate platform commission (2% across all price levels).
        """
        if vendor_price <= Decimal("0.00"):
            return Decimal("0.00")
        commission = vendor_price * cls.COMMISSION_RATE
        return commission.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @classmethod
    def calculate_customer_price(cls, vendor_price: Decimal | float | str | int) -> PricingBreakdown:
        """
        Calculate authoritative customer pricing breakdown from vendor payout price.
        """
        if not isinstance(vendor_price, Decimal):
            vendor_price = Decimal(str(vendor_price))

        pv = vendor_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        markup = cls.calculate_markup(pv)
        commission = cls.calculate_commission(pv)
        customer_price = pv + markup + commission

        return PricingBreakdown(
            vendor_price=pv,
            markup_amount=markup,
            commission_amount=commission,
            customer_price=customer_price,
            pricing_rule_version=cls.VERSION,
        )


# Global singleton instance
pricing_engine = PricingEngine()
