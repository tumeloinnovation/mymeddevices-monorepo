from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from enum import Enum
import uuid


# ============================================================================
# ENUMS
# ============================================================================

class PaymentProvider(str, Enum):
    MPESA = "mpesa"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    CASH_ON_DELIVERY = "cash_on_delivery"


class PaymentMethodStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    AWAITING_USER_ACTION = "awaiting_user_action"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    REVERSED = "reversed"
    PROCESSING_REFUND = "processing_refund"
    REFUNDED = "refunded"


class TransactionType(str, Enum):
    PAYMENT = "payment"
    REFUND = "refund"
    REVERSAL = "reversal"
    ADJUSTMENT = "adjustment"


class RefundStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REVERSED = "reversed"


class RefundReason(str, Enum):
    CUSTOMER_REQUEST = "customer_request"
    PRODUCT_DEFECT = "product_defect"
    WRONG_ITEM = "wrong_item"
    ORDER_CANCELLED = "order_cancelled"
    DUPLICATE_PAYMENT = "duplicate_payment"
    PRICE_ADJUSTMENT = "price_adjustment"
    SERVICE_NOT_PROVIDED = "service_not_provided"
    OTHER = "other"


# ============================================================================
# PAYMENT METHOD SCHEMAS
# ============================================================================

class PaymentMethodBase(BaseModel):
    """Base payment method fields"""
    provider: PaymentProvider = PaymentProvider.MPESA
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

    is_enabled: bool = True
    is_default: bool = False
    status: PaymentMethodStatus = PaymentMethodStatus.ACTIVE

    # M-Pesa configuration
    mpesa_shortcode: Optional[str] = Field(None, max_length=20)
    mpesa_business_name: Optional[str] = Field(None, max_length=100)
    mpesa_environment: str = "simulation"  # simulation, sandbox, production

    # Fees
    fee_type: str = "percentage"
    fee_value: float = 0.0
    fee_min: float = 0.0
    fee_max: Optional[float] = None

    # Limits
    min_amount: float = 1.0
    max_amount: float = 150000.0

    # Processing
    processing_time_seconds: int = 30
    retry_count: int = 3

    # Display
    display_order: int = 0
    icon_url: Optional[str] = Field(None, max_length=500)
    display_label: Optional[str] = Field(None, max_length=100)
    provider_metadata: Optional[dict] = None


class PaymentMethodCreate(PaymentMethodBase):
    """Schema for creating a payment method"""
    pass


class PaymentMethodUpdate(BaseModel):
    """Schema for updating a payment method"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None

    is_enabled: Optional[bool] = None
    is_default: Optional[bool] = None
    status: Optional[PaymentMethodStatus] = None

    # M-Pesa configuration
    mpesa_shortcode: Optional[str] = Field(None, max_length=20)
    mpesa_business_name: Optional[str] = Field(None, max_length=100)
    mpesa_environment: Optional[str] = None

    # Fees
    fee_type: Optional[str] = None
    fee_value: Optional[float] = None
    fee_min: Optional[float] = None
    fee_max: Optional[float] = None

    # Limits
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None

    # Processing
    processing_time_seconds: Optional[int] = None
    retry_count: Optional[int] = None

    # Display
    display_order: Optional[int] = None
    icon_url: Optional[str] = Field(None, max_length=500)
    display_label: Optional[str] = Field(None, max_length=100)
    provider_metadata: Optional[dict] = None


class PaymentMethodResponse(PaymentMethodBase):
    """Payment method response"""
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentMethodListResponse(BaseModel):
    """Paginated payment methods list"""
    payment_methods: List[PaymentMethodResponse]
    total: int
    page: int
    page_size: int


# ============================================================================
# STK PUSH SCHEMAS (M-Pesa Daraja)
# ============================================================================

class STKPushRequest(BaseModel):
    """
    Request to initiate M-Pesa STK Push payment.

    This simulates the Daraja API STK Push endpoint.
    """
    phone_number: str = Field(..., description="Phone number in format 254XXXXXXXXX")
    amount: float = Field(..., gt=0, description="Amount to pay (KES)")
    account_reference: str = Field(
        ...,
        max_length=100,
        description="Reference for the transaction (e.g., order ID)"
    )
    transaction_desc: str = Field(
        ...,
        max_length=200,
        description="Transaction description shown to customer"
    )
    callback_url: Optional[str] = Field(
        None,
        max_length=500,
        description="Webhook URL for payment result"
    )
    payment_method_id: Optional[uuid.UUID] = Field(
        None,
        description="Payment method to use (defaults to M-Pesa)"
    )
    order_id: Optional[uuid.UUID] = Field(
        None,
        description="Associated order ID"
    )
    metadata: Optional[dict] = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate phone number format"""
        # Remove any spaces
        phone = v.replace(" ", "")

        # Must start with 254 and be 12 digits
        if not phone.startswith("254") or len(phone) != 12 or not phone.isdigit():
            raise ValueError("Phone number must be in format 254XXXXXXXXX (12 digits)")
        return phone


