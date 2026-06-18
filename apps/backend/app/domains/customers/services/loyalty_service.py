import uuid
from datetime import datetime, timezone, timedelta
from typing import Tuple, List, Optional
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.customers.models.customer_profile import CustomerProfile
from app.domains.customers.models.loyalty_ledger import LoyaltyLedger
from app.domains.auth.models.user import User


class LoyaltyService:
    """Service for managing customer loyalty programs."""

    # Tier thresholds
    TIERS = {
        "bronze": {"min_points": 0, "multiplier": 1.0, "benefits": ["Basic membership", "5% bonus points on purchases"]},
        "silver": {"min_points": 1000, "multiplier": 1.25, "benefits": ["All Bronze benefits", "10% bonus points on purchases", "Early access to sales"]},
        "gold": {"min_points": 5000, "multiplier": 1.5, "benefits": ["All Silver benefits", "15% bonus points on purchases", "Free shipping on orders over KES 5000", "Priority customer support"]},
        "platinum": {"min_points": 15000, "multiplier": 2.0, "benefits": ["All Gold benefits", "20% bonus points on purchases", "Free shipping on all orders", "Dedicated account manager", "Exclusive products access"]},
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_summary(self, customer_id: uuid.UUID) -> dict:
        """Get loyalty summary including tier info and progress."""
        # Get customer profile
        result = await self.db.execute(
            select(CustomerProfile).where(CustomerProfile.user_id == customer_id)
        )
        profile = result.scalar_one_or_none()

        if not profile:
            raise ValueError("Customer profile not found")

        total_points = profile.loyalty_points or 0
        current_tier_name = profile.loyalty_tier or "bronze"

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
                prev_tier_min = self.TIERS[tier_names[current_idx - 1]]["min_points"]
            else:
                prev_tier_min = 0

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
                "points_needed": points_to_next_tier,
            } if next_tier_name else None,
            "points_to_next_tier": points_to_next_tier,
            "tier_progress": tier_progress,
        }

    async def get_ledger(
        self,
        customer_id: uuid.UUID,
        transaction_type: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Tuple[List[LoyaltyLedger], int]:
        """Get loyalty ledger entries."""
        query = select(LoyaltyLedger).where(LoyaltyLedger.customer_id == customer_id)

        if transaction_type:
            query = query.where(LoyaltyLedger.transaction_type == transaction_type)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(desc(LoyaltyLedger.created_at))
        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        entries = result.scalars().all()

        return list(entries), total

    async def earn_points(
        self,
        customer_id: uuid.UUID,
        points: int,
        description: str,
        reference_type: Optional[str] = None,
        reference_id: Optional[uuid.UUID] = None,
    ) -> LoyaltyLedger:
        """Add points to customer's balance."""
        # Get current profile
        result = await self.db.execute(
            select(CustomerProfile).where(CustomerProfile.user_id == customer_id)
        )
        profile = result.scalar_one_or_none()

        if not profile:
            raise ValueError("Customer profile not found")

        current_points = profile.loyalty_points or 0
        new_points = current_points + points

        # Create ledger entry
        entry = LoyaltyLedger(
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
        await self.db.commit()
        await self.db.refresh(entry)

        return entry

    async def redeem_points(
        self,
        customer_id: uuid.UUID,
        points: int,
        description: str,
    ) -> LoyaltyLedger:
        """Redeem points from customer's balance."""
        if points <= 0:
            raise ValueError("Points must be positive")

        # Get current profile
        result = await self.db.execute(
            select(CustomerProfile).where(CustomerProfile.user_id == customer_id)
        )
        profile = result.scalar_one_or_none()

        if not profile:
            raise ValueError("Customer profile not found")

        current_points = profile.loyalty_points or 0

        if current_points < points:
            raise ValueError(f"Insufficient points. You have {current_points} points.")

        new_points = current_points - points

        # Create ledger entry
        entry = LoyaltyLedger(
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
        await self.db.commit()
        await self.db.refresh(entry)

        return entry

    async def _update_tier(self, profile: CustomerProfile):
        """Update customer's loyalty tier based on points."""
        points = profile.loyalty_points or 0

        # Find appropriate tier
        new_tier = "bronze"
        for tier_name, tier_config in reversed(list(self.TIERS.items())):
            if points >= tier_config["min_points"]:
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
        # Get current profile
        result = await self.db.execute(
            select(CustomerProfile).where(CustomerProfile.user_id == customer_id)
        )
        profile = result.scalar_one_or_none()

        if not profile:
            raise ValueError("Customer profile not found")

        current_points = profile.loyalty_points or 0
        new_points = current_points + points  # Can be negative

        if new_points < 0:
            raise ValueError("Cannot reduce points below zero")

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
        await self.db.commit()
        await self.db.refresh(entry)

        return entry

    async def get_points_expiry(self, customer_id: uuid.UUID) -> List[dict]:
        """Get points that will expire soon (if expiry is enabled)."""
        # For now, return empty list as points don't expire
        # This can be implemented later if needed
        return []
