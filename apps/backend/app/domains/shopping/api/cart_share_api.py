import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.responses import success_response, ApiSuccessResponse
from app.domains.auth.models.user import User
from app.domains.shopping.schemas.cart_share_schemas import CartShareCreate, CartShareResponse, SharedCartResponse
from app.domains.shopping.services.cart_share_service import CartShareService

router = APIRouter(prefix="/cart/share", tags=["Shopping Cart Sharing"])

@router.post("", response_model=ApiSuccessResponse[CartShareResponse])
async def create_cart_share(
    share_in: CartShareCreate,
    cart_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = CartShareService(db)
    share = await service.create_share(cart_id, current_user.id, share_in.expires_days)
    
    # Simple URL generation for example
    share_url = f"/shared-cart/{share.share_token}"
    
    response_data = CartShareResponse(
        id=share.id,
        cart_id=share.cart_id,
        share_token=share.share_token,
        expires_at=share.expires_at,
        access_count=share.access_count,
        share_url=share_url,
        created_at=share.created_at
    )
    return success_response(response_data)

@router.get("/{token}", response_model=ApiSuccessResponse[SharedCartResponse])
async def get_shared_cart(token: str, db: AsyncSession = Depends(get_db)):
    service = CartShareService(db)
    cart = await service.get_shared_cart(token)
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared cart not found or expired")
    
    # Map to SharedCartResponse
    items = []
    subtotal = 0.0
    for item in cart.items:
        price = float(item.product.price)
        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "notes": item.notes,
            "product": {
                "id": item.product.id,
                "name": item.product.name,
                "price": price,
                "sku": item.product.sku
            }
        })
        subtotal += price * item.quantity
        
    return success_response({
        "cart_id": cart.id,
        "items": items,
        "item_count": len(items),
        "subtotal": subtotal,
        "shared_at": cart.created_at
    })
