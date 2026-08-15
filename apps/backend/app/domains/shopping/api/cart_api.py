import uuid

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, result_rowcount
from app.core.dependencies import CurrentUserDep, DbDep
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.shopping.api.dependencies import CartServiceDep, get_optional_current_user
from app.domains.shopping.schemas.cart_schemas import (
    CartItemCreate,
    CartItemResponse,
    CartItemUpdate,
    CartMergeRequest,
    CartMergeResponse,
    CartResponse,
    CartTotalsResponse,
    CartValidationResponse,
)
from app.domains.shopping.services.cart_calculation_service import CartCalculationService
from app.domains.shopping.services.cart_service import CartService

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])


async def _verify_cart_access(
    db: AsyncSession,
    cart_id: uuid.UUID,
    current_user: User | None,
    cart_token: str | None,
):
    """Verify that the caller owns the cart, or raise 403/404."""
    from sqlalchemy import select

    from app.domains.shopping.models.cart import Cart

    stmt = select(Cart).where(Cart.id == cart_id)
    result = await db.execute(stmt)
    cart = result.scalar_one_or_none()

    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")

    is_owner = False
    if cart.user_id:
        is_owner = current_user is not None and cart.user_id == current_user.id
    else:
        is_owner = cart_token is not None and cart.cart_token == cart_token

    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this cart"
        )