class STKPushResponse(BaseModel):
    """Response from STK Push initiation"""
    success: bool
    message: str
    data: Optional[dict] = None

    # Daraja response fields (simulated)
    merchant_request_id: Optional[str] = None
    checkout_request_id: Optional[str] = None
    response_code: Optional[str] = None
    response_description: Optional[str] = None
    customer_message: Optional[str] = None

    # Our internal tracking
    transaction_id: Optional[uuid.UUID] = None


class STKPushStatusRequest(BaseModel):
    """Request to check STK Push status"""
    merchant_request_id: str = Field(..., description="Merchant request ID from STK Push")


class STKPushStatusResponse(BaseModel):
    """STK Push status response"""
    success: bool
    status: TransactionStatus
    data: Optional[dict] = None


# ============================================================================
# TRANSACTION SCHEMAS
# ============================================================================

class TransactionCreate(BaseModel):
    """Schema for creating a transaction (internal use)"""
    payment_method_id: uuid.UUID
    order_id: Optional[uuid.UUID] = None
    vendor_id: Optional[uuid.UUID] = None
    transaction_type: TransactionType = TransactionType.PAYMENT
    amount: float = Field(..., gt=0)
    currency: str = "KES"
    phone_number: str
    metadata: Optional[dict] = None


class TransactionResponse(BaseModel):
    """Transaction response (summary)"""
    id: uuid.UUID
    payment_method_id: uuid.UUID
    payment_method_name: Optional[str] = None
    order_id: Optional[uuid.UUID] = None
    transaction_type: str
    status: str
    amount: float
    currency: str
    fee: Optional[float] = None
    total_amount: Optional[float] = None
    phone_number: str
    merchant_request_id: Optional[str] = None
    checkout_request_id: Optional[str] = None
    mpesa_receipt: Optional[str] = None
    transaction_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionDetailResponse(TransactionResponse):
    """Full transaction response with all details"""
    response_description: Optional[str] = None
    response_code: Optional[str] = None
    customer_message: Optional[str] = None
    failure_reason: Optional[str] = None
    retry_count: int
    max_retries_reached: bool
    transaction_metadata: Optional[dict] = None
    notes: Optional[str] = None

    # Related data
    payment_method: Optional[PaymentMethodResponse] = None
    refunds: List["RefundResponse"] = []

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    """Paginated transaction list"""
    transactions: List[TransactionResponse]
    total: int
    page: int
    page_size: int


# ============================================================================
# SIMPLE PAYMENT SCHEMAS (Card, Bank Transfer)
# ============================================================================

class SimpleTransactionCreate(BaseModel):
    """
    Schema for creating Card or Bank Transfer transactions directly.

    This bypasses M-Pesa STK Push flow for simple payment methods.
    Transactions created this way start as PENDING and can be manually updated.
    """
    payment_method_id: uuid.UUID = Field(
        ...,
        description="Payment method (must be card or bank_transfer)"
    )
    amount: float = Field(..., gt=0, description="Transaction amount")
    currency: str = Field(default="KES", max_length=3)
    phone_number: Optional[str] = Field(
        None,
        max_length=20,
        description="Phone number (optional for card/bank)"
    )
    order_id: Optional[uuid.UUID] = Field(
        None,
        description="Associated order ID"
    )
    vendor_id: Optional[uuid.UUID] = Field(
        None,
        description="Associated vendor ID"
    )
    metadata: Optional[dict] = Field(
        None,
        description="Additional transaction metadata"
    )
    notes: Optional[str] = Field(
        None,
        description="Admin notes"
    )


