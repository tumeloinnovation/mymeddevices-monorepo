"""
Vendor Review Management API

Endpoints for vendors to view and moderate reviews on their products.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.customers.repositories.customer_repository import ReviewRepository
from app.domains.customers.schemas.customer_schemas import (
    ReviewModerationRequest,
    ReviewResponse,
)
from app.domains.vendor.models.vendor_profile import VendorProfile

router = APIRouter(prefix="/vendors", tags=["Vendor Reviews"])


async def get_vendor_profile_from_user(user: User, db: AsyncSession) -> VendorProfile | None:
    """Helper to get vendor profile from authenticated user."""
    stmt = select(VendorProfile).where(VendorProfile.user_id == user.id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


def format_vendor_review(review) -> dict:
    """Format review response for vendor with additional context"""
    customer_user = review.customer.user if (review.customer and hasattr(review.customer, "user")) else None
    product = review.product if hasattr(review, "product") else None

    return {
        "id": str(review.id),
        "customer_id": str(review.customer_id),
        "product_id": str(review.product_id),
        "rating": review.rating,
        "comment": review.comment,
        "is_verified_purchase": review.is_verified_purchase,
        "contains_profanity": review.contains_profanity,
        "flagged_words": review.flagged_words,
        "moderation_status": review.moderation_status,
        "moderation_reason": review.moderation_reason,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
        # Add customer info
        "customer_email": customer_user.email if customer_user else None,
        "customer_name": (
            f"{customer_user.first_name} {customer_user.last_name}".strip()
            if customer_user
            and (getattr(customer_user, "first_name", None) or getattr(customer_user, "last_name", None))
            else (customer_user.email if customer_user else None)
        ),
        # Add product info
        "product_name": product.name if product else None,
    }


@router.get("/me/reviews", response_model=ApiSuccessResponse[dict])
async def get_vendor_reviews(
    current_user: Annotated[User, Depends(require_role("vendor"))],
    moderation_status: str | None = Query(None, description="Filter by moderation status"),
    contains_profanity: bool | None = Query(None, description="Filter by profanity flag"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Get reviews for vendor's products with filtering and pagination.
    Vendors can see all reviews on their products.
    """
    vendor_profile = await get_vendor_profile_from_user(current_user, db)
    if not vendor_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    review_repo = ReviewRepository(db)

    # Get reviews and total count
    reviews, total = await review_repo.get_vendor_reviews(
        vendor_id=vendor_profile.id, moderation_status=moderation_status, limit=limit, offset=(page - 1) * limit
    )

    # Filter by profanity if specified
    if contains_profanity is not None:
        reviews = [r for r in reviews if r.contains_profanity == contains_profanity]
        total = len(reviews)

    # Format reviews
    formatted_reviews = [format_vendor_review(r) for r in reviews]

    return success_response({"reviews": formatted_reviews, "total": total, "page": page, "limit": limit})


@router.put("/me/reviews/{review_id}/moderate", response_model=ApiSuccessResponse[ReviewResponse])
async def moderate_vendor_review(
    review_id: uuid.UUID,
    data: ReviewModerationRequest,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db),
):
    """
    Moderate a review on vendor's product.
    Vendors can hide or remove reviews, but cannot show hidden reviews.
    """
    vendor_profile = await get_vendor_profile_from_user(current_user, db)
    if not vendor_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    review_repo = ReviewRepository(db)

    # Get the review
    review = await review_repo.get_with_details(review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    # Verify review belongs to vendor's product
    if not review.product or review.product.vendor_id != vendor_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You can only moderate reviews on your own products"
        )

    # SECURITY: Vendors can only hide or remove reviews, not show them
    # Only admin should be able to set moderation_status to "visible"
    if data.moderation_status == "visible":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendors cannot show hidden reviews. Contact admin to review this decision.",
        )

    # Moderate the review
    moderated_review = await review_repo.moderate_review(
        review_id=review_id,
        moderation_status=data.moderation_status,
        moderated_by_id=current_user.id,
        reason=data.reason,
    )

    return success_response(format_vendor_review(moderated_review))


@router.get("/me/reviews/summary", response_model=ApiSuccessResponse[dict])
async def get_vendor_reviews_summary(
    current_user: Annotated[User, Depends(require_role("vendor"))], db: AsyncSession = Depends(get_db)
):
    """
    Get summary statistics for vendor's reviews.
    Includes total reviews, average rating, flagged reviews count.
    """
    vendor_profile = await get_vendor_profile_from_user(current_user, db)
    if not vendor_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    review_repo = ReviewRepository(db)

    # Get all reviews
    reviews, total = await review_repo.get_vendor_reviews(vendor_id=vendor_profile.id, limit=10000, offset=0)

    # Calculate stats
    visible_count = sum(1 for r in reviews if r.moderation_status == "visible")
    hidden_count = sum(1 for r in reviews if r.moderation_status == "hidden")
    removed_count = sum(1 for r in reviews if r.moderation_status == "removed")
    profanity_count = sum(1 for r in reviews if r.contains_profanity)
    verified_count = sum(1 for r in reviews if r.is_verified_purchase)

    avg_rating = 0.0
    if reviews:
        avg_rating = sum(r.rating for r in reviews) / len(reviews)

    # Rating distribution
    rating_distribution = {str(i): 0 for i in range(1, 6)}
    for review in reviews:
        rating_distribution[str(review.rating)] += 1

    return success_response(
        {
            "total_reviews": total,
            "average_rating": round(avg_rating, 1),
            "visible_reviews": visible_count,
            "hidden_reviews": hidden_count,
            "removed_reviews": removed_count,
            "flagged_profanity": profanity_count,
            "verified_purchases": verified_count,
            "rating_distribution": rating_distribution,
        }
    )
