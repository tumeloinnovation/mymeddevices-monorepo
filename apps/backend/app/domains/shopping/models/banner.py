import uuid
from datetime import UTC, datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin

if TYPE_CHECKING:
    from app.domains.shopping.models.coupon import Coupon
    from app.domains.vendor.models.vendor_profile import VendorProfile


class BannerPlacement(str, Enum):
    """Where banners can be displayed."""

    HOMEPAGE_HERO = "HOMEPAGE_HERO"  # Full-width hero carousel
    HOMEPAGE_SIDEBAR = "HOMEPAGE_SIDEBAR"  # Sidebar on homepage
    CATEGORY_PAGE = "CATEGORY_PAGE"  # Top of category pages
    PRODUCT_PAGE = "PRODUCT_PAGE"  # On product detail pages
    CHECKOUT_PAGE = "CHECKOUT_PAGE"  # During checkout
    HEADER_BAR = "HEADER_BAR"  # Top announcement bar
    FOOTER = "FOOTER"  # Footer banner


class BannerStatus(str, Enum):
    """Banner status."""

    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    EXPIRED = "EXPIRED"


class Banner(Base, IDMixin, AuditMixin):
    __tablename__ = "banners"

    # Basic Information
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Visual Assets
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_alt_text: Mapped[str | None] = mapped_column(String(200), nullable=True)
    background_color: Mapped[str | None] = mapped_column(
        String(20),  # Hex color
        nullable=True,
    )
    text_color: Mapped[str | None] = mapped_column(
        String(20),  # Hex color
        nullable=True,
    )

    # Call to Action
    cta_text: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cta_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cta_target: Mapped[str] = mapped_column(
        String(20),  # '_self', '_blank'
        default="_self",
        nullable=False,
    )

    # Placement and Priority
    placement: Mapped[str] = mapped_column(
        SQLEnum(BannerPlacement, name="bannerplacement", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        index=True,
    )
    priority: Mapped[int] = mapped_column(
        Integer,
        default=0,  # Higher = shown first
        nullable=False,
    )

    # Scheduling
    status: Mapped[str] = mapped_column(
        SQLEnum(BannerStatus, name="bannerstatus", values_callable=lambda obj: [e.value for e in obj]),
        server_default="DRAFT",
        default=BannerStatus.DRAFT.value,
        nullable=False,
        index=True,
    )
    scheduled_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    scheduled_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)

    # Targeting
    target_audience: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(50)).with_variant(JSON, "sqlite"), nullable=True
    )  # ['new_customers', 'returning', 'vip', etc.]
    target_categories: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(100)).with_variant(JSON, "sqlite"), nullable=True
    )  # Category IDs or slugs
    target_products: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(100)).with_variant(JSON, "sqlite"), nullable=True
    )  # Product IDs
    exclude_products: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(100)).with_variant(JSON, "sqlite"), nullable=True
    )  # Product IDs to exclude

    # Coupon Association
    coupon_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coupons.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Vendor-specific banners
    vendor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vendor_profiles.id", ondelete="CASCADE"), nullable=True, index=True
    )

    # Display Settings
    is_dismissible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    show_close_button: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    mobile_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    desktop_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Analytics
    impressions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    clicks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    dismissals: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Metadata
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    coupon: Mapped[Optional["Coupon"]] = relationship("Coupon", foreign_keys=[coupon_id], lazy="selectin")
    vendor: Mapped[Optional["VendorProfile"]] = relationship("VendorProfile", foreign_keys=[vendor_id], lazy="selectin")

    def is_active_for_display(self) -> bool:
        """Check if banner should be displayed based on status and schedule."""
        if self.status != BannerStatus.ACTIVE:
            return False

        now = datetime.now(UTC)

        if self.scheduled_start and now < self.scheduled_start:
            return False

        if self.scheduled_end and now > self.scheduled_end:
            return False

        return True

    def get_click_through_rate(self) -> float:
        """Calculate CTR as percentage."""
        if self.impressions == 0:
            return 0.0
        return round((self.clicks / self.impressions) * 100, 2)


class BannerClick(Base, IDMixin):
    """Track individual banner clicks for analytics."""

    __tablename__ = "banner_clicks"

    banner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("banners.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    session_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)  # For anonymous tracking
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    referrer: Mapped[str | None] = mapped_column(String(500), nullable=True)
    clicked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now(UTC), nullable=False, index=True
    )

    # Relationships
    banner: Mapped["Banner"] = relationship("Banner", foreign_keys=[banner_id])


class BannerDismissal(Base, IDMixin):
    """Track when users dismiss banners."""

    __tablename__ = "banner_dismissals"

    banner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("banners.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    session_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    dismissed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(UTC), nullable=False)

    # Relationships
    banner: Mapped["Banner"] = relationship("Banner", foreign_keys=[banner_id])