@router.get("/my", response_model=ApiSuccessResponse[CartResponse])
async def get_my_cart(
    service: CartServiceDep,
    cart_token: str | None = Query(None),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Retrieve the current active cart for a user or guest."""
    user_id = current_user.id if current_user else None
    cart = await service.get_or_create_cart(user_id=user_id, cart_token=cart_token)

    # Load items
    cart_with_items = await service.get_by_id(cart.id)
    if not cart_with_items:
        # Fallback if get_by_id failed (should not happen for a newly created cart)
        return success_response(cart)

    return success_response(cart_with_items)


@router.post("/items", response_model=ApiSuccessResponse[CartResponse])
async def add_cart_item(
    service: CartServiceDep,
    item_in: CartItemCreate,
    cart_token: str | None = Query(None),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Add an item to the current cart."""
    user_id = current_user.id if current_user else None

    cart = await service.get_or_create_cart(user_id=user_id, cart_token=cart_token)

    await service.add_item(cart_id=cart.id, **item_in.model_dump())
    # Return the full cart with items and cart_token
    cart_with_items = await service.get_by_id(cart.id)
    if not cart_with_items:
        # Fallback if get_by_id failed - return the cart object we have
        return success_response(cart)
    return success_response(cart_with_items)


@router.patch("/items/{item_id}", response_model=ApiSuccessResponse[CartItemResponse])
async def update_cart_item(
    item_id: uuid.UUID,
    db: DbDep,
    item_in: CartItemUpdate,
    cart_token: str | None = Query(None),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Update a specific item in the cart."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    from app.domains.shopping.models.cart import CartItem

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
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to modify this cart item"
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
    cart_token: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Remove an item from the cart."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    from app.domains.shopping.models.cart import CartItem

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
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to modify this cart item"
        )

    await db.delete(item)
    await db.commit()
    return success_response({"message": "Item removed from cart"})


@router.get("/totals", response_model=ApiSuccessResponse[CartTotalsResponse])
async def get_cart_totals(
    cart_id: uuid.UUID,
    lat: float | None = None,
    lon: float | None = None,
    cart_token: str | None = Query(None),
    current_user: User | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calculate and return cart totals."""
    await _verify_cart_access(db, cart_id, current_user, cart_token)

    calc_service = CartCalculationService(db)
    shipping_address = None
    if lat is not None and lon is not None:
        shipping_address = {"latitude": lat, "longitude": lon}
    totals = await calc_service.calculate_totals(cart_id, shipping_address)
    # Ensure cart_id is in response as expected by schema
    totals["cart_id"] = cart_id
    return success_response(totals)


@router.post("/merge", response_model=ApiSuccessResponse[CartMergeResponse])
async def merge_carts(merge_in: CartMergeRequest, current_user: CurrentUserDep, service: CartServiceDep):
    """Merge a guest cart into the current user's cart."""
    cart, merge_log = await service.merge_guest_cart(
        guest_cart_token=merge_in.guest_cart_token, user_id=current_user.id, merge_method=merge_in.merge_method
    )
    return success_response(
        {
            "success": True,
            "message": "Carts merged successfully",
            "cart_id": str(cart.id),
            "item_count": len(cart.items) if cart.items else 0,
            "merge_method": merge_in.merge_method,
            "merge_log_id": str(merge_log.id),
        }
    )


# ============================================================================
# Additional Cart Endpoints
# ============================================================================


@router.post("/items/bulk", response_model=ApiSuccessResponse[dict])
async def add_cart_items_bulk(
    service: CartServiceDep,
    items: list[CartItemCreate],
    cart_token: str | None = Query(None),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Add multiple items to the current cart."""
    user_id = current_user.id if current_user else None

    cart = await service.get_or_create_cart(user_id=user_id, cart_token=cart_token)

    added_count = 0
    error_count = 0
    added_items = []
    errors = []

    for item_in in items:
        try:
            cart_item = await service.add_item(cart_id=cart.id, **item_in.model_dump())
            added_count += 1
            added_items.append(CartItemResponse.model_validate(cart_item))
        except ValueError as e:
            error_count += 1
            errors.append({"item": item_in.model_dump(), "error": str(e)})

    return success_response(
        {
            "added_count": added_count,
            "error_count": error_count,
            "added_items": added_items,
            "errors": errors,
        }
    )


@router.delete("/items/bulk", response_model=ApiSuccessResponse[dict])
async def remove_cart_items_bulk(
    item_ids: list[uuid.UUID] = Body(..., embed=True),
    cart_token: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Remove multiple items from the cart."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    from app.domains.shopping.models.cart import CartItem

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
                status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to modify this cart item"
            )

    for item in items:
        await db.delete(item)
    await db.commit()

    return success_response(
        {
            "removed_count": len(items),
        }
    )


@router.delete("/clear", response_model=ApiSuccessResponse[dict])
async def clear_cart(
    cart_token: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Clear all items from the current cart."""
    from sqlalchemy import delete

    from app.domains.shopping.models.cart import CartItem

    user_id = current_user.id if current_user else None
    service = CartService(db)

    cart = await service.get_or_create_cart(user_id=user_id, cart_token=cart_token)

    # Delete all items in the cart
    stmt = delete(CartItem).where(CartItem.cart_id == cart.id)
    result = await db.execute(stmt)
    await db.commit()

    return success_response(
        {
            "removed_count": result_rowcount(result),
        }
    )


@router.post("/validate", response_model=ApiSuccessResponse[CartValidationResponse])
async def validate_cart(
    cart_id: uuid.UUID = Query(...),
    cart_token: str | None = Query(None),
    current_user: User | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Validate cart for stock availability and price changes."""
    service = CartService(db)
    calc_service = CartCalculationService(db)

    try:
        cart = await service.get_by_id(cart_id)
        if not cart:
            raise ValueError("Cart not found")

        # Ownership check (raises 403/404 if caller does not own the cart)
        await _verify_cart_access(db, cart_id, current_user, cart_token)

        # Calculate totals
        totals = await calc_service.calculate_totals(cart_id)

        # Check for issues (simplified - should check stock, price changes, etc.)
        warnings: list[str] = []
        errors: list[str] = []

        if cart.items:
            for item in cart.items:
                if item.product and item.product.stock_quantity < item.quantity:
                    errors.append(f"{item.product.name}: Insufficient stock (available: {item.product.stock_quantity})")

        is_valid = len(errors) == 0

        return success_response(
            {
                "is_valid": is_valid,
                "cart_id": str(cart_id),
                "item_count": len(cart.items) if cart.items else 0,
                "errors": errors,
                "warnings": warnings,
                "subtotal": str(totals.get("subtotal", 0)),
                "estimated_total": str(totals.get("total", 0)),
            }
        )
    except ValueError as e:
        return success_response(
            {
                "is_valid": False,
                "cart_id": str(cart_id),
                "item_count": 0,
                "errors": [str(e)],
                "warnings": [],
                "subtotal": "0",
                "estimated_total": "0",
            }
        )
