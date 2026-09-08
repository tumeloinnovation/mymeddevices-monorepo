import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.shopping.schemas.promotion_schemas import (
    PromotionCreate,
    PromotionResponse,
    PromotionUpdate,
)
from app.domains.shopping.services.promotion_service import PromotionService

router = APIRouter(prefix="/admin/promotions", tags=["Admin Promotions Management"])


@router.get("", response_model=ApiSuccessResponse[list[PromotionResponse]])
async def admin_list_promotions(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    promotion_type: str | None = Query(None),
    only_active: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Admin lists all marketing promotions (flash sales, discounts, bundles, free shipping)."""
    service = PromotionService(db)
    promotions, total = await service.list_promotions(
        promotion_type=promotion_type,
        only_active=only_active,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    return success_response(promotions)


@router.post("", response_model=ApiSuccessResponse[PromotionResponse], status_code=status.HTTP_201_CREATED)
async def admin_create_promotion(
    data: PromotionCreate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """Admin creates a new marketing promotion."""
    service = PromotionService(db)
    promo = await service.create_promotion(data.model_dump(), created_by_id=current_user.id)
    return success_response(promo)


@router.get("/{promotion_id}", response_model=ApiSuccessResponse[PromotionResponse])
async def admin_get_promotion(
    promotion_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """Admin gets a promotion by ID."""
    service = PromotionService(db)
    promo = await service.get_by_id(promotion_id)
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    return success_response(promo)


@router.patch("/{promotion_id}", response_model=ApiSuccessResponse[PromotionResponse])
async def admin_update_promotion(
    promotion_id: uuid.UUID,
    data: PromotionUpdate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """Admin updates promotion attributes."""
    service = PromotionService(db)
    updated = await service.update_promotion(promotion_id, data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    return success_response(updated)


@router.delete("/{promotion_id}", status_code=status.HTTP_200_OK)
async def admin_delete_promotion(
    promotion_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """Admin deletes a promotion."""
    service = PromotionService(db)
    deleted = await service.delete_promotion(promotion_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    return success_response({"message": "Promotion deleted successfully"})


@router.post("/{promotion_id}/toggle-status", response_model=ApiSuccessResponse[PromotionResponse])
async def admin_toggle_promotion_status(
    promotion_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """Admin activates or pauses a promotion."""
    service = PromotionService(db)
    toggled = await service.toggle_status(promotion_id)
    if not toggled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    return success_response(toggled)
