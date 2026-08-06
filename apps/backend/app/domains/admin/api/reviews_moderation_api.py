"""
Admin Review Moderation API

Endpoints for admins to view and moderate all reviews across the platform.
"""
import uuid
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.dependencies import require_role
from app.domains.auth.models.user import User
from app.domains.customers.repositories.customer_repository import ReviewRepository
from app.domains.customers.schemas.customer_schemas import (
    ReviewResponse,
    VendorReviewResponse,
    ReviewModerationRequest,
)

router = APIRouter(prefix="/admin", tags=["Admin Reviews"])


def format_admin_review(review) -> dict:
    """Format review response for admin with full context"""
    customer_user = review.customer.user if (review.customer and hasattr(review.customer, "user")) else None
    product = review.product if hasattr(review, "product") else None
    vendor = product.vendor if (product and hasattr(product, "vendor")) else None

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
        "moderated_by": str(review.moderated_by) if review.moderated_by else None,
        "moderated_at": review.moderated_at,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
        # Add customer info
        "customer_email": customer_user.email if customer_user else None,
        "customer_name": (
            f"{customer_user.first_name} {customer_user.last_name}".strip()
            if customer_user and (getattr(customer_user, "first_name", None) or getattr(customer_user, "last_name", None))
            else (customer_user.email if customer_user else None)
        ),
        # Add product info
        "product_name": product.name if product else None,
        "vendor_id": str(product.vendor_id) if product and getattr(product, "vendor_id", None) else None,
        "vendor_name": vendor.store_name if vendor else None,
    }


@router.get("/reviews", response_model=ApiSuccessResponse[dict])
async def get_all_reviews(
    current_user: Annotated[User, Depends(require_role("admin"))],
    moderation_status: Optional[str] = Query(None, description="Filter by moderation status"),
    contains_profanity: Optional[bool] = Query(None, description="Filter by profanity flag"),
    vendor_id: Optional[str] = Query(None, description="Filter by vendor ID"),
    product_id: Optional[str] = Query(None, description="Filter by product ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all reviews across the platform with filtering and pagination.
    Admins can see all reviews regardless of moderation status.
    """
    review_repo = ReviewRepository(db)

    # Get flagged reviews or all reviews
    if contains_profanity is True or moderation_status in ["hidden", "removed"]:
        reviews, total = await review_repo.get_flagged_reviews(
            contains_profanity=contains_profanity if contains_profanity is not None else True,
            limit=limit,
            offset=(page - 1) * limit
        )
    else:
        # Get all reviews (vendor-specific method works for getting reviews)
        # For now, let's implement a simpler approach
        from sqlalchemy import select, and_
        from app.domains.customers.models.review import Review
        from app.domains.catalog.models.product import Product
        from app.domains.customers.models.customer_profile import CustomerProfile
        from sqlalchemy.orm import selectinload
        from sqlalchemy import func

        # Build base query
        stmt = (
            select(Review)
            .options(
                selectinload(Review.customer).selectinload(CustomerProfile.user),
                selectinload(Review.product).selectinload(Product.vendor),
            )
            .join(Product, Review.product_id == Product.id)
            .order_by(Review.created_at.desc())
        )

        # Apply filters
        if moderation_status:
            stmt = stmt.where(Review.moderation_status == moderation_status)
        if contains_profanity is not None:
            stmt = stmt.where(Review.contains_profanity == contains_profanity)
        if vendor_id:
            stmt = stmt.where(Product.vendor_id == uuid.UUID(vendor_id))
        if product_id:
            stmt = stmt.where(Review.product_id == uuid.UUID(product_id))

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar_one()

        # Get paginated results
        stmt = stmt.limit(limit).offset((page - 1) * limit)
        result = await db.execute(stmt)
        reviews = result.scalars().all()

    # Format reviews
    formatted_reviews = [format_admin_review(r) for r in reviews]

    return success_response({
        "reviews": formatted_reviews,
        "total": total,
        "page": page,
        "limit": limit
    })


@router.put("/reviews/{review_id}/moderate", response_model=ApiSuccessResponse[ReviewResponse])
async def moderate_review_admin(
    review_id: uuid.UUID,
    data: ReviewModerationRequest,
    current_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db)
):
    """
    Moderate any review on the platform.
    Admins can change any review's moderation status.
    """
    review_repo = ReviewRepository(db)

    # Get the review
    review = await review_repo.get_with_details(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    # Moderate the review
    moderated_review = await review_repo.moderate_review(
        review_id=review_id,
        moderation_status=data.moderation_status,
        moderated_by_id=current_user.id,
        reason=data.reason
    )

    return success_response(format_admin_review(moderated_review))


@router.get("/reviews/summary", response_model=ApiSuccessResponse[dict])
async def get_reviews_summary_admin(
    current_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db)
):
    """
    Get platform-wide review statistics.
    """
    from sqlalchemy import select, func
    from app.domains.customers.models.review import Review

    # Get counts
    total_stmt = select(func.count()).select_from(Review)
    total_result = await db.execute(total_stmt)
    total = total_result.scalar_one()

    visible_stmt = select(func.count()).where(Review.moderation_status == "visible")
    visible_result = await db.execute(visible_stmt)
    visible_count = visible_result.scalar_one()

    hidden_stmt = select(func.count()).where(Review.moderation_status == "hidden")
    hidden_result = await db.execute(hidden_stmt)
    hidden_count = hidden_result.scalar_one()

    removed_stmt = select(func.count()).where(Review.moderation_status == "removed")
    removed_result = await db.execute(removed_stmt)
    removed_count = removed_result.scalar_one()

    profanity_stmt = select(func.count()).where(Review.contains_profanity == True)
    profanity_result = await db.execute(profanity_stmt)
    profanity_count = profanity_result.scalar_one()

    # Average rating
    avg_rating_stmt = select(func.avg(Review.rating))
    avg_result = await db.execute(avg_rating_stmt)
    avg_rating = avg_result.scalar_one() or 0

    # Rating distribution
    rating_distribution = {}
    for i in range(1, 6):
        rating_stmt = select(func.count()).where(Review.rating == i)
        rating_result = await db.execute(rating_stmt)
        rating_distribution[str(i)] = rating_result.scalar_one()

    return success_response({
        "total_reviews": total,
        "average_rating": round(avg_rating, 1),
        "visible_reviews": visible_count,
        "hidden_reviews": hidden_count,
        "removed_reviews": removed_count,
        "flagged_profanity": profanity_count,
        "rating_distribution": rating_distribution
    })


@router.get("/reviews/flagged", response_model=ApiSuccessResponse[dict])
async def get_flagged_reviews(
    current_user: Annotated[User, Depends(require_role("admin"))],
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get reviews flagged for profanity or moderation.
    This is the primary moderation queue for admins.
    """
    review_repo = ReviewRepository(db)

    reviews, total = await review_repo.get_flagged_reviews(
        contains_profanity=True,
        limit=limit,
        offset=(page - 1) * limit
    )

    formatted_reviews = [format_admin_review(r) for r in reviews]

    return success_response({
        "reviews": formatted_reviews,
        "total": total,
        "page": page,
        "limit": limit
    })
