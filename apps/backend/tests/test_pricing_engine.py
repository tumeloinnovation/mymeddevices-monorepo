from decimal import Decimal
import pytest

from app.domains.catalog.services.pricing_engine import PricingEngine, pricing_engine


def test_pricing_engine_exact_boundaries():
    """Verify exact boundary values, marginal markups, and zero cliff discontinuities."""
    
    # 1. Zero price
    p0 = pricing_engine.calculate_customer_price(Decimal("0.00"))
    assert p0.markup_amount == Decimal("0.00")
    assert p0.commission_amount == Decimal("0.00")
    assert p0.customer_price == Decimal("0.00")

    # 2. 1.00 KES
    p1 = pricing_engine.calculate_customer_price(Decimal("1.00"))
    assert p1.markup_amount == Decimal("0.05")  # 5%
    assert p1.commission_amount == Decimal("0.02")  # 2%
    assert p1.customer_price == Decimal("1.07")

    # 3. 1,000.00 KES
    p1k = pricing_engine.calculate_customer_price(Decimal("1000.00"))
    assert p1k.markup_amount == Decimal("50.00")
    assert p1k.commission_amount == Decimal("20.00")
    assert p1k.customer_price == Decimal("1070.00")

    # 4. 9,999.00 KES
    p9999 = pricing_engine.calculate_customer_price(Decimal("9999.00"))
    assert p9999.markup_amount == Decimal("499.95")
    assert p9999.commission_amount == Decimal("199.98")
    assert p9999.customer_price == Decimal("10698.93")

    # 5. 10,000.00 KES (Bracket 1 Top)
    p10k = pricing_engine.calculate_customer_price(Decimal("10000.00"))
    assert p10k.markup_amount == Decimal("500.00")  # 10,000 * 0.05
    assert p10k.commission_amount == Decimal("200.00")  # 10,000 * 0.02
    assert p10k.customer_price == Decimal("10700.00")

    # 6. 10,000.01 KES (Bracket 2 Bottom - Zero Cliff Test)
    p10k_01 = pricing_engine.calculate_customer_price(Decimal("10000.01"))
    # Markup = 500 + 0.01 * 0.03 = 500.00
    assert p10k_01.markup_amount == Decimal("500.00")
    assert p10k_01.commission_amount == Decimal("200.00")
    assert p10k_01.customer_price == Decimal("10700.01")
    assert p10k_01.customer_price > p10k.customer_price

    # 7. 30,000.00 KES
    p30k = pricing_engine.calculate_customer_price(Decimal("30000.00"))
    # Markup = 500 + 20,000 * 0.03 = 1,100.00
    assert p30k.markup_amount == Decimal("1100.00")
    assert p30k.commission_amount == Decimal("600.00")
    assert p30k.customer_price == Decimal("31700.00")

    # 8. 50,000.00 KES (Bracket 2 Top)
    p50k = pricing_engine.calculate_customer_price(Decimal("50000.00"))
    # Markup = 500 + 40,000 * 0.03 = 1,700.00
    assert p50k.markup_amount == Decimal("1700.00")
    assert p50k.commission_amount == Decimal("1000.00")
    assert p50k.customer_price == Decimal("52700.00")

    # 9. 50,000.01 KES (Bracket 3 Bottom - Zero Cliff Test)
    p50k_01 = pricing_engine.calculate_customer_price(Decimal("50000.01"))
    # Markup = 1,700 + 0.01 * 0.02 = 1,700.00
    assert p50k_01.markup_amount == Decimal("1700.00")
    assert p50k_01.commission_amount == Decimal("1000.00")
    assert p50k_01.customer_price == Decimal("52700.01")
    assert p50k_01.customer_price > p50k.customer_price

    # 10. 200,000.00 KES (High Value Medical Equipment)
    p200k = pricing_engine.calculate_customer_price(Decimal("200000.00"))
    # Markup = 1,700 + 150,000 * 0.02 = 4,700.00
    assert p200k.markup_amount == Decimal("4700.00")
    assert p200k.commission_amount == Decimal("4000.00")
    assert p200k.customer_price == Decimal("208700.00")


def test_pricing_engine_strict_monotonicity():
    """Verify that customer price is strictly monotonically increasing for all vendor prices."""
    prev_customer_price = Decimal("-1.00")
    
    # Test across dense price steps including boundary regions
    test_points = (
        [Decimal(str(i)) for i in range(1, 100)] +
        [Decimal("9999.00") + Decimal(str(i)) * Decimal("0.01") for i in range(200)] +
        [Decimal("49999.00") + Decimal(str(i)) * Decimal("0.01") for i in range(200)] +
        [Decimal("100000.00"), Decimal("500000.00"), Decimal("1000000.00")]
    )

    for vp in test_points:
        breakdown = pricing_engine.calculate_customer_price(vp)
        assert breakdown.customer_price > prev_customer_price, f"Monotonicity violation at vendor price {vp}"
        assert breakdown.markup_amount >= Decimal("0.00")
        assert breakdown.commission_amount >= Decimal("0.00")
        prev_customer_price = breakdown.customer_price
