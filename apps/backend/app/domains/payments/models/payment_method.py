"""
Payment Method and Provider Enums and Models
"""

import enum


class PaymentMethodType(str, enum.Enum):
    """Supported payment methods across the marketplace."""

    MPESA = "mpesa"
    MOBILE_MONEY = "mobile_money"
    CASH_ON_DELIVERY = "cod"
    BANK_TRANSFER = "bank_transfer"
    CARD = "card"


class PaymentProviderType(str, enum.Enum):
    """Underlying payment providers."""

    SAFARICOM = "safaricom"
    AIRTEL = "airtel"
    MTN = "mtn"
    STRIPE = "stripe"
    MANUAL = "manual"
    COD = "cod"
