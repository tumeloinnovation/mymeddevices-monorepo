import uuid

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.shopping.models.promotion import Promotion


class PromotionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_promotions(
        self,
        promotion_type: str | None = None,
        only_active: bool = False,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Promotion], int]:
        query = select(Promotion)
        count_query = select(func.count(Promotion.id))

        filters = []
        if promotion_type:
            filters.append(Promotion.promotion_type == promotion_type)
        if only_active:
            filters.append(Promotion.is_active == True)

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        query = query.order_by(Promotion.priority.desc(), Promotion.created_at.desc()).offset(offset).limit(limit)

        total_res = await self.db.execute(count_query)
        total = total_res.scalar() or 0

        res = await self.db.execute(query)
        promotions = list(res.scalars().all())

        return promotions, total

    async def get_by_id(self, promotion_id: uuid.UUID) -> Promotion | None:
        stmt = select(Promotion).where(Promotion.id == promotion_id)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def create_promotion(self, data: dict, created_by_id: uuid.UUID | None = None) -> Promotion:
        promo = Promotion(
            id=uuid.uuid4(),
            created_by_id=created_by_id,
            **data,
        )
        self.db.add(promo)
        await self.db.commit()
        await self.db.refresh(promo)
        return promo

    async def update_promotion(self, promotion_id: uuid.UUID, data: dict) -> Promotion | None:
        promo = await self.get_by_id(promotion_id)
        if not promo:
            return None

        for k, v in data.items():
            if v is not None:
                setattr(promo, k, v)

        await self.db.commit()
        await self.db.refresh(promo)
        return promo

    async def delete_promotion(self, promotion_id: uuid.UUID) -> bool:
        promo = await self.get_by_id(promotion_id)
        if not promo:
            return False

        await self.db.delete(promo)
        await self.db.commit()
        return True

    async def toggle_status(self, promotion_id: uuid.UUID) -> Promotion | None:
        promo = await self.get_by_id(promotion_id)
        if not promo:
            return None

        promo.is_active = not promo.is_active
        await self.db.commit()
        await self.db.refresh(promo)
        return promo
