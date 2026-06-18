import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.config import settings
from app.core.dependencies import get_current_user, require_role
from app.domains.auth.models.user import User
from app.domains.customers.services.customer_service import CustomerService
from app.domains.customers.schemas.customer_schemas import (
    CustomerResponse, CustomerProfileUpdate, AddressResponse, AddressCreate, AddressUpdate,
    LoyaltyStatusResponse, WishlistItemResponse, WishlistItemCreate, ReviewResponse, ReviewCreate, ReviewUpdate,
    LoyaltySummaryResponse, LoyaltyLedgerResponse, PointsRedeemRequest
)
from app.domains.customers.services.loyalty_service import LoyaltyService

router = APIRouter(tags=["Customers"])

@router.get("/me", response_model=ApiSuccessResponse[CustomerResponse])
async def get_my_profile(
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    profile = await service.get_profile(current_user.id)
    
    # Flatten response to match schema
    return success_response({
        "id": profile.id,
        "user_id": profile.user_id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "avatar_url": profile.avatar_url,
        "loyalty_tier": profile.loyalty_tier,
        "loyalty_points": profile.loyalty_points,
        "marketing_enabled": profile.marketing_enabled,
        "email_order_updates": profile.email_order_updates,
        "email_promotions": profile.email_promotions,
        "email_newsletter": profile.email_newsletter,
        "email_security": profile.email_security,
        "sms_order_updates": profile.sms_order_updates,
        "sms_promotions": profile.sms_promotions,
        "sms_security": profile.sms_security,
        "email_frequency": profile.email_frequency,
        "language": profile.language,
        "timezone": profile.timezone,
        "items_per_page": profile.items_per_page,
        "default_sort": profile.default_sort,
        "show_recently_viewed": profile.show_recently_viewed,
        "reduced_motion": profile.reduced_motion,
        "font_size": profile.font_size,
        "high_contrast": profile.high_contrast,
        "notes": profile.notes,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    })

@router.put("/me", response_model=ApiSuccessResponse[CustomerResponse])
async def update_my_profile(
    data: CustomerProfileUpdate,
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    profile = await service.update_profile(current_user.id, data)
    
    return success_response({
        "id": profile.id,
        "user_id": profile.user_id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "avatar_url": profile.avatar_url,
        "loyalty_tier": profile.loyalty_tier,
        "loyalty_points": profile.loyalty_points,
        "marketing_enabled": profile.marketing_enabled,
        "email_order_updates": profile.email_order_updates,
        "email_promotions": profile.email_promotions,
        "email_newsletter": profile.email_newsletter,
        "email_security": profile.email_security,
        "sms_order_updates": profile.sms_order_updates,
        "sms_promotions": profile.sms_promotions,
        "sms_security": profile.sms_security,
        "email_frequency": profile.email_frequency,
        "language": profile.language,
        "timezone": profile.timezone,
        "items_per_page": profile.items_per_page,
        "default_sort": profile.default_sort,
        "show_recently_viewed": profile.show_recently_viewed,
        "reduced_motion": profile.reduced_motion,
        "font_size": profile.font_size,
        "high_contrast": profile.high_contrast,
        "notes": profile.notes,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    })

@router.post("/me/avatar", response_model=ApiSuccessResponse[dict])
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    """Upload avatar image for the current user."""
    service = CustomerService(db)
    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
    if file_ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image format")
    upload_dir = settings.AVATAR_UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{uuid.uuid4()}{file_ext}"
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    avatar_url = f"/static/uploads/avatars/{filename}"
    profile = await service.update_profile(current_user.id, CustomerProfileUpdate(avatar_url=avatar_url))
    return success_response({"avatar_url": profile.avatar_url})

@router.get("/me/loyalty", response_model=ApiSuccessResponse[LoyaltyStatusResponse])
async def get_my_loyalty_status(
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    status_data = await service.get_loyalty_status(current_user.id)
    return success_response(status_data)

# Address Management
@router.get("/addresses", response_model=ApiSuccessResponse[List[AddressResponse]])
async def get_my_addresses(
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    addresses = await service.get_addresses(current_user.id)
    return success_response(list(addresses))

@router.post("/addresses", response_model=ApiSuccessResponse[AddressResponse])
async def create_my_address(
    data: AddressCreate,
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    address = await service.create_address(current_user.id, data)
    return success_response(address)

@router.put("/addresses/{address_id}", response_model=ApiSuccessResponse[AddressResponse])
async def update_my_address(
    address_id: uuid.UUID,
    data: AddressUpdate,
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    address = await service.update_address(current_user.id, address_id, data)
    return success_response(address)

@router.delete("/addresses/{address_id}")
async def delete_my_address(
    address_id: uuid.UUID,
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    await service.delete_address(current_user.id, address_id)
    return success_response({"message": "Address deleted successfully"})

@router.get("/addresses/default/shipping", response_model=ApiSuccessResponse[AddressResponse])
async def get_my_default_shipping_address(
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    address = await service.get_default_address(current_user.id, "shipping")
    if not address:
        raise HTTPException(status_code=404, detail="No default shipping address found")
    return success_response(address)

@router.get("/addresses/default/billing", response_model=ApiSuccessResponse[AddressResponse])
async def get_my_default_billing_address(
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    address = await service.get_default_address(current_user.id, "billing")
    if not address:
        raise HTTPException(status_code=404, detail="No default billing address found")
    return success_response(address)

@router.put("/addresses/{address_id}/default", response_model=ApiSuccessResponse[AddressResponse])
async def set_my_default_address(
    address_id: uuid.UUID,
    payload: dict, # Should contain {"type": "shipping" | "billing"}
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    address_type = payload.get("type", "shipping")
    address = await service.set_default_address(current_user.id, address_id, address_type)
    return success_response(address)

# Wishlist Management
@router.get("/wishlist", response_model=ApiSuccessResponse[List[WishlistItemResponse]])
async def get_my_wishlist(
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    items = await service.get_wishlist(current_user.id)
    return success_response(list(items))

@router.post("/wishlist", response_model=ApiSuccessResponse[WishlistItemResponse])
async def add_to_my_wishlist(
    data: WishlistItemCreate,
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    item = await service.add_to_wishlist(current_user.id, data)
    return success_response(item)

@router.put("/wishlist/items/{item_id}", response_model=ApiSuccessResponse[WishlistItemResponse])
async def update_my_wishlist_item(
    item_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    notes = payload.get("notes")
    item = await service.update_wishlist_item(current_user.id, item_id, notes)
    return success_response(item)

@router.delete("/wishlist/items/{item_id}")
async def remove_from_my_wishlist(
    item_id: uuid.UUID,
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    await service.remove_from_wishlist(current_user.id, item_id)
    return success_response({"message": "Item removed from wishlist"})

@router.delete("/wishlist")
async def clear_my_wishlist(
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    await service.clear_wishlist(current_user.id)
    return success_response({"message": "Wishlist cleared"})

# Reviews Management
@router.get("/reviews", response_model=ApiSuccessResponse[List[ReviewResponse]])
async def get_my_reviews(
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    reviews = await service.get_reviews(current_user.id)
    return success_response(list(reviews))

@router.post("/reviews", response_model=ApiSuccessResponse[ReviewResponse])
async def create_my_review(
    data: ReviewCreate,
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    review = await service.create_review(current_user.id, data)
    return success_response(review)

@router.put("/reviews/{review_id}", response_model=ApiSuccessResponse[ReviewResponse])
async def update_my_review(
    review_id: uuid.UUID,
    data: ReviewUpdate,
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    review = await service.update_review(current_user.id, review_id, data)
    return success_response(review)

@router.delete("/reviews/{review_id}")
async def delete_my_review(
    review_id: uuid.UUID,
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    await service.delete_review(current_user.id, review_id)
    return success_response({"message": "Review deleted successfully"})

# ============================================================================
# Loyalty Endpoints
# ============================================================================

@router.get("/me/loyalty/summary", response_model=ApiSuccessResponse[LoyaltySummaryResponse])
async def get_loyalty_summary(
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    """Get loyalty program summary with tier info and progress."""
    service = LoyaltyService(db)
    summary = await service.get_summary(current_user.id)
    return success_response(summary)

@router.get("/me/loyalty/ledger", response_model=ApiSuccessResponse[LoyaltyLedgerResponse])
async def get_loyalty_ledger(
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db),
    page: int = 1,
    limit: int = 20,
    transaction_type: Optional[str] = None
):
    """Get loyalty points ledger/history."""
    service = LoyaltyService(db)
    offset = (page - 1) * limit
    entries, total = await service.get_ledger(
        current_user.id,
        transaction_type=transaction_type,
        offset=offset,
        limit=limit
    )
    return success_response({
        "items": entries,
        "total": total,
        "page": page,
        "limit": limit
    })

@router.post("/me/loyalty/redeem", response_model=ApiSuccessResponse[dict])
async def redeem_loyalty_points(
    request: PointsRedeemRequest,
    current_user: User = Depends(require_role("customer")),
    db: AsyncSession = Depends(get_db)
):
    """Redeem loyalty points."""
    service = LoyaltyService(db)
    entry = await service.redeem_points(
        current_user.id,
        request.points,
        request.description
    )
    return success_response({
        "message": f"Successfully redeemed {request.points} points",
        "entry_id": str(entry.id),
        "new_balance": entry.balance_after
    })
