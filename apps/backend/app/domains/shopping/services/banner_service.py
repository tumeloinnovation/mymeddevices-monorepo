import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import select, and_, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.shopping.models.banner import (
    Banner,
    BannerStatus,
    BannerPlacement,
    BannerClick,
    BannerDismissal
)


class BannerService:
    """Service for banner operations including CRUD, analytics, and tracking."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ========================================================================
    # CRUD OPERATIONS
    # ========================================================================

    async def create_banner(
        self,
        title: str,
        placement: BannerPlacement,
        created_by_id: uuid.UUID,
        description: Optional[str] = None,
        image_url: Optional[str] = None,
        image_alt_text: Optional[str] = None,
        background_color: Optional[str] = None,
        text_color: Optional[str] = None,
        cta_text: Optional[str] = None,
        cta_link: Optional[str] = None,
        cta_target: str = "_self",
        priority: int = 0,
        status: BannerStatus = BannerStatus.DRAFT,
        scheduled_start: Optional[datetime] = None,
        scheduled_end: Optional[datetime] = None,
        target_audience: Optional[List[str]] = None,
        target_categories: Optional[List[str]] = None,
        target_products: Optional[List[str]] = None,
        exclude_products: Optional[List[str]] = None,
        coupon_id: Optional[uuid.UUID] = None,
        vendor_id: Optional[uuid.UUID] = None,
        is_dismissible: bool = False,
        show_close_button: bool = True,
        mobile_hidden: bool = False,
        desktop_hidden: bool = False,
    ) -> Banner:
        """Create a new banner."""
        banner = Banner(
            title=title,
            description=description,
            image_url=image_url,
            image_alt_text=image_alt_text,
            background_color=background_color,
            text_color=text_color,
            cta_text=cta_text,
            cta_link=cta_link,
            cta_target=cta_target,
            placement=placement,
            priority=priority,
            status=status,
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_end,
            target_audience=target_audience,
            target_categories=target_categories,
            target_products=target_products,
            exclude_products=exclude_products,
            coupon_id=coupon_id,
            vendor_id=vendor_id,
            is_dismissible=is_dismissible,
            show_close_button=show_close_button,
            mobile_hidden=mobile_hidden,
            desktop_hidden=desktop_hidden,
            created_by_id=created_by_id,
        )
        self.db.add(banner)
        await self.db.commit()
        await self.db.refresh(banner)
        return banner

    async def get_by_id(self, banner_id: uuid.UUID) -> Optional[Banner]:
        """Get banner by ID."""
        stmt = select(Banner).where(Banner.id == banner_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_banner(
        self,
        banner_id: uuid.UUID,
        **updates
    ) -> Optional[Banner]:
        """Update banner fields."""
        banner = await self.get_by_id(banner_id)
        if not banner:
            return None

        for key, value in updates.items():
            if hasattr(banner, key):
                setattr(banner, key, value)

        await self.db.commit()
        await self.db.refresh(banner)
        return banner

    async def delete_banner(self, banner_id: uuid.UUID) -> bool:
        """Delete a banner."""
        banner = await self.get_by_id(banner_id)
        if not banner:
            return False

        await self.db.delete(banner)
        await self.db.commit()
        return True

    async def list_banners(
        self,
        status: Optional[BannerStatus] = None,
        placement: Optional[BannerPlacement] = None,
        vendor_id: Optional[uuid.UUID] = None,
        offset: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Banner], int]:
        """List banners with pagination and filtering."""
        stmt = select(Banner)
        count_stmt = select(func.count(Banner.id))

        if status:
            stmt = stmt.where(Banner.status == status)
            count_stmt = count_stmt.where(Banner.status == status)

        if placement:
            stmt = stmt.where(Banner.placement == placement)
            count_stmt = count_stmt.where(Banner.placement == placement)

        if vendor_id:
            stmt = stmt.where(Banner.vendor_id == vendor_id)
            count_stmt = count_stmt.where(Banner.vendor_id == vendor_id)

        # Get total count
        total_result = await self.db.execute(count_stmt)
        total_count = total_result.scalar() or 0

        # Get paginated results ordered by priority (desc) and created_at (desc)
        stmt = stmt.order_by(
            Banner.priority.desc(),
            Banner.created_at.desc()
        ).offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total_count

    # ========================================================================
    # PUBLIC FACING - GET ACTIVE BANNERS
    # ========================================================================

    async def get_active_banners(
        self,
        placement: Optional[BannerPlacement] = None,
        user_id: Optional[uuid.UUID] = None,
        category_id: Optional[str] = None,
        product_id: Optional[str] = None,
        limit: int = 10,
    ) -> List[Banner]:
        """
        Get banners that should be displayed to users.

        Filters by:
        - Status = ACTIVE
        - Within scheduled time window
        - Placement matches
        - Device type (mobile/desktop) - you'd pass this from request context
        """
        now = datetime.now(timezone.utc)

        stmt = select(Banner).where(
            and_(
                Banner.status == BannerStatus.ACTIVE,
                (Banner.scheduled_start.is_(None)) | (Banner.scheduled_start <= now),
                (Banner.scheduled_end.is_(None)) | (Banner.scheduled_end > now)
            )
        )

        if placement:
            stmt = stmt.where(Banner.placement == placement)

        # Filter by vendor if vendor_id is provided
        # This would be used in vendor-specific contexts
        # if vendor_id:
        #     stmt = stmt.where((Banner.vendor_id.is_(None)) | (Banner.vendor_id == vendor_id))

        stmt = stmt.order_by(
            Banner.priority.desc(),
            Banner.created_at.desc()
        ).limit(limit)

        result = await self.db.execute(stmt)
        banners = list(result.scalars().all())

        # Filter out banners dismissed by this user (if user_id provided)
        if user_id:
            dismissed_banner_ids = await self._get_dismissed_banner_ids(user_id)
            banners = [b for b in banners if b.id not in dismissed_banner_ids]

        return banners

    # ========================================================================
    # ANALYTICS AND TRACKING
    # ========================================================================

    async def record_impression(self, banner_id: uuid.UUID) -> bool:
        """Record a banner impression (view)."""
        banner = await self.get_by_id(banner_id)
        if not banner:
            return False

        banner.impressions += 1
        await self.db.commit()
        return True

    async def record_click(
        self,
        banner_id: uuid.UUID,
        user_id: Optional[uuid.UUID] = None,
        session_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        referrer: Optional[str] = None,
    ) -> BannerClick:
        """Record a banner click."""
        # Increment banner click count
        banner = await self.get_by_id(banner_id)
        if not banner:
            raise ValueError("Banner not found")

        banner.clicks += 1

        # Create click record
        click = BannerClick(
            banner_id=banner_id,
            user_id=user_id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            referrer=referrer,
        )
        self.db.add(click)

        await self.db.commit()
        await self.db.refresh(click)
        return click

    async def record_dismissal(
        self,
        banner_id: uuid.UUID,
        user_id: Optional[uuid.UUID] = None,
        session_id: Optional[str] = None,
    ) -> BannerDismissal:
        """Record a banner dismissal."""
        # Increment banner dismissal count
        banner = await self.get_by_id(banner_id)
        if not banner:
            raise ValueError("Banner not found")

        banner.dismissals += 1

        # Create dismissal record
        dismissal = BannerDismissal(
            banner_id=banner_id,
            user_id=user_id,
            session_id=session_id,
        )
        self.db.add(dismissal)

        await self.db.commit()
        await self.db.refresh(dismissal)
        return dismissal

    async def get_banner_analytics(self, banner_id: uuid.UUID) -> Optional[dict]:
        """Get analytics for a specific banner."""
        banner = await self.get_by_id(banner_id)
        if not banner:
            return None

        return {
            "banner_id": str(banner.id),
            "title": banner.title,
            "impressions": banner.impressions,
            "clicks": banner.clicks,
            "dismissals": banner.dismissals,
            "click_through_rate": banner.get_click_through_rate(),
            "status": banner.status,
            "scheduled_start": banner.scheduled_start.isoformat() if banner.scheduled_start else None,
            "scheduled_end": banner.scheduled_end.isoformat() if banner.scheduled_end else None,
        }

    async def get_all_analytics(
        self,
        offset: int = 0,
        limit: int = 50,
    ) -> Tuple[List[dict], int]:
        """Get analytics for all banners."""
        banners, total = await self.list_banners(
            offset=offset,
            limit=limit
        )

        analytics_list = []
        for banner in banners:
            analytics_list.append({
                "banner_id": str(banner.id),
                "title": banner.title,
                "placement": banner.placement,
                "impressions": banner.impressions,
                "clicks": banner.clicks,
                "dismissals": banner.dismissals,
                "click_through_rate": banner.get_click_through_rate(),
                "status": banner.status,
                "scheduled_start": banner.scheduled_start.isoformat() if banner.scheduled_start else None,
                "scheduled_end": banner.scheduled_end.isoformat() if banner.scheduled_end else None,
            })

        return analytics_list, total

    # ========================================================================
    # SCHEDULED TASKS
    # ========================================================================

    async def activate_scheduled_banners(self) -> int:
        """
        Activate banners whose scheduled_start has arrived.
        Call this from a scheduled task (e.g., every minute).
        """
        now = datetime.now(timezone.utc)

        stmt = select(Banner).where(
            and_(
                Banner.status == BannerStatus.SCHEDULED,
                Banner.scheduled_start <= now,
                (Banner.scheduled_end.is_(None)) | (Banner.scheduled_end > now)
            )
        )

        result = await self.db.execute(stmt)
        banners = result.scalars().all()

        count = 0
        for banner in banners:
            banner.status = BannerStatus.ACTIVE
            count += 1

        await self.db.commit()
        return count

    async def expire_passed_banners(self) -> int:
        """
        Expire banners whose scheduled_end has passed.
        Call this from a scheduled task.
        """
        now = datetime.now(timezone.utc)

        stmt = select(Banner).where(
            and_(
                Banner.status == BannerStatus.ACTIVE,
                Banner.scheduled_end.isnot(None),
                Banner.scheduled_end < now
            )
        )

        result = await self.db.execute(stmt)
        banners = result.scalars().all()

        count = 0
        for banner in banners:
            banner.status = BannerStatus.EXPIRED
            count += 1

        await self.db.commit()
        return count

    # ========================================================================
    # PRIVATE HELPER METHODS
    # ========================================================================

    async def _get_dismissed_banner_ids(self, user_id: uuid.UUID) -> set[uuid.UUID]:
        """Get set of banner IDs dismissed by this user."""
        stmt = select(BannerDismissal.banner_id).where(
            BannerDismissal.user_id == user_id
        )

        result = await self.db.execute(stmt)
        return {row[0] for row in result.all()}
