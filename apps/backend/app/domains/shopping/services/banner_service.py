import uuid
from datetime import UTC, datetime

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.domains.shopping.models.banner import Banner, BannerClick, BannerDismissal, BannerPlacement, BannerStatus


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
        description: str | None = None,
        image_url: str | None = None,
        image_alt_text: str | None = None,
        background_color: str | None = None,
        text_color: str | None = None,
        cta_text: str | None = None,
        cta_link: str | None = None,
        cta_target: str = "_self",
        priority: int = 0,
        status: BannerStatus = BannerStatus.DRAFT,
        scheduled_start: datetime | None = None,
        scheduled_end: datetime | None = None,
        target_audience: list[str] | None = None,
        target_categories: list[str] | None = None,
        target_products: list[str] | None = None,
        exclude_products: list[str] | None = None,
        coupon_id: uuid.UUID | None = None,
        vendor_id: uuid.UUID | None = None,
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
        # Use transaction for atomic banner creation
        async with self.db.begin():
            self.db.add(banner)
            banner_id = banner.id
        # Reload and return
        result = await self.get_by_id(banner_id)
        if result is None:
            raise NotFoundError("Banner", str(banner_id))
        return result

    async def get_by_id(self, banner_id: uuid.UUID) -> Banner | None:
        """Get banner by ID."""
        stmt = select(Banner).where(Banner.id == banner_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_banner(self, banner_id: uuid.UUID, **updates) -> Banner | None:
        """Update banner fields."""
        banner = await self.get_by_id(banner_id)
        if not banner:
            return None

        for key, value in updates.items():
            if hasattr(banner, key):
                setattr(banner, key, value)

        # Use transaction for atomic update
        async with self.db.begin():
            pass  # Updates already done via ORM

        await self.db.refresh(banner)
        return banner

    async def delete_banner(self, banner_id: uuid.UUID) -> bool:
        """Delete a banner."""
        # Use transaction for atomic deletion
        async with self.db.begin():
            banner = await self.get_by_id(banner_id)
            if not banner:
                return False

            await self.db.delete(banner)
        return True

    async def list_banners(
        self,
        status: BannerStatus | None = None,
        placement: BannerPlacement | None = None,
        vendor_id: uuid.UUID | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Banner], int]:
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
        stmt = stmt.order_by(Banner.priority.desc(), Banner.created_at.desc()).offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total_count

    # ========================================================================
    # PUBLIC FACING - GET ACTIVE BANNERS
    # ========================================================================

    async def get_active_banners(
        self,
        placement: BannerPlacement | None = None,
        user_id: uuid.UUID | None = None,
        category_id: str | None = None,
        product_id: str | None = None,
        limit: int = 10,
    ) -> list[Banner]:
        """
        Get banners that should be displayed to users.

        Filters by:
        - Status = ACTIVE
        - Within scheduled time window
        - Placement matches
        - Device type (mobile/desktop) - you'd pass this from request context
        """
        now = datetime.now(UTC)

        stmt = select(Banner).where(
            and_(
                Banner.status == BannerStatus.ACTIVE,
                (Banner.scheduled_start.is_(None)) | (Banner.scheduled_start <= now),
                (Banner.scheduled_end.is_(None)) | (Banner.scheduled_end > now),
            )
        )

        if placement:
            stmt = stmt.where(Banner.placement == placement)

        # Filter by vendor if vendor_id is provided
        # This would be used in vendor-specific contexts
        # if vendor_id:
        #     stmt = stmt.where((Banner.vendor_id.is_(None)) | (Banner.vendor_id == vendor_id))

        stmt = stmt.order_by(Banner.priority.desc(), Banner.created_at.desc()).limit(limit)

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
        # Use transaction for atomic impression recording
        async with self.db.begin():
            banner = await self.get_by_id(banner_id)
            if not banner:
                return False

            banner.impressions += 1
        return True

    async def record_click(
        self,
        banner_id: uuid.UUID,
        user_id: uuid.UUID | None = None,
        session_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        referrer: str | None = None,
    ) -> BannerClick:
        """Record a banner click."""
        # Use transaction for atomic click recording
        async with self.db.begin():
            # Increment banner click count
            banner = await self.get_by_id(banner_id)
            if not banner:
                raise NotFoundError("Banner", banner_id)

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
            click_id = click.id

        # Reload and return
        stmt = select(BannerClick).where(BannerClick.id == click_id)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def record_dismissal(
        self,
        banner_id: uuid.UUID,
        user_id: uuid.UUID | None = None,
        session_id: str | None = None,
    ) -> BannerDismissal:
        """Record a banner dismissal."""
        # Use transaction for atomic dismissal recording
        async with self.db.begin():
            # Increment banner dismissal count
            banner = await self.get_by_id(banner_id)
            if not banner:
                raise NotFoundError("Banner", banner_id)

            banner.dismissals += 1

            # Create dismissal record
            dismissal = BannerDismissal(
                banner_id=banner_id,
                user_id=user_id,
                session_id=session_id,
            )
            self.db.add(dismissal)
            dismissal_id = dismissal.id

        # Reload and return
        stmt = select(BannerDismissal).where(BannerDismissal.id == dismissal_id)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def get_banner_analytics(self, banner_id: uuid.UUID) -> dict | None:
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
    ) -> tuple[list[dict], int]:
        """Get analytics for all banners."""
        banners, total = await self.list_banners(offset=offset, limit=limit)

        analytics_list = []
        for banner in banners:
            analytics_list.append(
                {
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
                }
            )

        return analytics_list, total

    # ========================================================================
    # SCHEDULED TASKS
    # ========================================================================

    async def activate_scheduled_banners(self) -> int:
        """
        Activate banners whose scheduled_start has arrived.
        Call this from a scheduled task (e.g., every minute).
        """
        now = datetime.now(UTC)

        stmt = select(Banner).where(
            and_(
                Banner.status == BannerStatus.SCHEDULED,
                Banner.scheduled_start <= now,
                (Banner.scheduled_end.is_(None)) | (Banner.scheduled_end > now),
            )
        )

        result = await self.db.execute(stmt)
        banners = result.scalars().all()

        count = 0
        # Use transaction for atomic status updates
        async with self.db.begin():
            for banner in banners:
                banner.status = BannerStatus.ACTIVE
                count += 1

        return count

    async def expire_passed_banners(self) -> int:
        """
        Expire banners whose scheduled_end has passed.
        Call this from a scheduled task.
        """
        now = datetime.now(UTC)

        stmt = select(Banner).where(
            and_(Banner.status == BannerStatus.ACTIVE, Banner.scheduled_end.isnot(None), Banner.scheduled_end < now)
        )

        result = await self.db.execute(stmt)
        banners = result.scalars().all()

        count = 0
        # Use transaction for atomic status updates
        async with self.db.begin():
            for banner in banners:
                banner.status = BannerStatus.EXPIRED
                count += 1

        return count

    # ========================================================================
    # PRIVATE HELPER METHODS
    # ========================================================================

    async def _get_dismissed_banner_ids(self, user_id: uuid.UUID) -> set[uuid.UUID]:
        """Get set of banner IDs dismissed by this user."""
        stmt = select(BannerDismissal.banner_id).where(BannerDismissal.user_id == user_id)

        result = await self.db.execute(stmt)
        return {row[0] for row in result.all()}
