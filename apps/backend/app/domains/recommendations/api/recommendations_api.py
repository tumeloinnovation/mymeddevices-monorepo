from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

router = APIRouter()

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.domains.catalog.models.product import Product
from app.domains.catalog.schemas.product_schemas import StorefrontProductResponse
from app.domains.shopping.models.order import Order, OrderItem, OrderStatus


@router.get("/trending")
async def get_trending_recommendations(limit: int = 10, db: AsyncSession = Depends(get_db)):
    # 1. Calculate the threshold for "recent" (last 30 days)
    threshold = datetime.now(UTC) - timedelta(days=30)

    # 2. Query OrderItem for most purchased products in the last 30 days
    # We only count items from PAID, PROCESSING, SHIPPED, or DELIVERED orders
    trending_stmt = (
        select(OrderItem.product_id, func.sum(OrderItem.quantity).label("total_sales"))
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            Order.created_at >= threshold,
            Order.status.in_([OrderStatus.PROCESSING.value, OrderStatus.SHIPPED.value, OrderStatus.DELIVERED.value]),
        )
        .group_by(OrderItem.product_id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )

    result = await db.execute(trending_stmt)
    trending_sales = result.all()

    product_ids = [row.product_id for row in trending_sales]

    # 3. Fetch full product details
    if product_ids:
        products_stmt = (
            select(Product)
            .where(Product.id.in_(product_ids))
            .options(selectinload(Product.images), selectinload(Product.category), selectinload(Product.brand_relation))
        )
        products_result = await db.execute(products_stmt)
        products = {p.id: p for p in products_result.scalars().all()}

        # Maintain order from trending sales
        ordered_products = [products[pid] for pid in product_ids if pid in products]
    else:
        ordered_products = []

    # 4. Fallback: If not enough trending products, add the newest ones
    if len(ordered_products) < limit:
        remaining = limit - len(ordered_products)
        fallback_stmt = (
            select(Product)
            .where(Product.status == "published")
            .where(Product.is_verified == True)
            .order_by(Product.created_at.desc())
            .limit(remaining)
            .options(selectinload(Product.images), selectinload(Product.category), selectinload(Product.brand_relation))
        )
        if product_ids:
            fallback_stmt = fallback_stmt.where(~Product.id.in_(product_ids))
        fallback_result = await db.execute(fallback_stmt)
        ordered_products.extend(fallback_result.scalars().all())

    # 5. Format for storefront response
    response_data = []
    for p in ordered_products:
        p_dict = StorefrontProductResponse.model_validate(p)
        p_dict.in_stock = p.stock_quantity > 0
        response_data.append(p_dict)

    return {"success": True, "data": response_data}
