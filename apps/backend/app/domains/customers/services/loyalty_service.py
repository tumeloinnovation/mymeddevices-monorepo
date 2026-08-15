import uuid
from contextlib import asynccontextmanager
from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError
from app.domains.customers.models.customer_profile import CustomerProfile
from app.domains.customers.models.loyalty_ledger import LoyaltyLedger


class LoyaltyService:
    """Service for managing customer loyalty programs."""

    # Tier thresholds
    TIERS: dict[str, dict[str, Any]] = {
        "bronze": {
            "min_points": 0,
            "multiplier": 1.0,
            "benefits": ["Basic membership", "5% bonus points on purchases"],
        },
        "silver": {
            "min_points": 1000,
            "multiplier": 1.25,
            "benefits": ["All Bronze benefits", "10% bonus points on purchases", "Early access to sales"],
        },
        "gold": {
            "min_points": 5000,
            "multiplier": 1.5,
            "benefits": [
                "All Silver benefits",
                "15% bonus points on purchases",
                "Free shipping on orders over KES 5000",
                "Priority customer support",
            ],
        },
        "platinum": {
            "min_points": 15000,
            "multiplier": 2.0,
            "benefits": [
                "All Gold benefits",
                "20% bonus points on purchases",
                "Free shipping on all orders",
                "Dedicated account manager",
                "Exclusive products access",
            ],
        },
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    @asynccontextmanager
    async def _transaction(self):
        """Use begin_nested (SAVEPOINT) when already in a transaction."""
        if self.db.in_transaction():
            async with self.db.begin_nested():
                yield
        else:
            async with self.db.begin():
                yield

    async def _get_or_create_profile(self, customer_id: uuid.UUID, for_update: bool = False) -> CustomerProfile:
        """Get or create customer profile if missing with optional row locking."""
        query = select(CustomerProfile).where(CustomerProfile.user_id == customer_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        profile = result.scalar_one_or_none()
        if not profile:
            profile = CustomerProfile(user_id=customer_id, loyalty_points=0, loyalty_tier="bronze")
            self.db.add(profile)
            await self.db.flush()
        return profile

    async def get_summary(self, customer_id: uuid.UUID) -> dict:
        """Get loyalty summary including tier info and progress."""
        profile = await self._get_or_create_profile(customer_id)

        total_points = profile.loyalty_points or 0
        current_tier_name = (profile.loyalty_tier or "bronze").lower()
        if current_tier_name not in self.TIERS:
            current_tier_name = "bronze"

        # Calculate tier progress
        current_tier = self.TIERS[current_tier_name]
        next_tier_name = None
        points_to_next_tier = 0
        tier_progress = 0

        # Find next tier
        tier_names = ["bronze", "silver", "gold", "platinum"]
        current_idx = tier_names.index(current_tier_name)

        if current_idx < len(tier_names) - 1:
            next_tier_name = tier_names[current_idx + 1]
            next_tier = self.TIERS[next_tier_name]
            points_needed = next_tier["min_points"] - total_points
            points_to_next_tier = max(0, points_needed)

            # Calculate progress percentage within current tier
            if current_idx > 0:
                self.TIERS[tier_names[current_idx - 1]]["min_points"]
            else:
                pass

            current_tier_min = current_tier["min_points"]
            tier_range = next_tier["min_points"] - current_tier_min
            points_into_tier = total_points - current_tier_min
            tier_progress = min(100, max(0, (points_into_tier / tier_range) * 100)) if tier_range > 0 else 100

        return {
            "customer_id": str(customer_id),
            "total_points": total_points,
            "current_tier": {
                "name": current_tier_name,
                "multiplier": current_tier["multiplier"],
                "benefits": current_tier["benefits"],
            },
            "next_tier": {
                "name": next_tier_name,
                "multiplier": self.TIERS[next_tier_name]["multiplier"],
                "benefits": self.TIERS[next_tier_name]["benefits"],
            }
            if next_tier_name
            else None,
            "points_to_next_tier": points_to_next_tier,
            "tier_progress": round(tier_progress, 1),
        }

    async def get_ledger(
        self,
        customer_id: uuid.UUID,
        transaction_type: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[LoyaltyLedger], int]:
        """Get loyalty ledger entries."""
        query = select(LoyaltyLedger).where(LoyaltyLedger.customer_id == customer_id)
        if transaction_type:
            query = query.where(LoyaltyLedger.transaction_type == transaction_type)
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0
        query = query.order_by(desc(LoyaltyLedger.created_at)).offset(offset).limit(limit)
        result = await self.db.execute(query)
        entries = result.scalars().all()
        return list(entries), total

    async def get_history(
        self,
        customer_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        transaction_type: str | None = None,
    ) -> tuple[list[LoyaltyLedger], int]:
        """Get paginated loyalty points history."""
        offset = (page - 1) * page_size
        return await self.get_ledger(customer_id, transaction_type, offset, page_size)

    async def earn_points(
        self,
        customer_id: uuid.UUID,
        points: int,
        description: str,
        reference_type: str | None = None,
        reference_id: uuid.UUID | None = None,
    ) -> LoyaltyLedger:
        """Add points to customer's balance with row-level locking."""
        if points <= 0:
            raise BusinessRuleError("Points to earn must be positive")

        # Use transaction block for atomic points earning with row locking
        async with self._transaction():
            profile = await self._get_or_create_profile(customer_id, for_update=True)

            current_points = profile.loyalty_points or 0
            new_points = current_points + points

            # Create ledger entry
            entry = LoyaltyLedger(
                id=uuid.uuid4(),
                customer_id=customer_id,
                transaction_type="earn",
                points=points,
                balance_after=new_points,
                description=description,
                reference_type=reference_type,
                reference_id=reference_id,
            )

            # Update profile
            profile.loyalty_points = new_points

            # Update tier if needed
            await self._update_tier(profile)

            self.db.add(entry)
            await self.db.flush()
            entry_id = entry.id

        # Reload and return
        stmt = select(LoyaltyLedger).where(LoyaltyLedger.id == entry_id)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def redeem_points(
        self,
        customer_id: uuid.UUID,
        points: int,
        description: str,
    ) -> LoyaltyLedger:
        """Redeem points from customer's balance with row-level locking."""
        if points <= 0:
            raise BusinessRuleError("Points must be positive")

        # Use transaction block for atomic points redemption with row locking
        async with self._transaction():
            profile = await self._get_or_create_profile(customer_id, for_update=True)

            current_points = profile.loyalty_points or 0

            if current_points < points:
                raise BusinessRuleError(f"Insufficient points. You have {current_points} points.")

            new_points = current_points - points

            # Create ledger entry
            entry = LoyaltyLedger(
                id=uuid.uuid4(),
                customer_id=customer_id,
                transaction_type="redeem",
                points=-points,
                balance_after=new_points,
                description=description,
                reference_type="redemption",
            )

            # Update profile
            profile.loyalty_points = new_points

            # Update tier if needed
            await self._update_tier(profile)

            self.db.add(entry)
            await self.db.flush()
            entry_id = entry.id

        # Reload and return
        stmt = select(LoyaltyLedger).where(LoyaltyLedger.id == entry_id)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def _update_tier(self, profile: CustomerProfile):
        """Update customer's loyalty tier based on points."""
        points = profile.loyalty_points or 0

        # Find appropriate tier
        new_tier = "bronze"
        for tier_name, tier_config in reversed(list(self.TIERS.items())):
            if points >= int(tier_config["min_points"]):
                new_tier = tier_name
                break

        profile.loyalty_tier = new_tier

    async def adjust_points(
        self,
        customer_id: uuid.UUID,
        points: int,
        description: str,
        admin_user_id: uuid.UUID,
    ) -> LoyaltyLedger:
        """Manually adjust points (admin only)."""
        # Use transaction block for atomic points adjustment
        async with self.db.begin():
            profile = await self._get_or_create_profile(customer_id)

            current_points = profile.loyalty_points or 0
            new_points = current_points + points  # Can be negative

            if new_points < 0:
                raise BusinessRuleError("Cannot reduce points below zero")

            # Create ledger entry
            entry = LoyaltyLedger(
                customer_id=customer_id,
                transaction_type="adjust",
                points=points,
                balance_after=new_points,
                description=description,
                reference_type="manual",
                reference_id=admin_user_id,
            )

            # Update profile
            profile.loyalty_points = new_points

            # Update tier if needed
            await self._update_tier(profile)

            self.db.add(entry)
            entry_id = entry.id

        # Transaction commits automatically
        # Reload and return
        stmt = select(LoyaltyLedger).where(LoyaltyLedger.id == entry_id)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def get_points_expiry(self, customer_id: uuid.UUID) -> list[dict]:
        """Get points that will expire soon (if expiry is enabled)."""
        # For now, return empty list as points don't expire
        # This can be implemented later if needed
        return []
