import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.returns.schemas.return_schemas import (
    ReturnRequestCreate,
    ReturnRequestListResponse,
    ReturnRequestResponse,
    ReturnRequestUpdate,
)
from app.domains.returns.services.return_service import ReturnService

router = APIRouter(prefix="/returns", tags=["Returns"])


@router.post("", response_model=ApiSuccessResponse[ReturnRequestResponse])
async def create_return_request(
    return_in: ReturnRequestCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Create a new return request."""
    service = ReturnService(db)
    return_request = await service.create_return(current_user.id, return_in)
    return success_response(_return_to_response(return_request))


@router.get("", response_model=ApiSuccessResponse[ReturnRequestListResponse])
async def list_my_returns(
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
):
    """List my return requests."""
    service = ReturnService(db)
    offset = (page - 1) * limit

    returns, total = await service.list_returns(
        customer_id=current_user.id,
        status=status_filter,
        offset=offset,
        limit=limit,
    )

    return success_response(
        ReturnRequestListResponse(
            items=[_return_to_response(r) for r in returns],
            total=total,
            page=page,
            limit=limit,
        )
    )


@router.get("/{return_id}", response_model=ApiSuccessResponse[ReturnRequestResponse])
async def get_return_details(
    return_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Get return request details."""
    service = ReturnService(db)
    return_request = await service.get_return(return_id)

    if not return_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Return request not found")

    # Verify ownership
    if return_request.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return success_response(_return_to_response(return_request))


@router.get("/number/{return_number}", response_model=ApiSuccessResponse[ReturnRequestResponse])
async def get_return_by_number(
    return_number: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Get return request by return number."""
    service = ReturnService(db)
    return_request = await service.get_return_by_number(return_number)

    if not return_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Return request not found")

    # Verify ownership
    if return_request.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return success_response(_return_to_response(return_request))


@router.put("/{return_id}", response_model=ApiSuccessResponse[ReturnRequestResponse])
async def update_return_request(
    return_id: uuid.UUID,
    return_in: ReturnRequestUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Update return request (limited fields)."""
    service = ReturnService(db)
    return_request = await service.get_return(return_id)

    if not return_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Return request not found")

    # Verify ownership
    if return_request.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Only allow updates on pending returns
    if return_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update pending returns",
        )

    updated = await service.update_return(return_id, return_in)
    return success_response(_return_to_response(updated))


@router.post("/{return_id}/cancel", response_model=ApiSuccessResponse[ReturnRequestResponse])
async def cancel_return_request(
    return_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Cancel a return request."""
    service = ReturnService(db)
    return_request = await service.get_return(return_id)

    if not return_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Return request not found")

    # Verify ownership
    if return_request.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    try:
        cancelled = await service.cancel_return(return_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return success_response(_return_to_response(cancelled))


# ============================================================================
# ADMIN RETURN MANAGEMENT
# ============================================================================


@router.get("/admin/list", response_model=ApiSuccessResponse[ReturnRequestListResponse])
async def admin_list_all_returns(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
):
    """Admin lists all customer return requests."""
    service = ReturnService(db)
    offset = (page - 1) * limit

    returns, total = await service.list_returns(
        status=status_filter,
        offset=offset,
        limit=limit,
    )

    return success_response(
        ReturnRequestListResponse(
            items=[_return_to_response(r) for r in returns],
            total=total,
            page=page,
            limit=limit,
        )
    )


@router.put("/{return_id}/status", response_model=ApiSuccessResponse[ReturnRequestResponse])
async def admin_update_return_status(
    return_id: uuid.UUID,
    payload: dict,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """Admin updates status of a return request."""
    service = ReturnService(db)
    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status is required")

    try:
        updated = await service.update_status(return_id, new_status, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Return request not found")

    return success_response(_return_to_response(updated))


# Helper function
def _return_to_response(return_request) -> ReturnRequestResponse:
    """Convert return request model to response."""
    items_data = return_request.items or []

    return ReturnRequestResponse(
        id=return_request.id,
        return_number=return_request.return_number,
        customer_id=return_request.customer_id,
        order_id=return_request.order_id,
        status=return_request.status,
        reason=return_request.reason,
        description=return_request.description,
        items=[
            {
                "id": item.get("id", str(uuid.uuid4())),
                "order_item_id": item.get("order_item_id"),
                "product_id": item.get("product_id"),
                "product_name": item.get("product_name"),
                "quantity": item.get("quantity", 1),
                "reason": item.get("reason"),
                "condition": item.get("condition", "new"),
                "images": item.get("images"),
            }
            for item in items_data
        ],
        refund_method=return_request.refund_method,
        refund_amount=return_request.refund_amount,
        refund_transaction_id=return_request.refund_transaction_id,
        shipping_label=return_request.shipping_label,
        tracking_number=return_request.tracking_number,
        resolved_at=return_request.resolved_at,
        created_at=return_request.created_at,
        updated_at=return_request.updated_at,
    )
