from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.shopping.api.dependencies import get_optional_current_user
from app.domains.shopping.schemas.order_schemas import OrderCreate, OrderResponse
from app.domains.shopping.services.order_service import CheckoutService

router = APIRouter(prefix="/checkout", tags=["Checkout"])


@router.post("", response_model=ApiSuccessResponse[OrderResponse], status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    current_user: User | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Convert an active cart into a pending order."""
    service = CheckoutService(db)
    try:
        order = await service.create_order_from_cart(
            cart_id=data.cart_id,
            user_id=current_user.id if current_user else None,
            shipping_address=data.shipping_address.model_dump() if data.shipping_address else None,
            notes=data.notes,
            idempotency_key=data.idempotency_key,
            guest_token=data.guest_token,
            points_to_redeem=data.points_to_redeem,
        )
        await db.commit()
        return success_response(order)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
