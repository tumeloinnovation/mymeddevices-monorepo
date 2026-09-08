import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domains.auth.models.user import User

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin


class VendorProfile(Base, IDMixin, AuditMixin):
    """
    Comprehensive vendor profile model for medical equipment vendors.
    Created after initial registration, OTP verification, and admin approval.
    """

    __tablename__ = "vendor_profiles"

    # Foreign Key to User
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    # ===============================
    # STORE INFORMATION
    # ===============================
    username: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    store_name: Mapped[str] = mapped_column(String(255), nullable=False)
    store_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    store_logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Business Contact (separate from personal contact)
    business_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    business_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # ===============================
    # STORE ADDRESS (Google Places)
    # ===============================
    address_street: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address_region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address_country: Mapped[str] = mapped_column(String(2), default="KE")  # Default Kenya
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    place_id: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Google Places ID

    # ===============================
    # PAYMENT & PAYOUT DETAILS
    # ===============================
    # M-Pesa Details
    mpesa_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    mpesa_business_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mpesa_till_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    mpesa_paybill_number: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Bank Account Details
    bank_account_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bank_branch: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bank_swift_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_iban: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ===============================
    # OPERATIONAL DETAILS
    # ===============================
    # Business Hours stored as JSON: {"monday": {"open": "09:00", "close": "17:00"}, ...}
    business_hours: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # ===============================
    # ADMINISTRATIVE FIELDS
    # ===============================
    # Status: pending, approved, suspended, rejected
    approval_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)

    # Document URLs for verification (business license, etc.)
    document_urls: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Initial registration data (from User model)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    vat_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Rejection reason (if rejected)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # When the profile was approved
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships to User
    # Primary user relationship (the vendor's own account)
    user: Mapped["User"] = relationship(
        "User", back_populates="vendor_profile", foreign_keys=[user_id]
    )
    # Admin who approved this vendor profile
    approved_by_user: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[approved_by]
    )

    # Note: Access ledger transactions through vendor_ledger.transactions relationship
    # This avoids circular import issues with LedgerTransaction model
