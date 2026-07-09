from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import uuid
from app.core.password_validation import validate_password_field

class UserBase(BaseModel):
    email: Optional[EmailStr] = Field(None, description="User's registered email address (Optional for guest sessions)", json_schema_extra={"example": "user@example.com"})
    role: str = Field("customer", description="The role assigned to the user: admin, worker, vendor, customer, guest", json_schema_extra={"example": "customer"})
    firstName: Optional[str] = Field(None, alias="first_name", description="User's given first name", json_schema_extra={"example": "Jane"})
    lastName: Optional[str] = Field(None, alias="last_name", description="User's surname or family name", json_schema_extra={"example": "Doe"})
    phone: Optional[str] = Field(None, description="User's telephone number", json_schema_extra={"example": "+254712345678"})

    class Config:
        populate_by_name = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="User's secure password (min 8 characters)", json_schema_extra={"example": "SuperSecurePass123!"})

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        validate_password_field(v)
        return v

class VendorUserCreate(BaseModel):
    """Vendor-specific registration with additional fields"""
    email: EmailStr = Field(..., description="Vendor corporate email address", json_schema_extra={"example": "sales@medicalsupplies.co.ke"})
    password: str = Field(..., min_length=8, description="Secure vendor account password", json_schema_extra={"example": "VendorPass2026!"})
    company_name: str = Field(..., min_length=2, max_length=255, description="Registered legal name of the medical device company", json_schema_extra={"example": "MedTech Kenya Ltd"})
    phone: str = Field(..., description="Kenyan corporate phone number", json_schema_extra={"example": "0712345678"})
    vat_number: Optional[str] = Field(None, max_length=50, description="Optional corporate VAT or Tax PIN", json_schema_extra={"example": "P051234567Z"})
    first_name: Optional[str] = Field(None, max_length=100, description="Vendor representative first name", json_schema_extra={"example": "Peter"})
    last_name: Optional[str] = Field(None, max_length=100, description="Vendor representative last name", json_schema_extra={"example": "Mwangi"})
    address_street: str = Field("Nairobi", description="Vendor physical street address", json_schema_extra={"example": "123 Main Street"})
    latitude: float = Field(-1.3011758537859464, description="Vendor latitude coordinate", json_schema_extra={"example": -1.30117})
    longitude: float = Field(36.800690681948126, description="Vendor longitude coordinate", json_schema_extra={"example": 36.80069})
    place_id: Optional[str] = Field(None, description="Google Places ID", json_schema_extra={"example": "ChIJbU59A..."})

    @field_validator('phone')
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        """Normalize phone number to +254 format"""
        if v.startswith('0'):
            return '+254' + v[1:]
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        validate_password_field(v)
        return v

class UserResponse(UserBase):
    id: uuid.UUID = Field(..., description="Unique user identifier (UUID)")
    is_active: bool = Field(True, description="Indicates if the user account is active")
    is_verified: bool = Field(False, description="Indicates if the user's email has been verified via OTP")
    is_vendor_verified: bool = Field(False, description="Indicates if vendor account is approved")

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str = Field(..., description="Stateless JWT access token")
    refresh_token: str = Field(..., description="Secure random stateful refresh token")
    token_type: str = Field("bearer", description="Authentication token scheme type")
    expires_in: int = Field(1800, description="Access token lifetime in seconds")
    user: UserResponse = Field(..., description="The authenticated user profile details")

class LoginResponse(Token):
    message: Optional[str] = Field(None, description="Welcome message for the user")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User's registered email address", json_schema_extra={"example": "user@example.com"})
    password: str = Field(..., description="User's secure password", json_schema_extra={"example": "SuperSecurePass123!"})
    device_id: str = Field(..., description="Unique client device fingerprint or identifier", json_schema_extra={"example": "chrome-macos-session-99"})
    device_name: Optional[str] = Field(None, description="Friendly name of the login device", json_schema_extra={"example": "My Macbook Pro"})
    remember_me: Optional[bool] = Field(False, description="Extend session duration (extends refresh token expiration)")

class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., description="Active stateful refresh token used to request a new access token", json_schema_extra={"example": "y7F8qR4t1v..."})

class OTPLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User's registered email address", json_schema_extra={"example": "user@example.com"})
    code: str = Field(..., description="6-digit verification code sent via email/SMS", json_schema_extra={"example": "123456"})
    device_id: str = Field(..., description="Unique client device fingerprint or identifier", json_schema_extra={"example": "chrome-macos-session-99"})
    device_name: Optional[str] = Field(None, description="Friendly name of the login device", json_schema_extra={"example": "My Macbook Pro"})

