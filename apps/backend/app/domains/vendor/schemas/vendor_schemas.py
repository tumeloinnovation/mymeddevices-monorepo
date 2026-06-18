from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime


# ============================================================================
# INITIAL REGISTRATION SCHEMAS
# ============================================================================

class VendorRegisterRequest(BaseModel):
    """Initial vendor registration with basic fields"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    company_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., pattern=r"^(\+254|0)[1-9]\d{8}$")  # Kenyan phone format
    vat_number: Optional[str] = Field(None, max_length=50)

    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)

    @field_validator('phone')
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        """Normalize phone number to +254 format"""
        if v.startswith('0'):
            return '+254' + v[1:]
        return v


# ============================================================================
# COMPREHENSIVE PROFILE SCHEMAS
# ============================================================================

class StoreInfoSchema(BaseModel):
    """Store information for vendor profile"""
    username: Optional[str] = Field(None, max_length=100)
    display_name: Optional[str] = Field(None, max_length=255)
    store_name: str = Field(..., min_length=2, max_length=255)
    store_description: Optional[str] = None
    store_logo_url: Optional[str] = None
    business_email: Optional[EmailStr] = None
    business_phone: Optional[str] = None


class AddressSchema(BaseModel):
    """Store address from Google Places"""
    street: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: str = "KE"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = None  # Google Places ID


class PaymentDetailsSchema(BaseModel):
    """Payment and payout details"""
    # M-Pesa
    mpesa_phone: Optional[str] = None
    mpesa_business_name: Optional[str] = None
    mpesa_till_number: Optional[str] = None
    mpesa_paybill_number: Optional[str] = None

    # Bank Account
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_swift_code: Optional[str] = None
    bank_iban: Optional[str] = None


class OperationalDetailsSchema(BaseModel):
    """Operational details including business hours"""
    business_hours: Optional[dict] = None  # {"monday": {"open": "09:00", "close": "17:00"}, ...}


class VendorProfileUpdate(BaseModel):
    """Comprehensive vendor profile update"""
    store_info: Optional[StoreInfoSchema] = None
    address: Optional[AddressSchema] = None
    payment_details: Optional[PaymentDetailsSchema] = None
    operational_details: Optional[OperationalDetailsSchema] = None
    document_urls: Optional[List[str]] = None  # For verification documents


class VendorProfileResponse(BaseModel):
    """Complete vendor profile response"""
    id: str
    user_id: str

    # Store Info
    username: Optional[str] = None
    display_name: Optional[str] = None
    store_name: str
    store_description: Optional[str] = None
    store_logo_url: Optional[str] = None
    business_email: Optional[str] = None
    business_phone: Optional[str] = None

    # Address
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_region: Optional[str] = None
    address_country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = None

    # Payment Details
    mpesa_phone: Optional[str] = None
    mpesa_business_name: Optional[str] = None
    mpesa_till_number: Optional[str] = None
    mpesa_paybill_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_swift_code: Optional[str] = None
    bank_iban: Optional[str] = None

    # Operational
    business_hours: Optional[dict] = None

    # Administrative
    approval_status: str
    document_urls: Optional[List[str]] = None
    company_name: Optional[str] = None
    vat_number: Optional[str] = None
    rejection_reason: Optional[str] = None
    approved_at: Optional[datetime] = None

    # User info
    user_email: str
    user_phone: Optional[str] = None
    is_verified: bool

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# ADMIN APPROVAL SCHEMAS
# ============================================================================

class VendorApprovalRequest(BaseModel):
    """Admin request to approve/reject vendor"""
    action: str = Field(..., pattern=r"^(approve|reject|suspend)$")
    reason: Optional[str] = None  # Required for rejection


class VendorStatusResponse(BaseModel):
    """Vendor status for checking approval state"""
    id: str
    approval_status: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    company_name: Optional[str] = None
    store_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    is_verified: bool
    rejection_reason: Optional[str] = None
    created_at: datetime


class VendorListResponse(BaseModel):
    """List of vendors for admin"""
    vendors: List[VendorStatusResponse]
    total: int
    page: int
    page_size: int
