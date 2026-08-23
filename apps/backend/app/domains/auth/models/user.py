from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, CheckConstraint, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin

if TYPE_CHECKING:
    from app.domains.auth.models.otp import OTP
    from app.domains.auth.models.token_device import RefreshToken, UserDevice
    from app.domains.customers.models.customer_profile import CustomerProfile
    from app.domains.logistics.models.driver_profile import DriverProfile
    from app.domains.vendor.models.vendor_profile import VendorProfile


class User(Base, IDMixin, AuditMixin):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'worker', 'vendor', 'customer', 'guest', 'driver')", name="check_user_role"),
        CheckConstraint("email LIKE '%@%.%'", name="check_user_email_format"),
        Index("idx_users_role_active", "role", "is_active"),
    )

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="customer", nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Vendor-specific fields (for initial registration)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    vat_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    devices: Mapped[list["UserDevice"]] = relationship(
        "UserDevice", back_populates="user", cascade="all, delete-orphan"
    )
    otps: Mapped[list["OTP"]] = relationship("OTP", back_populates="user", cascade="all, delete-orphan")
    vendor_profile: Mapped[Optional["VendorProfile"]] = relationship(
        "VendorProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="[VendorProfile.user_id]",
    )
    customer_profile: Mapped[Optional["CustomerProfile"]] = relationship(
        "CustomerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    driver_profile: Mapped[Optional["DriverProfile"]] = relationship(
        "DriverProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="[DriverProfile.user_id]",
    )

    @property
    def is_vendor_verified(self) -> bool:
        if self.role != "vendor" or not self.vendor_profile:
            return False
        return self.vendor_profile.approval_status == "approved"