class SimpleTransactionUpdate(BaseModel):
    """
    Schema for updating Card or Bank Transfer transactions.

    Used for manual status updates (e.g., marking card payment as completed).
    """
    status: Optional[TransactionStatus] = None
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=3)
    response_description: Optional[str] = None
    response_code: Optional[str] = Field(None, max_length=10)
    customer_message: Optional[str] = None
    failure_reason: Optional[str] = None
    metadata: Optional[dict] = None
    notes: Optional[str] = None


# ============================================================================
# CALLBACK SCHEMAS
# ============================================================================

class CallbackValidation(BaseModel):
    """Callback validation result"""
    is_valid: bool
    error_message: Optional[str] = None


class CallbackRequest(BaseModel):
    """
    M-Pesa Daraja callback request format.

    This matches the real Daraja API callback structure.
    """
    Body: dict = Field(..., description="STK Callback structure")

    @field_validator("Body")
    @classmethod
    def validate_body(cls, v: dict) -> dict:
        """Validate callback body structure"""
        if "stkCallback" not in v:
            raise ValueError("Missing stkCallback in Body")
        return v


class CallbackMetadataItem(BaseModel):
    """Single metadata item from callback"""
    Key: str
    Value: Any


class STKCallback(BaseModel):
    """STK Callback structure"""
    MerchantRequestID: str
    CheckoutRequestID: str
    ResultCode: int
    ResultDesc: str
    CallbackMetadata: Optional[List[CallbackMetadataItem]] = None


# ============================================================================
# REFUND SCHEMAS
# ============================================================================

class RefundBase(BaseModel):
    """Base refund fields"""
    transaction_id: uuid.UUID
    order_id: Optional[uuid.UUID] = None
    amount: float = Field(..., gt=0)
    currency: str = "KES"
    reason: RefundReason
    reason_details: Optional[str] = None
    phone_number: str = Field(..., min_length=10, max_length=20)
    refund_metadata: Optional[dict] = None


class RefundCreate(RefundBase):
    """Schema for creating a refund"""
    pass


class RefundUpdate(BaseModel):
    """Schema for updating a refund"""
    status: Optional[RefundStatus] = None
    response_description: Optional[str] = None
    response_code: Optional[str] = None
    failure_reason: Optional[str] = None
    internal_notes: Optional[str] = None


class RefundApproval(BaseModel):
    """Schema for refund approval workflow"""
    approved: bool = Field(..., description="Whether to approve the refund")
    notes: Optional[str] = Field(None, description="Approval/rejection notes")


class RefundResponse(RefundBase):
    """Refund response"""
    id: uuid.UUID
    status: str
    refund_fee: Optional[float] = None
    net_refund: Optional[float] = None
    reversal_id: Optional[str] = None
    mpesa_receipt: Optional[str] = None

    initiated_at: datetime
    processed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    approval_notes: Optional[str] = None
    failure_reason: Optional[str] = None
    retry_count: int

    # Transaction info
    transaction_merchant_request_id: Optional[str] = None
    transaction_mpesa_receipt: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RefundListResponse(BaseModel):
    """Paginated refund list"""
    refunds: List[RefundResponse]
    total: int
    page: int
    page_size: int


# ============================================================================
# ANALYTICS SCHEMAS
# ============================================================================

class PaymentSummaryResponse(BaseModel):
    """Payment summary statistics"""
    total_transactions: int
    total_amount: float
    total_fees: float
    successful_transactions: int
    successful_amount: float
    failed_transactions: int
    pending_transactions: int
    refunded_amount: float

    # Today's stats
    today_transactions: int
    today_amount: float
    today_successful: int

    # Conversion rates
    success_rate: float  # Percentage
    average_transaction_value: float


class PaymentAnalyticsResponse(BaseModel):
    """Detailed payment analytics"""
    # Transaction trends
    daily_transactions: List[dict]
    daily_amounts: List[dict]
    daily_success_rate: List[dict]

    # Payment method breakdown
    payment_method_usage: List[dict]

    # Status breakdown
    status_breakdown: List[dict]

    # Top performing periods
    peak_hours: List[dict]

    # Recent trends (7 days vs 30 days)
    trend_7_days: dict
    trend_30_days: dict


# Forward reference resolution
TransactionDetailResponse.model_rebuild()
