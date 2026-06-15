import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import String, Numeric, ForeignKey, DateTime, Boolean, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin


class Coupon(Base, IDMixin, AuditMixin):
    __tablename__ = "coupons"

    code: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )
    description: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )
    coupon_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )  # 'percentage', 'fixed_amount', 'free_shipping', 'bogo', 'category_specific', 'product_specific', 'first_time', 'loyalty'
    
    discount_value: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )
    discount_scope: Mapped[str] = mapped_column(
        String(50),
        default="cart",
        nullable=False
    )  # 'cart', 'product', 'category', 'vendor', 'user'

    vendor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vendor_profiles.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True
    )
    is_stackable: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    valid_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    valid_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )
    distribution_type: Mapped[str] = mapped_column(
        String(50),
        default="public",
        nullable=False
    )  # 'public', 'private', 'referral', 'affiliate', 'generated'

    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # Relationships
    vendor: Mapped[Optional["VendorProfile"]] = relationship(
        "VendorProfile",
        foreign_keys=[vendor_id],
        lazy="selectin"
    )
    restrictions: Mapped[Optional["CouponRestriction"]] = relationship(
        "CouponRestriction",
        back_populates="coupon",
        cascade="all, delete-orphan",
        uselist=False,
        lazy="selectin"
    )
    usages: Mapped[List["CouponUsage"]] = relationship(
        "CouponUsage",
        back_populates="coupon",
        cascade="all, delete-orphan"
    )
    user_coupons: Mapped[List["UserCoupon"]] = relationship(
        "UserCoupon",
        back_populates="coupon",
        cascade="all, delete-orphan"
    )
    categories: Mapped[List["CouponCategory"]] = relationship(
        "CouponCategory",
        back_populates="coupon",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    products: Mapped[List["CouponProduct"]] = relationship(
        "CouponProduct",
        back_populates="coupon",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def is_valid(self) -> bool:
        if not self.is_active:
            return False
        now = datetime.now(timezone.utc)
        
        if now < self.valid_from:
            return False

        if self.valid_until and now > self.valid_until:
            return False

        return True

    def can_apply(self, subtotal: Decimal) -> tuple[bool, Optional[str]]:
        if not self.is_valid():
            return False, "Coupon is invalid or expired"
        
        if self.restrictions:
            if self.restrictions.min_order_value and subtotal < self.restrictions.min_order_value:
                return False, f"Minimum order value of {self.restrictions.min_order_value} required"
            
        return True, None


class CouponRestriction(Base, IDMixin):
    __tablename__ = "coupon_restrictions"

    coupon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("coupons.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    min_order_value: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2),
        nullable=True
    )
    max_discount_amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2),
        nullable=True
    )
    new_users_only: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    first_purchase_only: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    one_time_per_user: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    global_usage_limit: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )
    vendor_only: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    exclude_sale_items: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    # Buy X Get Y details
    buy_product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True
    )
    buy_quantity: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )
    get_product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True
    )
    get_quantity: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )

    # Relationships
    coupon: Mapped["Coupon"] = relationship(
        "Coupon",
        back_populates="restrictions"
    )
    buy_product: Mapped[Optional["Product"]] = relationship(
        "Product",
        foreign_keys=[buy_product_id],
        lazy="selectin"
    )
    get_product: Mapped[Optional["Product"]] = relationship(
        "Product",
        foreign_keys=[get_product_id],
        lazy="selectin"
    )


class CouponUsage(Base, IDMixin):
    __tablename__ = "coupon_usages"

    coupon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("coupons.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    # order_id: Mapped[uuid.UUID] = mapped_column(...) # Omitted for now until orders domain exists
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    
    vendor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vendor_profiles.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )
    used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        nullable=False
    )
    is_refunded: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    refunded_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    coupon: Mapped["Coupon"] = relationship(
        "Coupon",
        back_populates="usages"
    )


class UserCoupon(Base, IDMixin):
    __tablename__ = "user_coupons"

    coupon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("coupons.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now(timezone.utc),
        nullable=False
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    is_used: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    coupon: Mapped["Coupon"] = relationship(
        "Coupon",
        back_populates="user_coupons"
    )


class CouponCategory(Base, IDMixin):
    __tablename__ = "coupon_categories"

    coupon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("coupons.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )

    # Relationships
    coupon: Mapped["Coupon"] = relationship(
        "Coupon",
        back_populates="categories"
    )


class CouponProduct(Base, IDMixin):
    __tablename__ = "coupon_products"

    coupon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("coupons.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Relationships
    coupon: Mapped["Coupon"] = relationship(
        "Coupon",
        back_populates="products"
    )
    product: Mapped["Product"] = relationship(
        "Product",
        lazy="selectin"
    )
