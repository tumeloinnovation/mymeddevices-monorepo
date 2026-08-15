from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.field_types import KenyanPhone, OptionalKenyanPhone

# ============================================================================
# INITIAL REGISTRATION SCHEMAS
# ============================================================================


class VendorRegisterRequest(BaseModel):
    """Initial vendor registration with basic fields"""

    email: EmailStr
    password: str = Field(..., min_length=8)
    company_name: str = Field(..., min_length=2, max_length=255)
    phone: KenyanPhone
    vat_number: str | None = Field(None, max_length=50)

    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)


# ============================================================================
# COMPREHENSIVE PROFILE SCHEMAS
# ============================================================================


class StoreInfoSchema(BaseModel):
    """Store information for vendor profile"""

    username: str | None = Field(None, max_length=100)
    display_name: str | None = Field(None, max_length=255)
    store_name: str = Field(..., min_length=2, max_length=255)
    store_description: str | None = None
    store_logo_url: str | None = None
    business_email: EmailStr | None = None
    business_phone: OptionalKenyanPhone = None


class AddressSchema(BaseModel):
    """Store address from Google Places"""

    street: str | None = None
    city: str | None = None
    region: str | None = None
    country: str = "KE"
    latitude: float | None = None
    longitude: float | None = None
    place_id: str | None = None  # Google Places ID

    @field_validator("country")
    @classmethod
    def validate_country_code(cls, v: str) -> str:
        """Validate and normalize country code to 2-letter ISO 3166-1 alpha-2 format"""
        if not v:
            return "KE"  # Default to Kenya
        v = v.upper().strip()
        if len(v) != 2 or not v.isalpha():
            raise ValueError('country must be a valid 2-letter ISO country code (e.g., "KE", "US", "UG")')
        return v.upper()


class PaymentDetailsSchema(BaseModel):
    """Payment and payout details"""

    # M-Pesa
    mpesa_phone: str | None = None
    mpesa_business_name: str | None = None
    mpesa_till_number: str | None = None
    mpesa_paybill_number: str | None = None

    # Bank Account
    bank_account_name: str | None = None
    bank_account_number: str | None = None
    bank_name: str | None = None
    bank_branch: str | None = None
    bank_swift_code: str | None = None
    bank_iban: str | None = None


class OperationalDetailsSchema(BaseModel):
    """Operational details including business hours"""

    business_hours: dict | None = None  # {"monday": {"open": "09:00", "close": "17:00"}, ...}


class VendorProfileUpdate(BaseModel):
    """Comprehensive vendor profile update"""

    store_info: StoreInfoSchema | None = None
    address: AddressSchema | None = None
    payment_details: PaymentDetailsSchema | None = None
    operational_details: OperationalDetailsSchema | None = None
    document_urls: list[str] | None = None  # For verification documents


class VendorProfileResponse(BaseModel):
    """Complete vendor profile response"""

    id: str
    user_id: str

    # Store Info
    username: str | None = None
    display_name: str | None = None
    store_name: str
    store_description: str | None = None
    store_logo_url: str | None = None
    business_email: str | None = None
    business_phone: str | None = None

    # Address
    address_street: str | None = None
    address_city: str | None = None
    address_region: str | None = None
    address_country: str
    latitude: float | None = None
    longitude: float | None = None
    place_id: str | None = None

    # Payment Details
    mpesa_phone: str | None = None
    mpesa_business_name: str | None = None
    mpesa_till_number: str | None = None
    mpesa_paybill_number: str | None = None
    bank_account_name: str | None = None
    bank_account_number: str | None = None
    bank_name: str | None = None
    bank_branch: str | None = None
    bank_swift_code: str | None = None
    bank_iban: str | None = None

    # Operational
    business_hours: dict | None = None

    # Administrative
    approval_status: str
    document_urls: list[str] | None = None
    company_name: str | None = None
    vat_number: str | None = None
    rejection_reason: str | None = None
    approved_at: datetime | None = None

    # User info
    user_email: str
    user_phone: str | None = None
    is_verified: bool

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# ADMIN APPROVAL SCHEMAS
# ============================================================================


class VendorApprovalRequest(BaseModel):
    """Admin request to approve/reject vendor"""

    action: str = Field(..., pattern=r"^(approve|reject|suspend)$")
    reason: str | None = None  # Required for rejection


class AdminCreateVendorRequest(BaseModel):
    """Admin request to create a new vendor"""

    email: EmailStr
    password: str = Field(..., min_length=8)
    company_name: str = Field(..., min_length=2, max_length=255)
    store_name: str = Field(..., min_length=2, max_length=255)
    store_description: str | None = None
    business_email: EmailStr | None = None
    business_phone: OptionalKenyanPhone = None
    phone: OptionalKenyanPhone = None
    vat_number: str | None = Field(None, max_length=50)

    # Address
    address_street: str | None = None
    address_city: str | None = None
    address_region: str | None = None
    address_country: str = "KE"

    # Payment details (optional)
    mpesa_phone: OptionalKenyanPhone = None
    mpesa_business_name: str | None = None
    mpesa_till_number: str | None = None
    mpesa_paybill_number: str | None = None

    # Approval status (default: pending, but can be set to approved for trusted vendors)
    approval_status: str = Field("pending", pattern=r"^(pending|approved|suspended|rejected)$")
    auto_approve: bool = False  # If true, sets status to approved immediately

    @field_validator("address_country")
    @classmethod
    def validate_country_code(cls, v: str) -> str:
        """Validate and normalize country code to 2-letter ISO 3166-1 alpha-2 format"""
        if not v:
            return "KE"  # Default to Kenya
        v = v.upper().strip()
        if len(v) != 2 or not v.isalpha():
            raise ValueError('address_country must be a valid 2-letter ISO country code (e.g., "KE", "US", "UG")')
        return v.upper()


class VendorStatusResponse(BaseModel):
    """Vendor status for checking approval state"""

    id: str
    approval_status: str
    username: str | None = None
    display_name: str | None = None
    company_name: str | None = None
    store_name: str | None = None
    email: str
    phone: str | None = None
    is_verified: bool
    rejection_reason: str | None = None
    created_at: datetime


class VendorListResponse(BaseModel):
    """List of vendors for admin"""

    vendors: list[VendorStatusResponse]
    total: int
    page: int
    page_size: int
