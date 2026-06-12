from typing import Optional
from datetime import datetime
from sqlalchemy import String, Text, Boolean, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin
import uuid


class VendorProfile(Base, IDMixin, AuditMixin):
    """
    Comprehensive vendor profile model for medical equipment vendors.
    Created after initial registration, OTP verification, and admin approval.
    """
    __tablename__ = "vendor_profiles"

    # Foreign Key to User
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    # ===============================
    # STORE INFORMATION
    # ===============================
    store_name: Mapped[str] = mapped_column(String(255), nullable=False)
    store_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    store_logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Business Contact (separate from personal contact)
    business_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    business_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # ===============================
    # STORE ADDRESS (Google Places)
    # ===============================
    address_street: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    address_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address_region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address_country: Mapped[str] = mapped_column(String(2), default="KE")  # Default Kenya
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    place_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Google Places ID

    # ===============================
    # PAYMENT & PAYOUT DETAILS
    # ===============================
    # M-Pesa Details
    mpesa_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    mpesa_business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    mpesa_till_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    mpesa_paybill_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Bank Account Details
    bank_account_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bank_account_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bank_branch: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bank_swift_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bank_iban: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # ===============================
    # OPERATIONAL DETAILS
    # ===============================
    # Business Hours stored as JSON: {"monday": {"open": "09:00", "close": "17:00"}, ...}
    business_hours: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # ===============================
    # ADMINISTRATIVE FIELDS
    # ===============================
    # Status: pending, approved, suspended, rejected
    approval_status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False
    )

    # Document URLs for verification (business license, etc.)
    document_urls: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Initial registration data (from User model)
    company_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    vat_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Rejection reason (if rejected)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # When the profile was approved
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # Relationship to User
    user: Mapped["User"] = relationship("User", back_populates="vendor_profile", foreign_keys=[user_id])
