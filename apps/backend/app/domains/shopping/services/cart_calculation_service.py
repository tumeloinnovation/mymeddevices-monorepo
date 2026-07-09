import uuid
import math
from typing import List, Optional
from decimal import Decimal
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.cart_discount import CartDiscount
from app.domains.catalog.models.product import Product

OFFICE_LAT = -1.3011758537859464
OFFICE_LON = 36.800690681948126

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two lat/lon coordinates."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class CartCalculationService:
    """Service for cart calculations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_totals(self, cart_id: uuid.UUID, shipping_address: Optional[dict] = None) -> dict:
        """Calculate cart totals with discounts.

        Returns:
            dict with keys: subtotal, discount_amount, tax_amount, shipping_amount, total, currency, item_count
        """
        # Get cart with items and discounts - eager load products to avoid N+1 queries
        stmt = select(Cart).where(Cart.id == cart_id).options(
            selectinload(Cart.items).selectinload(CartItem.product)
        )
        result = await self.db.execute(stmt)
        cart = result.scalar_one_or_none()
        if not cart:
            raise ValueError("Cart not found")

        items = cart.items

        # Calculate subtotal
        subtotal = 0.0
        for item in items:
            price = float(item.unit_price) if item.unit_price is not None else float(item.product.price or 0.0)
            subtotal += price * item.quantity

        # Get applied discounts
        discount_stmt = select(CartDiscount).where(
            and_(
                CartDiscount.cart_id == cart_id,
                CartDiscount.is_applied == True
            )
        )
        discount_result = await self.db.execute(discount_stmt)
        discounts = list(discount_result.scalars().all())

        # Calculate discount amount
        discount_amount = 0.0
        for discount in discounts:
            if discount.discount_amount and discount.discount_amount > 0:
                discount_amount += float(discount.discount_amount)
            elif discount.discount_type == "percentage":
                disc = (subtotal * float(discount.discount_value)) / 100.0
                discount_amount += disc
                discount.discount_amount = Decimal(str(round(disc, 2)))
            elif discount.discount_type == "fixed":
                discount_amount += float(discount.discount_value)
                discount.discount_amount = discount.discount_value

        # Commit the updated discount amounts to database (if any were calculated)
        await self.db.commit()

        # Calculate subtotal after discount
        discounted_subtotal = max(0.0, subtotal - discount_amount)

        # Calculate tax (simplified)
        tax_amount = await self.calculate_tax(cart_id, discounted_subtotal)

        # Calculate shipping and logistics details
        shipping_details = await self.calculate_shipping_details(cart, shipping_address)
        shipping_amount = shipping_details["amount"]

        # Calculate total
        total = discounted_subtotal + tax_amount + shipping_amount

        return {
            "subtotal": round(subtotal),
            "discount_amount": round(discount_amount),
            "tax_amount": round(tax_amount),
            "shipping_amount": round(shipping_amount),
            "total": round(total),
            "currency": "KES",
            "item_count": len(items),
            "logistics_type": shipping_details["logistics_type"],
            "calculated_distance_km": shipping_details["calculated_distance_km"],
            "route_coordinates": shipping_details["route_coordinates"],
            "applied_discounts": [
                {
                    "id": str(d.id),
                    "coupon_code": d.coupon_code,
                    "description": d.description,
                    "discount_amount": float(d.discount_amount)
                }
                for d in discounts
            ]
        }

    async def calculate_tax(
        self,
        cart_id: uuid.UUID,
        subtotal: float
    ) -> float:
        """Calculate tax for cart. Placeholder implementation."""
        return 0.0

    async def calculate_shipping_details(
        self,
        cart: Cart,
        shipping_address: Optional[dict] = None
    ) -> dict:
        """Calculate shipping amount and logistics routing details."""
        if not shipping_address:
            return {
                "amount": 0.0,
                "logistics_type": "courier",
                "calculated_distance_km": 0.0,
                "route_coordinates": []
            }

        # Extract customer coordinates
        customer_lat = shipping_address.get("latitude") or shipping_address.get("lat")
        customer_lon = shipping_address.get("longitude") or shipping_address.get("lon") or shipping_address.get("lng")

        if customer_lat is None or customer_lon is None:
            # Fallback to default flat fee if coordinates are not present
            return {
                "amount": 250.0,
                "logistics_type": "courier",
                "calculated_distance_km": 0.0,
                "route_coordinates": []
            }

        try:
            customer_lat = float(customer_lat)
            customer_lon = float(customer_lon)
        except ValueError:
            return {
                "amount": 250.0,
                "logistics_type": "courier",
                "calculated_distance_km": 0.0,
                "route_coordinates": []
            }

        # Load settings from DB
        from app.domains.admin.services import SystemSettingService
        settings = await SystemSettingService.get_setting(self.db, "shipping_settings")
        if not settings:
            settings = {
                "flat_fee": 200.0,
                "rate_per_km": 20.0,
                "max_radius_km": 50.0,
                "courier_fee": 450.0
            }

        flat_fee = float(settings.get("flat_fee", 200.0))
        rate_per_km = float(settings.get("rate_per_km", 20.0))
        max_radius_km = float(settings.get("max_radius_km", 50.0))
        courier_fee = float(settings.get("courier_fee", 450.0))

        # Check distance from Office to Customer
        dist_office_customer = calculate_haversine_distance(
            OFFICE_LAT, OFFICE_LON,
            customer_lat, customer_lon
        )

        if dist_office_customer > max_radius_km:
            # Outside Nairobi surroundings -> use Courier
            return {
                "amount": courier_fee,
                "logistics_type": "courier",
                "calculated_distance_km": dist_office_customer,
                "route_coordinates": [
                    [OFFICE_LAT, OFFICE_LON],
                    [customer_lat, customer_lon]
                ]
            }

        # Nairobi surroundings -> Company Rider route
        from app.domains.vendor.models.vendor_profile import VendorProfile
        vendor_ids = {item.product.vendor_id for item in cart.items if item.product and item.product.vendor_id}

        vendor_coords = []
        if vendor_ids:
            stmt = select(VendorProfile).where(VendorProfile.id.in_(vendor_ids))
            result = await self.db.execute(stmt)
            vendors = result.scalars().all()
            for vendor in vendors:
                if vendor.latitude is not None and vendor.longitude is not None:
                    vendor_coords.append((float(vendor.latitude), float(vendor.longitude)))

        # Construct route: Office -> Vendor 1 -> Vendor 2 ... -> Customer
        route = [[OFFICE_LAT, OFFICE_LON]]
        for v_coords in vendor_coords:
            if v_coords not in route:
                route.append(v_coords)
        route.append([customer_lat, customer_lon])

        # Calculate total distance along the route
        total_distance = 0.0
        for i in range(len(route) - 1):
            total_distance += calculate_haversine_distance(
                route[i][0], route[i][1],
                route[i+1][0], route[i+1][1]
            )

        shipping_fee = flat_fee + (total_distance * rate_per_km)

        return {
            "amount": round(shipping_fee),
            "logistics_type": "company_rider",
            "calculated_distance_km": round(total_distance, 2),
            "route_coordinates": route
        }

    async def get_item_price(self, item: CartItem) -> float:
        """Get the current price for a cart item."""
        if item.unit_price:
            return float(item.unit_price)

        stmt = select(Product.price).where(Product.id == item.product_id)
        result = await self.db.execute(stmt)
        price = result.scalar_one_or_none()
        return float(price) if price else 0.0
