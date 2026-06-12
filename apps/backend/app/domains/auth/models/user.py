from typing import Optional, List
from sqlalchemy import String, Boolean, CheckConstraint, Index, and_
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin

class User(Base, IDMixin, AuditMixin):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'worker', 'vendor', 'customer', 'guest')", name="check_user_role"),
        CheckConstraint("email LIKE '%@%.%'", name="check_user_email_format"),
        Index("idx_users_role_active", "role", "is_active"),
    )

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="customer", nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    first_name: Mapped[Optional[str]] = mapped_column(String(100))
    last_name: Mapped[Optional[str]] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Vendor-specific fields (for initial registration)
    company_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    vat_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    devices: Mapped[List["UserDevice"]] = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan")
    otps: Mapped[List["OTP"]] = relationship("OTP", back_populates="user", cascade="all, delete-orphan")
    vendor_profile: Mapped[Optional["VendorProfile"]] = relationship(
        "VendorProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="[VendorProfile.user_id]"
    )
