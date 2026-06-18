from typing import List, Optional, Annotated
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.dependencies import get_current_user
from app.domains.auth.models.user import User
from app.domains.shopping.schemas.saved_cart_schemas import (
    SavedCartResponse,
    SavedCartCreate,
    SavedCartUpdate,
)
from app.domains.shopping.services.saved_cart_service import SavedCartService
from app.domains.shopping.services.cart_service import CartService

router = APIRouter(prefix="/cart/saved", tags=["Saved Carts"])


@router.post("", response_model=ApiSuccessResponse[SavedCartResponse], status_code=status.HTTP_201_CREATED)
async def save_current_cart(
    data: SavedCartCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    source_cart_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Save the current cart for future use."""
    service = SavedCartService(db)
    saved_cart = await service.create_saved_cart(
        user_id=current_user.id,
        name=data.name,
        description=data.description,
        source_cart_id=source_cart_id
    )
    return success_response(saved_cart)


@router.get("", response_model=ApiSuccessResponse[List[SavedCartResponse]])
async def list_my_saved_carts(
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List all saved carts for the current user."""
    service = SavedCartService(db)
    saved_carts = await service.list_saved_carts(
        user_id=current_user.id,
        offset=(page - 1) * page_size,
        limit=page_size
    )
    return success_response(saved_carts)


@router.get("/{saved_cart_id}", response_model=ApiSuccessResponse[SavedCartResponse])
async def get_saved_cart(
    saved_cart_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get a specific saved cart by ID."""
    service = SavedCartService(db)
    saved_cart = await service.get_by_id(saved_cart_id)
    
    if not saved_cart or saved_cart.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved cart not found")
        
    return success_response(saved_cart)


@router.post("/{saved_cart_id}/restore", response_model=ApiSuccessResponse[dict])
async def restore_saved_cart(
    saved_cart_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    target_cart_id: uuid.UUID = Query(...),
    replace: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """Restore a saved cart to an active cart."""
    service = SavedCartService(db)
    # Check ownership
    saved_cart = await service.get_by_id(saved_cart_id)
    if not saved_cart or saved_cart.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved cart not found")

    cart = await service.restore_to_cart(
        saved_cart_id=saved_cart_id,
        target_cart_id=target_cart_id,
        replace=replace
    )
    return success_response({
        "message": "Cart restored successfully",
        "cart_id": cart.id,
        "item_count": len(cart.items)
    })


@router.delete("/{saved_cart_id}", status_code=status.HTTP_200_OK)
async def delete_saved_cart(
    saved_cart_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Delete a saved cart."""
    service = SavedCartService(db)
    # Check ownership first
    saved_cart = await service.get_by_id(saved_cart_id)
    if not saved_cart or saved_cart.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved cart not found")

    await service.delete_saved_cart(saved_cart_id)
    return success_response({"message": "Saved cart deleted"})
