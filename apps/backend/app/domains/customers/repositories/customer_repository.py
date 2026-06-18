import uuid
from typing import Optional, List, Sequence
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.shared.repositories import BaseRepository
from app.domains.customers.models.customer_profile import CustomerProfile
from app.domains.customers.models.address import Address
from app.domains.customers.models.wishlist import WishlistItem
from app.domains.customers.models.review import Review
from app.domains.auth.models.user import User

class CustomerRepository(BaseRepository[CustomerProfile]):
    def __init__(self, db: AsyncSession):
        super().__init__(CustomerProfile, db)

    async def get_by_user_id(self, user_id: uuid.UUID) -> Optional[CustomerProfile]:
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
        return profile

class AddressRepository(BaseRepository[Address]):
    def __init__(self, db: AsyncSession):
        super().__init__(Address, db)

    async def get_customer_addresses(self, customer_id: uuid.UUID) -> Sequence[Address]:
        stmt = select(Address).where(Address.customer_id == customer_id).order_by(Address.is_default.desc(), Address.created_at.desc())
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_default_address(self, customer_id: uuid.UUID, address_type: str) -> Optional[Address]:
        stmt = select(Address).where(
            and_(
                Address.customer_id == customer_id,
                Address.type == address_type,
                Address.is_default == True
            )
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
        stmt = (
            select(WishlistItem)
            .where(WishlistItem.customer_id == customer_id)
            .options(selectinload(WishlistItem.product))
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_item_by_product(self, customer_id: uuid.UUID, product_id: uuid.UUID) -> Optional[WishlistItem]:
        return await self.get_by(customer_id=customer_id, product_id=product_id)

class ReviewRepository(BaseRepository[Review]):
    def __init__(self, db: AsyncSession):
        super().__init__(Review, db)

    async def get_customer_reviews(self, customer_id: uuid.UUID) -> Sequence[Review]:
        stmt = (
            select(Review)
            .where(Review.customer_id == customer_id)
            .options(selectinload(Review.product))
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_product_reviews(self, product_id: uuid.UUID) -> Sequence[Review]:
        stmt = select(Review).where(and_(Review.product_id == product_id, Review.is_approved == True))
        result = await self.db.execute(stmt)
        return result.scalars().all()
