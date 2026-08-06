from typing import Annotated, List, Optional
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.dependencies import require_role, get_current_user
from app.domains.shopping.api.dependencies import get_optional_current_user
from app.domains.auth.models.user import User
from app.domains.shopping.schemas.banner_schemas import (
    BannerCreate,
    BannerUpdate,
    BannerResponse,
    BannerListResponse,
    PublicBanner,
    BannerAnalytics,
    BannerClickCreate,
    BannerDismissalCreate,
    BannerPlacement,
    BannerStatus,
)
from app.domains.shopping.services.banner_service import BannerService


router = APIRouter(prefix="/admin/banners", tags=["Admin Banners"])


# ============================================================================
# ADMIN BANNER MANAGEMENT
# ============================================================================

@router.get("", response_model=ApiSuccessResponse[List[BannerResponse]])
async def admin_list_banners(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    placement: Optional[BannerPlacement] = None,
    status: Optional[BannerStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Admin lists all banners with filtering."""
    service = BannerService(db)
    banners, total = await service.list_banners(
        status=status,
        placement=placement,
        offset=(page - 1) * page_size,
        limit=page_size
    )
    return success_response(banners)


@router.post("", response_model=ApiSuccessResponse[BannerResponse], status_code=status.HTTP_201_CREATED)
async def admin_create_banner(
    data: BannerCreate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin creates a new banner."""
    service = BannerService(db)
    try:
        banner = await service.create_banner(
            created_by_id=current_user.id,
            **data.model_dump()
        )
        return success_response(banner)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{banner_id}", response_model=ApiSuccessResponse[BannerResponse])
async def admin_get_banner(
    banner_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin gets banner details."""
    service = BannerService(db)
    banner = await service.get_by_id(banner_id)
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    return success_response(banner)


@router.patch("/{banner_id}", response_model=ApiSuccessResponse[BannerResponse])
async def admin_update_banner(
    banner_id: uuid.UUID,
    data: BannerUpdate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin updates banner details."""
    service = BannerService(db)
    banner = await service.get_by_id(banner_id)
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")

    update_data = data.model_dump(exclude_unset=True)
    updated_banner = await service.update_banner(banner_id, **update_data)
    return success_response(updated_banner)


@router.delete("/{banner_id}", status_code=status.HTTP_200_OK)
async def admin_delete_banner(
    banner_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin deletes a banner."""
    service = BannerService(db)
    success = await service.delete_banner(banner_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    return success_response({"message": "Banner deleted"})


@router.post("/{banner_id}/activate", status_code=status.HTTP_200_OK)
async def admin_activate_banner(
    banner_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin activates a banner."""
    service = BannerService(db)
    banner = await service.update_banner(banner_id, status=BannerStatus.ACTIVE)
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    return success_response({"message": "Banner activated", "banner_id": str(banner_id)})


@router.post("/{banner_id}/pause", status_code=status.HTTP_200_OK)
async def admin_pause_banner(
    banner_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin pauses a banner."""
    service = BannerService(db)
    banner = await service.update_banner(banner_id, status=BannerStatus.PAUSED)
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    return success_response({"message": "Banner paused", "banner_id": str(banner_id)})


@router.get("/{banner_id}/analytics", response_model=ApiSuccessResponse[BannerAnalytics])
async def admin_get_banner_analytics(
    banner_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin gets analytics for a specific banner."""
    service = BannerService(db)
    analytics = await service.get_banner_analytics(banner_id)
    if not analytics:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    return success_response(analytics)


@router.get("/analytics/all", response_model=ApiSuccessResponse[List[dict]])
async def admin_get_all_analytics(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Admin gets analytics for all banners."""
    service = BannerService(db)
    analytics, total = await service.get_all_analytics(
        offset=(page - 1) * page_size,
        limit=page_size
    )
    return success_response(analytics)


# ============================================================================
# PUBLIC BANNER ENDPOINTS (CUSTOMER FACING)
# ============================================================================

public_router = APIRouter(prefix="/banners", tags=["Public Banners"])


@public_router.get("", response_model=ApiSuccessResponse[List[PublicBanner]])
async def get_public_banners(
    placement: Optional[BannerPlacement] = None,
    limit: int = Query(10, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get active banners for display.
    Optionally filter by placement (homepage_hero, header_bar, etc.)
    """
    service = BannerService(db)
    banners = await service.get_active_banners(
        placement=placement,
        user_id=current_user.id if current_user else None,
        limit=limit
    )

    # Record impressions for returned banners
    for banner in banners:
        await service.record_impression(banner.id)

    public_banners = []
    for banner in banners:
        public_banners.append({
            "id": banner.id,
            "title": banner.title,
            "description": banner.description,
            "image_url": banner.image_url,
            "image_alt_text": banner.image_alt_text,
            "background_color": banner.background_color,
            "text_color": banner.text_color,
            "cta_text": banner.cta_text,
            "cta_link": banner.cta_link,
            "cta_target": banner.cta_target,
            "placement": banner.placement,
            "priority": banner.priority,
            "is_dismissible": banner.is_dismissible,
            "show_close_button": banner.show_close_button,
            "mobile_hidden": banner.mobile_hidden,
            "desktop_hidden": banner.desktop_hidden,
        })

    return success_response(public_banners)


@public_router.post("/click", status_code=status.HTTP_200_OK)
async def record_banner_click(
    data: BannerClickCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Record a banner click (for analytics)."""
    service = BannerService(db)

    # Get session ID from cookie or header if available
    session_id = data.session_id or request.headers.get("X-Session-ID")

    try:
        await service.record_click(
            banner_id=data.banner_id,
            user_id=current_user.id if current_user else None,
            session_id=session_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            referrer=request.headers.get("referer"),
        )
        return success_response({"message": "Click recorded"})
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@public_router.post("/dismiss", status_code=status.HTTP_200_OK)
async def dismiss_banner(
    data: BannerDismissalCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Record a banner dismissal (user closed the banner)."""
    service = BannerService(db)

    # Get session ID from cookie or header if available
    session_id = data.session_id or request.headers.get("X-Session-ID")

    try:
        await service.record_dismissal(
            banner_id=data.banner_id,
            user_id=current_user.id if current_user else None,
            session_id=session_id,
        )
        return success_response({"message": "Dismissal recorded"})
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