class GuestLoginRequest(BaseModel):
    """Request to create a guest session"""
    device_id: str = Field(..., description="Unique client device fingerprint or identifier", json_schema_extra={"example": "guest-browser-uuid"})
    device_name: Optional[str] = Field(None, description="Friendly name of the guest device", json_schema_extra={"example": "Chrome Guest"})

class ChangePasswordRequest(BaseModel):
    """Request to change password"""
    old_password: str = Field(..., description="User's current password for confirmation", json_schema_extra={"example": "SuperSecurePass123!"})
    new_password: str = Field(..., min_length=8, description="User's new secure password (must satisfy complexity checks)", json_schema_extra={"example": "NewSuperSecurePass456!"})

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        validate_password_field(v)
        return v

class ChangeEmailRequest(BaseModel):
    """Request to change email address"""
    new_email: EmailStr = Field(..., description="The new email address to change to", json_schema_extra={"example": "newemail@example.com"})
    password: str = Field(..., description="User's current password for verification", json_schema_extra={"example": "SuperSecurePass123!"})

class ConfirmEmailChangeRequest(BaseModel):
    """Confirm email change with OTP"""
    new_email: EmailStr = Field(..., description="The new email address being confirmed", json_schema_extra={"example": "newemail@example.com"})
    otp_code: str = Field(..., description="6-digit verification code sent to the new email address", json_schema_extra={"example": "654321"})

class DeleteAccountRequest(BaseModel):
    """Request to delete account"""
    password: str = Field(..., description="User's current password for verification", json_schema_extra={"example": "SuperSecurePass123!"})
    confirm: bool = Field(..., description="Must be explicitly set to true to confirm account deletion", json_schema_extra={"example": True})

class ForgotPasswordRequest(BaseModel):
    """Request to initiate password reset"""
    email: EmailStr = Field(..., description="User's registered email address", json_schema_extra={"example": "user@example.com"})

class ResetPasswordRequest(BaseModel):
    """Request to complete password reset with OTP"""
    email: EmailStr = Field(..., description="User's registered email address", json_schema_extra={"example": "user@example.com"})
    code: str = Field(..., description="6-digit reset code sent via email", json_schema_extra={"example": "135246"})
    new_password: str = Field(..., min_length=8, description="New secure password", json_schema_extra={"example": "NewPassword2026!"})

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        validate_password_field(v)
        return v

class UserRegisterResponse(BaseModel):
    id: str = Field(..., description="UUID of the newly created user")
    email: EmailStr = Field(..., description="Registered email address")
    role: str = Field(..., description="Assigned user role")
    first_name: Optional[str] = Field(None, description="Given first name")
    last_name: Optional[str] = Field(None, description="Given last name")
    phone: Optional[str] = Field(None, description="Registered phone number")
    is_active: bool = Field(..., description="Account active status")
    is_verified: bool = Field(..., description="Account verification status")

class VendorRegisterResponse(BaseModel):
    id: str = Field(..., description="UUID of the newly created vendor user")
    email: EmailStr = Field(..., description="Registered email address")
    role: str = Field(..., description="User role (always vendor)")
    company_name: Optional[str] = Field(None, description="Corporate company name")
    phone: Optional[str] = Field(None, description="Corporate contact number")
    is_verified: bool = Field(..., description="Email verification status")
    message: str = Field(..., description="Success/instructions text message")
    next_steps: list[str] = Field(..., description="Ordered list of setup actions for the vendor")

class RegisterInitiateRequest(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    role: str = Field("customer", description="The role to register as (customer or vendor)")

class RegisterCompleteRequest(BaseModel):
    email: EmailStr = Field(..., description="User's verified email address")
    password: str = Field(..., min_length=8, description="User's secure password")
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    company_name: Optional[str] = Field(None, max_length=255) # For vendors
    address_street: Optional[str] = Field(None, max_length=500, description="Vendor physical street address")
    latitude: Optional[float] = Field(None, description="Physical location latitude coordinate")
    longitude: Optional[float] = Field(None, description="Physical location longitude coordinate")
    place_id: Optional[str] = Field(None, max_length=100, description="Google Places ID")

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        validate_password_field(v)
        return v

class DeleteAllDevicesRequest(BaseModel):
    current_device_id: str = Field(..., description="Device ID of the current session to keep")

