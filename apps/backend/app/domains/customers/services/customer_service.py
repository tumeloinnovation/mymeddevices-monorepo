import uuid
from collections.abc import Sequence
from contextlib import asynccontextmanager

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.core.logging import logger
from app.domains.customers.models.address import Address
from app.domains.customers.models.customer_profile import CustomerProfile
from app.domains.customers.models.review import Review
from app.domains.customers.models.wishlist import WishlistItem
from app.domains.customers.repositories.customer_repository import (
    AddressRepository,
    CustomerRepository,
    ReviewRepository,
    WishlistRepository,
)
from app.domains.customers.schemas.customer_schemas import (
    AddressCreate,
    AddressUpdate,
    CustomerProfileUpdate,
    ReviewCreate,
    ReviewUpdate,
    WishlistItemCreate,
)
from app.domains.customers.services.google_places_service import GooglePlacesService


class CustomerService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.customer_repo = CustomerRepository(db)
        self.address_repo = AddressRepository(db)
        self.wishlist_repo = WishlistRepository(db)
        self.review_repo = ReviewRepository(db)
        self.places_service = GooglePlacesService()

    @asynccontextmanager
    async def _transaction(self):
        """Use begin_nested (SAVEPOINT) when already in a transaction."""
        if self.db.in_transaction():
            async with self.db.begin_nested():
                yield
        else:
            async with self.db.begin():
                yield

    async def get_profile(self, user_id: uuid.UUID) -> CustomerProfile:
        return await self.customer_repo.get_or_create_profile(user_id)

    async def update_profile(self, user_id: uuid.UUID, data: CustomerProfileUpdate) -> CustomerProfile:
        profile = await self.get_profile(user_id)
        user = profile.user

        # Update user fields if provided
        if data.first_name is not None:
            user.first_name = data.first_name
        if data.last_name is not None:
            user.last_name = data.last_name
        if data.phone is not None:
            user.phone = data.phone

        # Update profile fields
        if data.avatar_url is not None:
            profile.avatar_url = data.avatar_url
        if data.marketing_enabled is not None:
            profile.marketing_enabled = data.marketing_enabled
        if data.email_order_updates is not None:
            profile.email_order_updates = data.email_order_updates
        if data.email_promotions is not None:
            profile.email_promotions = data.email_promotions
        if data.email_newsletter is not None:
            profile.email_newsletter = data.email_newsletter
        if data.email_security is not None:
            profile.email_security = data.email_security
        if data.sms_order_updates is not None:
            profile.sms_order_updates = data.sms_order_updates
        if data.sms_promotions is not None:
            profile.sms_promotions = data.sms_promotions
        if data.sms_security is not None:
            profile.sms_security = data.sms_security
        if data.email_frequency is not None:
            profile.email_frequency = data.email_frequency
        if data.notes is not None:
            profile.notes = data.notes
        # Dashboard preferences
        if data.language is not None:
            profile.language = data.language
        if data.timezone is not None:
            profile.timezone = data.timezone
        if data.items_per_page is not None:
            profile.items_per_page = data.items_per_page
        if data.default_sort is not None:
            profile.default_sort = data.default_sort
        if data.show_recently_viewed is not None:
            profile.show_recently_viewed = data.show_recently_viewed
        if data.reduced_motion is not None:
            profile.reduced_motion = data.reduced_motion
        if data.font_size is not None:
            profile.font_size = data.font_size
        if data.high_contrast is not None:
            profile.high_contrast = data.high_contrast

        # Use transaction for atomic profile update
        async with self._transaction():
            await self.db.commit()

        await self.db.refresh(profile)
        return profile

    async def get_loyalty_status(self, user_id: uuid.UUID):
        profile = await self.get_profile(user_id)

        # Mock logic for loyalty tiers
        tiers = ["bronze", "silver", "gold", "platinum"]
        points_thresholds = [0, 1000, 5000, 10000]

        current_tier_idx = 0
        for i, threshold in enumerate(points_thresholds):
            if profile.loyalty_points >= threshold:
                current_tier_idx = i
            else:
                break

        next_tier = tiers[current_tier_idx + 1] if current_tier_idx < len(tiers) - 1 else None
        points_to_next = points_thresholds[current_tier_idx + 1] - profile.loyalty_points if next_tier else 0

        return {
            "customer_id": profile.id,
            "current_tier": tiers[current_tier_idx],
            "points_balance": profile.loyalty_points,
            "points_to_next_tier": points_to_next,
            "next_tier": next_tier,
            "total_earned": profile.loyalty_points,  # Simplification
            "total_redeemed": 0,
            "tier_benefits": ["Free shipping on orders over 5000 KES", "Exclusive early access to sales"],
        }

    # Address management
    async def get_addresses(self, user_id: uuid.UUID) -> Sequence[Address]:
        profile = await self.get_profile(user_id)
        return await self.address_repo.get_customer_addresses(profile.id)

    async def create_address(self, user_id: uuid.UUID, data: AddressCreate) -> Address:
        profile = await self.get_profile(user_id)

        # Validate place_id if provided with coordinates
        if data.place_id and data.latitude is not None and data.longitude is not None:
            is_valid, place_details = await self.places_service.validate_place(
                data.place_id, data.latitude, data.longitude
            )
            if not is_valid:
                raise HTTPException(
                    status_code=400, detail="Invalid place data. Coordinates do not match the provided place."
                )
            # Verify the place is in Kenya
            if place_details and not self.places_service.is_kenya_address(place_details):
                raise HTTPException(status_code=400, detail="Only Kenyan addresses are supported.")
            logger.info(f"Validated Google Place: {data.place_id}")

        if data.is_default:
            await self.address_repo.unset_defaults(profile.id, data.type)

        address = Address(customer_id=profile.id, **data.model_dump())
        return await self.address_repo.create(address)

    async def update_address(self, user_id: uuid.UUID, address_id: uuid.UUID, data: AddressUpdate) -> Address:
        profile = await self.get_profile(user_id)
        address = await self.address_repo.get(address_id)

        if not address or address.customer_id != profile.id:
            raise NotFoundError("Address", str(address_id))

        # Validate place_id if provided with coordinates
        if data.place_id and data.latitude is not None and data.longitude is not None:
            is_valid, place_details = await self.places_service.validate_place(
                data.place_id, data.latitude, data.longitude
            )
            if not is_valid:
                raise BusinessRuleError("Invalid place data. Coordinates do not match the provided place.")
            # Verify the place is in Kenya
            if place_details and not self.places_service.is_kenya_address(place_details):
                raise BusinessRuleError("Address must be within Kenya.")
            logger.info(f"Validated Google Place: {data.place_id}")

        if data.is_default:
            await self.address_repo.unset_defaults(profile.id, address.type)

        return await self.address_repo.update(address, data.model_dump(exclude_unset=True))

    async def delete_address(self, user_id: uuid.UUID, address_id: uuid.UUID):
        profile = await self.get_profile(user_id)
        address = await self.address_repo.get(address_id)

        if not address or address.customer_id != profile.id:
            raise HTTPException(status_code=404, detail="Address not found")

        await self.address_repo.delete(address_id)

    async def get_default_address(self, user_id: uuid.UUID, address_type: str) -> Address | None:
        profile = await self.get_profile(user_id)
        return await self.address_repo.get_default_address(profile.id, address_type)

    async def set_default_address(self, user_id: uuid.UUID, address_id: uuid.UUID, address_type: str) -> Address:
        profile = await self.get_profile(user_id)
        address = await self.address_repo.get(address_id)

        if not address or address.customer_id != profile.id:
            raise HTTPException(status_code=404, detail="Address not found")

        await self.address_repo.unset_defaults(profile.id, address_type)
        return await self.address_repo.update(address, {"is_default": True, "type": address_type})

    # Wishlist
    async def get_wishlist(self, user_id: uuid.UUID) -> Sequence[WishlistItem]:
        profile = await self.get_profile(user_id)
        return await self.wishlist_repo.get_customer_wishlist(profile.id)

    async def add_to_wishlist(self, user_id: uuid.UUID, data: WishlistItemCreate) -> WishlistItem:
        profile = await self.get_profile(user_id)

        existing = await self.wishlist_repo.get_item_by_product(profile.id, data.product_id)
        if existing:
            return existing

        item = WishlistItem(id=uuid.uuid4(), customer_id=profile.id, product_id=data.product_id, notes=data.notes)
        await self.wishlist_repo.create(item)
        result = await self.wishlist_repo.get_item_by_product(profile.id, data.product_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Wishlist item not found")
        return result

    async def update_wishlist_item(self, user_id: uuid.UUID, item_id: uuid.UUID, notes: str | None) -> WishlistItem:
        profile = await self.get_profile(user_id)
        item = await self.wishlist_repo.get(item_id)

        if not item or item.customer_id != profile.id:
            raise HTTPException(status_code=404, detail="Wishlist item not found")

        return await self.wishlist_repo.update(item, {"notes": notes})

    async def remove_from_wishlist(self, user_id: uuid.UUID, item_id: uuid.UUID):
        profile = await self.get_profile(user_id)
        item = await self.wishlist_repo.get(item_id)

        if not item or item.customer_id != profile.id:
            raise HTTPException(status_code=404, detail="Wishlist item not found")

        await self.wishlist_repo.delete(item_id)

    async def clear_wishlist(self, user_id: uuid.UUID):
        profile = await self.get_profile(user_id)
        from sqlalchemy import delete

        # Use transaction for atomic wishlist clear
        async with self._transaction():
            stmt = delete(WishlistItem).where(WishlistItem.customer_id == profile.id)
            await self.db.execute(stmt)
            await self.db.commit()

    # Reviews
    async def get_reviews(self, user_id: uuid.UUID) -> Sequence[Review]:
        profile = await self.get_profile(user_id)
        return await self.review_repo.get_customer_reviews(profile.id)

    async def create_review(self, user_id: uuid.UUID, data: ReviewCreate) -> Review:
        profile = await self.get_profile(user_id)

        # Check if user already reviewed this product
        existing = await self.review_repo.get_by(customer_id=profile.id, product_id=data.product_id)
        if existing:
            raise HTTPException(status_code=400, detail="You have already reviewed this product")

        # Check if user actually purchased the product to set is_verified_purchase
        from sqlalchemy import select

        from app.domains.shopping.models.order import Order, OrderItem, OrderStatus

        purchase_stmt = (
            select(Order.id)
            .join(OrderItem, OrderItem.order_id == Order.id)
            .where(
                Order.user_id == user_id,
                OrderItem.product_id == data.product_id,
                Order.status.in_(
                    [OrderStatus.DELIVERED.value, OrderStatus.SHIPPED.value, OrderStatus.PROCESSING.value]
                ),
            )
            .limit(1)
        )
        purchase_result = await self.db.execute(purchase_stmt)
        is_verified = purchase_result.scalar_one_or_none() is not None

        # Check for profanity
        from app.domains.customers.services.profanity_filter_service import profanity_filter

        contains_profanity, flagged_words = profanity_filter.check_text(data.comment)

        # Create review with profanity detection
        review = Review(
            customer_id=profile.id,
            is_verified_purchase=is_verified,
            contains_profanity=contains_profanity,
            flagged_words=flagged_words if contains_profanity else None,
            moderation_status="hidden" if contains_profanity else "visible",
            **data.model_dump(),
        )
        created = await self.review_repo.create(review)

        # Award 25 loyalty points for non-profane, visible reviews
        if created.moderation_status == "visible" and not created.contains_profanity:
            try:
                from app.domains.customers.services.loyalty_service import LoyaltyService

                loyalty = LoyaltyService(self.db)
                await loyalty.earn_points(
                    customer_id=user_id,
                    points=25,
                    description="Bonus for product review",
                    reference_type="review",
                    reference_id=created.id,
                )
            except Exception as e:
                import logging

                logger = logging.getLogger(__name__)
                logger.error(f"Failed to award review loyalty points: {e}")

        result = await self.review_repo.get_with_details(created.id)
        if result is None:
            raise HTTPException(status_code=404, detail="Review not found")
        return result

    async def update_review(self, user_id: uuid.UUID, review_id: uuid.UUID, data: ReviewUpdate) -> Review:
        profile = await self.get_profile(user_id)
        review = await self.review_repo.get(review_id)

        if not review or review.customer_id != profile.id:
            raise HTTPException(status_code=404, detail="Review not found")

        update_data = data.model_dump(exclude_unset=True)
        if "comment" in update_data and update_data["comment"]:
            from app.domains.customers.services.profanity_filter_service import profanity_filter

            contains_profanity, flagged_words = profanity_filter.check_text(update_data["comment"])
            update_data["contains_profanity"] = contains_profanity
            update_data["flagged_words"] = flagged_words if contains_profanity else None
            if contains_profanity:
                update_data["moderation_status"] = "hidden"

        await self.review_repo.update(review, update_data)
        result = await self.review_repo.get_with_details(review.id)
        if result is None:
            raise HTTPException(status_code=404, detail="Review not found")
        return result

    async def delete_review(self, user_id: uuid.UUID, review_id: uuid.UUID):
        profile = await self.get_profile(user_id)
        review = await self.review_repo.get(review_id)

        if not review or review.customer_id != profile.id:
            raise HTTPException(status_code=404, detail="Review not found")

        await self.review_repo.delete(review_id)
