from typing import List, Optional, Annotated
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.responses import success_response, ApiSuccessResponse
from app.domains.auth.models.user import User
from app.domains.shopping.api.dependencies import get_optional_current_user
from app.domains.shopping.schemas.cart_schemas import (
    CartResponse,
    CartItemCreate,
    CartItemUpdate,
    CartItemResponse,
    CartTotalsResponse,
    CartValidationResponse,
    CartMergeRequest,
    CartMergeResponse,
)
from app.domains.shopping.services.cart_service import CartService
from app.domains.shopping.services.cart_calculation_service import CartCalculationService

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])


@router.get("/my", response_model=ApiSuccessResponse[CartResponse])
async def get_my_cart(
    cart_token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Retrieve the current active cart for a user or guest."""
    user_id = current_user.id if current_user else None

    try:
        service = CartService(db)
        cart = await service.get_or_create_cart(
            user_id=user_id,
            cart_token=cart_token
        )

        # Load items
        cart_with_items = await service.get_by_id(cart.id)
        if not cart_with_items:
            # Fallback if get_by_id failed (should not happen for a newly created cart)
            return success_response(cart)

        return success_response(cart_with_items)
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching cart: {str(e)}", exc_info=True)

        # If cart_token is invalid, return a 400 with a clear message
        if "cart" in str(e).lower() or "token" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired cart token. Please refresh the page and try again."
            )

        # For other errors, return a 500 with a generic message
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching your cart. Please try again."
        )


@router.post("/items", response_model=ApiSuccessResponse[CartResponse])
async def add_cart_item(
    item_in: CartItemCreate,
    cart_token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Add an item to the current cart."""
    user_id = current_user.id if current_user else None
    service = CartService(db)

    cart = await service.get_or_create_cart(
        user_id=user_id,
        cart_token=cart_token
    )

    try:
        await service.add_item(
            cart_id=cart.id,
            **item_in.model_dump()
        )
        # Return the full cart with items and cart_token
        cart_with_items = await service.get_by_id(cart.id)
        if not cart_with_items:
            # Fallback if get_by_id failed - return the cart object we have
            return success_response(cart)
        return success_response(cart_with_items)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/items/{item_id}", response_model=ApiSuccessResponse[CartItemResponse])
async def update_cart_item(
    item_id: uuid.UUID,
    item_in: CartItemUpdate,
    cart_token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Update a specific item in the cart."""
    from app.domains.shopping.models.cart import CartItem
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    stmt = select(CartItem).where(CartItem.id == item_id).options(selectinload(CartItem.cart))
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
        
    # Check ownership
    is_owner = False
    if item.cart.user_id:
        if current_user and current_user.id == item.cart.user_id:
            is_owner = True
    else:
        if cart_token and item.cart.cart_token == cart_token:
            is_owner = True
            
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this cart item"
        )
    
    update_data = item_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
    await db.commit()
    await db.refresh(item)
    return success_response(item)


@router.delete("/items/{item_id}", status_code=status.HTTP_200_OK)
async def remove_cart_item(
    item_id: uuid.UUID,
    cart_token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Remove an item from the cart."""
    from app.domains.shopping.models.cart import CartItem
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    stmt = select(CartItem).where(CartItem.id == item_id).options(selectinload(CartItem.cart))
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
        
    # Check ownership
    is_owner = False
    if item.cart.user_id:
        if current_user and current_user.id == item.cart.user_id:
            is_owner = True
    else:
        if cart_token and item.cart.cart_token == cart_token:
            is_owner = True
            
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this cart item"
        )
        
    await db.delete(item)
    await db.commit()
    return success_response({"message": "Item removed from cart"})


@router.get("/totals", response_model=ApiSuccessResponse[CartTotalsResponse])
async def get_cart_totals(
    cart_id: uuid.UUID,
    lat: float = None,
    lon: float = None,
    db: AsyncSession = Depends(get_db)
):
    """Calculate and return cart totals."""
    calc_service = CartCalculationService(db)
    try:
        shipping_address = None
        if lat is not None and lon is not None:
            shipping_address = {"latitude": lat, "longitude": lon}
        totals = await calc_service.calculate_totals(cart_id, shipping_address)
        # Ensure cart_id is in response as expected by schema
        totals["cart_id"] = cart_id
        return success_response(totals)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/merge", response_model=ApiSuccessResponse[CartMergeResponse])
async def merge_carts(
    merge_in: CartMergeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Merge a guest cart into the current user's cart."""
    service = CartService(db)
    try:
        cart, merge_log = await service.merge_guest_cart(
            guest_cart_token=merge_in.guest_cart_token,
            user_id=current_user.id,
            merge_method=merge_in.merge_method
        )
        return success_response({
            "success": True,
            "message": "Carts merged successfully",
            "cart_id": str(cart.id),
            "item_count": len(cart.items) if cart.items else 0,
            "merge_method": merge_in.merge_method,
            "merge_log_id": str(merge_log.id),
        })
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============================================================================
# Additional Cart Endpoints
# ============================================================================

@router.post("/items/bulk", response_model=ApiSuccessResponse[dict])
async def add_cart_items_bulk(
    items: List[CartItemCreate],
    cart_token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Add multiple items to the current cart."""
    user_id = current_user.id if current_user else None
    service = CartService(db)

    cart = await service.get_or_create_cart(
        user_id=user_id,
        cart_token=cart_token
    )

    added_count = 0
    error_count = 0
    added_items = []
    errors = []

    for item_in in items:
        try:
            cart_item = await service.add_item(
                cart_id=cart.id,
                **item_in.model_dump()
            )
            added_count += 1
            added_items.append(cart_item)
        except ValueError as e:
            error_count += 1
            errors.append({"item": item_in.model_dump(), "error": str(e)})

    return success_response({
        "added_count": added_count,
        "error_count": error_count,
        "added_items": added_items,
        "errors": errors,
    })


@router.delete("/items/bulk", response_model=ApiSuccessResponse[dict])
async def remove_cart_items_bulk(
    item_ids: List[uuid.UUID] = Body(..., embed=True),
    cart_token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Remove multiple items from the cart."""
    from app.domains.shopping.models.cart import CartItem
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    stmt = select(CartItem).where(CartItem.id.in_(item_ids)).options(selectinload(CartItem.cart))
    result = await db.execute(stmt)
    items = result.scalars().all()

    if not items:
        return success_response({"removed_count": 0})

    # Verify ownership for all items being deleted
    for item in items:
        is_owner = False
        if item.cart.user_id:
            if current_user and current_user.id == item.cart.user_id:
                is_owner = True
        else:
            if cart_token and item.cart.cart_token == cart_token:
                is_owner = True

        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this cart item"
            )

    for item in items:
        await db.delete(item)
    await db.commit()

    return success_response({
        "removed_count": len(items),
    })


@router.delete("/clear", response_model=ApiSuccessResponse[dict])
async def clear_cart(
    cart_token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Clear all items from the current cart."""
    from app.domains.shopping.models.cart import CartItem
    from sqlalchemy import delete

    user_id = current_user.id if current_user else None
    service = CartService(db)

    cart = await service.get_or_create_cart(
        user_id=user_id,
        cart_token=cart_token
    )

    # Delete all items in the cart
    stmt = delete(CartItem).where(CartItem.cart_id == cart.id)
    result = await db.execute(stmt)
    await db.commit()

    return success_response({
        "removed_count": result.rowcount,
    })


@router.post("/validate", response_model=ApiSuccessResponse[CartValidationResponse])
async def validate_cart(
    cart_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Validate cart for stock availability and price changes."""
    service = CartService(db)
    calc_service = CartCalculationService(db)

    try:
        cart = await service.get_by_id(cart_id)
        if not cart:
            raise ValueError("Cart not found")

        # Calculate totals
        totals = await calc_service.calculate_totals(cart_id)

        # Check for issues (simplified - should check stock, price changes, etc.)
        warnings = []
        errors = []

        if cart.items:
            for item in cart.items:
                if item.product and item.product.stock_quantity < item.quantity:
                    errors.append(f"{item.product.name}: Insufficient stock (available: {item.product.stock_quantity})")

        is_valid = len(errors) == 0

        return success_response({
            "is_valid": is_valid,
            "cart_id": str(cart_id),
            "item_count": len(cart.items) if cart.items else 0,
            "errors": errors,
            "warnings": warnings,
            "subtotal": str(totals.get("subtotal", 0)),
            "estimated_total": str(totals.get("total", 0)),
        })
    except ValueError as e:
        return success_response({
            "is_valid": False,
            "cart_id": str(cart_id),
            "item_count": 0,
            "errors": [str(e)],
            "warnings": [],
            "subtotal": "0",
            "estimated_total": "0",
        })
