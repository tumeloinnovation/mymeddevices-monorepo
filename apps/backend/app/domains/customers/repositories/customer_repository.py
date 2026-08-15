import uuid
from collections.abc import Sequence
from datetime import UTC

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.customers.models.address import Address
from app.domains.customers.models.customer_profile import CustomerProfile
from app.domains.customers.models.review import Review
from app.domains.customers.models.wishlist import WishlistItem
from app.domains.shared.repositories import BaseRepository


class CustomerRepository(BaseRepository[CustomerProfile]):
    def __init__(self, db: AsyncSession):
        super().__init__(CustomerProfile, db)

    async def get_by_user_id(self, user_id: uuid.UUID) -> CustomerProfile | None:
        stmt = (
            select(CustomerProfile)
            .where(CustomerProfile.user_id == user_id)
            .options(selectinload(CustomerProfile.user))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_or_create_profile(self, user_id: uuid.UUID) -> CustomerProfile:
        profile = await self.get_by_user_id(user_id)
        if not profile:
            profile = CustomerProfile(user_id=user_id)
            self.db.add(profile)
            await self.db.flush()
            # Reload with user
            profile = await self.get_by_user_id(user_id)
            if profile is None:
                raise ValueError("Failed to create customer profile")
        return profile


class AddressRepository(BaseRepository[Address]):
    def __init__(self, db: AsyncSession):
        super().__init__(Address, db)

    async def get_customer_addresses(self, customer_id: uuid.UUID) -> Sequence[Address]:
        stmt = (
            select(Address)
            .where(Address.customer_id == customer_id)
            .order_by(Address.is_default.desc(), Address.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_default_address(self, customer_id: uuid.UUID, address_type: str) -> Address | None:
        stmt = select(Address).where(
            and_(Address.customer_id == customer_id, Address.type == address_type, Address.is_default == True)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def unset_defaults(self, customer_id: uuid.UUID, address_type: str):
        from sqlalchemy import update

        stmt = (
            update(Address)
            .where(and_(Address.customer_id == customer_id, Address.type == address_type))
            .values(is_default=False)
        )
        await self.db.execute(stmt)


class WishlistRepository(BaseRepository[WishlistItem]):
    def __init__(self, db: AsyncSession):
        super().__init__(WishlistItem, db)

    async def get_customer_wishlist(self, customer_id: uuid.UUID) -> Sequence[WishlistItem]:
        from app.domains.catalog.models.product import Product

        stmt = (
            select(WishlistItem)
            .where(WishlistItem.customer_id == customer_id)
            .options(
                selectinload(WishlistItem.product).options(
                    selectinload(Product.images),
                    selectinload(Product.variants),
                    selectinload(Product.bundle_items),
                    selectinload(Product.related_products),
                )
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_item_by_product(self, customer_id: uuid.UUID, product_id: uuid.UUID) -> WishlistItem | None:
        from app.domains.catalog.models.product import Product

        stmt = (
            select(WishlistItem)
            .where(WishlistItem.customer_id == customer_id, WishlistItem.product_id == product_id)
            .options(
                selectinload(WishlistItem.product).options(
                    selectinload(Product.images),
                    selectinload(Product.variants),
                    selectinload(Product.bundle_items),
                    selectinload(Product.related_products),
                )
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()


class ReviewRepository(BaseRepository[Review]):
    def __init__(self, db: AsyncSession):
        super().__init__(Review, db)

    async def get_with_details(self, review_id: uuid.UUID) -> Review | None:
        """Get a single review with customer.user and product.vendor eagerly loaded."""
        from app.domains.catalog.models.product import Product

        stmt = (
            select(Review)
            .where(Review.id == review_id)
            .options(
                selectinload(Review.customer).selectinload(CustomerProfile.user),
                selectinload(Review.product).selectinload(Product.vendor),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_customer_reviews(self, customer_id: uuid.UUID) -> Sequence[Review]:
        from app.domains.catalog.models.product import Product

        stmt = (
            select(Review)
            .where(Review.customer_id == customer_id)
            .options(selectinload(Review.product).selectinload(Product.vendor))
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_product_reviews(self, product_id: uuid.UUID, include_hidden: bool = False) -> Sequence[Review]:
        """Get reviews for a product, optionally filtering by moderation status."""
        from app.domains.catalog.models.product import Product

        # Build the query with eager loading
        stmt = (
            select(Review)
            .where(Review.product_id == product_id)
            .options(
                selectinload(Review.customer).selectinload(CustomerProfile.user),
                selectinload(Review.product).selectinload(Product.vendor),
            )
            .order_by(Review.created_at.desc())
        )

        # Filter by moderation status if not showing hidden
        if not include_hidden:
            stmt = stmt.where(Review.moderation_status == "visible")

        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_vendor_reviews(
        self, vendor_id: uuid.UUID, moderation_status: str | None = None, limit: int = 100, offset: int = 0
    ) -> tuple[Sequence[Review], int]:
        """Get reviews for all products belonging to a vendor."""
        from sqlalchemy import func

        from app.domains.catalog.models.product import Product

        # Build base query for reviews
        count_stmt = (
            select(func.count(Review.id))
            .join(Product, Review.product_id == Product.id)
            .where(Product.vendor_id == vendor_id)
        )

        review_stmt = (
            select(Review)
            .join(Product, Review.product_id == Product.id)
            .where(Product.vendor_id == vendor_id)
            .options(
                selectinload(Review.customer).selectinload(CustomerProfile.user),
                selectinload(Review.product).selectinload(Product.vendor),
            )
            .order_by(Review.created_at.desc())
            .limit(limit)
            .offset(offset)
        )

        # Filter by moderation status if provided
        if moderation_status:
            count_stmt = count_stmt.where(Review.moderation_status == moderation_status)
            review_stmt = review_stmt.where(Review.moderation_status == moderation_status)

        # Execute queries
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        reviews_result = await self.db.execute(review_stmt)
        reviews = reviews_result.scalars().all()

        return reviews, total

    async def get_flagged_reviews(
        self, contains_profanity: bool = True, limit: int = 100, offset: int = 0
    ) -> tuple[Sequence[Review], int]:
        """Get flagged reviews for admin moderation."""
        from sqlalchemy import func, or_

        from app.domains.catalog.models.product import Product

        # Build query
        base_query = (
            select(Review)
            .options(
                selectinload(Review.customer).selectinload(CustomerProfile.user),
                selectinload(Review.product).selectinload(Product.vendor),
            )
            .order_by(Review.created_at.desc())
        )

        # Filter by profanity flag or moderation status
        if contains_profanity:
            base_query = base_query.where(
                or_(Review.contains_profanity == True, Review.moderation_status.in_(["hidden", "removed"]))
            )

        # Get count
        count_stmt = select(func.count()).select_from(base_query.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        # Get paginated results
        review_stmt = base_query.limit(limit).offset(offset)
        result = await self.db.execute(review_stmt)
        reviews = result.scalars().all()

        return reviews, total

    async def moderate_review(
        self,
        review_id: uuid.UUID,
        moderation_status: str,
        moderated_by_id: uuid.UUID | None = None,
        reason: str | None = None,
    ) -> Review | None:
        """Update moderation status of a review."""
        from datetime import datetime

        review = await self.get(review_id)
        if not review:
            return None

        review.moderation_status = moderation_status
        review.moderated_by = moderated_by_id
        review.moderation_reason = reason
        review.moderated_at = datetime.now(UTC)
        await self.db.commit()

        return await self.get_with_details(review_id)
