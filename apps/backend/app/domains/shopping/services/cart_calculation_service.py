import math
import uuid
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.domains.catalog.models.product import Product
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.cart_discount import CartDiscount
from app.domains.shopping.models.coupon import Coupon

OFFICE_LAT = -1.3011758537859464
OFFICE_LON = 36.800690681948126

TWO_PLACES = Decimal("0.01")

# Money keys in the totals dict that are computed as Decimal internally and
# exposed as floats for API compatibility (pydantic serializes Decimal as a
# string, which would break frontend consumers expecting numbers).
_MONEY_KEYS = (
    "subtotal",
    "discount_amount",
    "tax_amount",
    "shipping_amount",
    "packaging_fee",
    "services_fee",
    "total",
)


def quantize_money(value: Decimal | int | float | str) -> Decimal:
    """Round a monetary amount to 2 decimal places using half-up rounding."""
    return Decimal(str(value)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def _resolve_unit_price(item: CartItem) -> Decimal:
    """Resolve the effective unit price for a cart item as an exact Decimal.

    Numeric columns already yield Decimal values; str() coercion keeps this
    safe for in-memory/float-sourced values (e.g. Float quantity columns).
    """
    if item.unit_price is not None:
        return Decimal(str(item.unit_price))
    if item.product_variant is not None and item.product_variant.calculated_price is not None:
        return Decimal(str(item.product_variant.calculated_price))
    if item.product is not None and item.product.price is not None:
        return Decimal(str(item.product.price))
    return Decimal("0")


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two lat/lon coordinates."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class CartCalculationService:
    """Service for cart calculations."""

    def __init__(self, db: AsyncSession, routing_service: Any | None = None):
        self.db = db
        self.routing_service = routing_service


    async def calculate_totals(self, cart_id: uuid.UUID, shipping_address: dict | None = None) -> dict:
        """Calculate cart totals with discounts.

        Returns:
            dict with keys: subtotal, discount_amount, tax_amount, shipping_amount, total, currency, item_count
        """
        # Get cart with items and discounts - eager load products and variants to avoid N+1 queries
        stmt = (
            select(Cart)
            .where(Cart.id == cart_id)
            .options(
                selectinload(Cart.items).selectinload(CartItem.product),
                selectinload(Cart.items).selectinload(CartItem.product_variant),
            )
        )
        result = await self.db.execute(stmt)
        cart = result.scalar_one_or_none()
        if not cart:
            raise NotFoundError("Cart", cart_id)

        totals = await self._compute_totals(cart, shipping_address)

        # API boundary: expose money values as floats (frontend contract)
        for key in _MONEY_KEYS:
            totals[key] = float(totals[key])
        totals["applied_discounts"] = [
            {**d, "discount_amount": float(d["discount_amount"])} for d in totals["applied_discounts"]
        ]
        return totals

    async def _compute_totals(self, cart: Cart, shipping_address: dict | None = None) -> dict:
        """Authoritative totals computation. All monetary math is exact Decimal.

        Checkout persists values straight from this method; the public
        calculate_totals() wrapper only float-converts for API responses.
        """
        items = cart.items

        # Calculate subtotal
        subtotal = Decimal("0")
        for item in items:
            price = _resolve_unit_price(item)
            subtotal += price * Decimal(str(item.quantity))

        # Get applied discounts
        discount_stmt = select(CartDiscount).where(
            and_(CartDiscount.cart_id == cart.id, CartDiscount.is_applied == True)
        )
        discount_result = await self.db.execute(discount_stmt)
        discounts = list(discount_result.scalars().all())

        # Calculate discount amount
        discount_amount = Decimal("0")
        has_free_shipping = False
        for discount in discounts:
            # Query coupon to see its scope and restrictions
            coupon_stmt = (
                select(Coupon)
                .where(func.lower(Coupon.code) == (discount.coupon_code or "").lower())
                .options(
                    selectinload(Coupon.restrictions), selectinload(Coupon.categories), selectinload(Coupon.products)
                )
            )
            coupon_res = await self.db.execute(coupon_stmt)
            coupon = coupon_res.scalar_one_or_none()

            # Determine applicable subtotal for the coupon's scope
            applicable_subtotal = subtotal
            if coupon:
                if coupon.discount_scope == "specific_categories":
                    allowed_categories = {c.category for c in coupon.categories}
                    applicable_subtotal = Decimal("0")
                    for item in items:
                        if (
                            item.product
                            and item.product.category_id
                            and str(item.product.category_id) in allowed_categories
                        ):
                            applicable_subtotal += _resolve_unit_price(item) * Decimal(str(item.quantity))
                elif coupon.discount_scope == "specific_products":
                    allowed_products = {p.product_id for p in coupon.products}
                    applicable_subtotal = Decimal("0")
                    for item in items:
                        if item.product_id in allowed_products:
                            applicable_subtotal += _resolve_unit_price(item) * Decimal(str(item.quantity))

            # Calculate the discount
            disc = Decimal("0")
            if discount.discount_type == "percentage":
                disc = (applicable_subtotal * Decimal(str(discount.discount_value))) / Decimal("100")
                if coupon and coupon.restrictions and coupon.restrictions.max_discount_amount:
                    disc = min(disc, Decimal(str(coupon.restrictions.max_discount_amount)))
            elif discount.discount_type in ("fixed", "fixed_amount"):
                disc = min(Decimal(str(discount.discount_value)), applicable_subtotal)
            elif discount.discount_type == "free_shipping":
                has_free_shipping = True

            disc = disc.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
            discount_amount += disc
            discount.discount_amount = disc

        # Calculate subtotal after discount
        discounted_subtotal = max(Decimal("0"), subtotal - discount_amount)

        # Calculate tax (16% VAT on taxable products after discounts)
        tax_amount = await self._compute_tax(items, discounted_subtotal, subtotal)

        # Calculate shipping and logistics details
        shipping_details = await self.calculate_shipping_details(cart, shipping_address)
        shipping_amount = Decimal(str(shipping_details["amount"]))

        # Free-shipping coupons zero out the shipping charge
        if has_free_shipping:
            shipping_amount = Decimal("0")

        # Packaging & Service fees (applied during checkout when shipping address is provided)
        packaging_fee = Decimal("100.00") if shipping_address else Decimal("0")
        services_fee = Decimal("50.00") if shipping_address else Decimal("0")

        # Calculate total (Subtotal - Discounts + 16% VAT + Shipping + Packaging + Services)
        total = discounted_subtotal + tax_amount + shipping_amount + packaging_fee + services_fee

        return {
            "subtotal": subtotal.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            "discount_amount": discount_amount.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            "tax_amount": tax_amount,
            "shipping_amount": shipping_amount.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            "packaging_fee": packaging_fee,
            "services_fee": services_fee,
            "total": total.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
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
                    "discount_amount": d.discount_amount,
                }
                for d in discounts
            ],
        }

    async def calculate_tax(
        self, items: list[CartItem], discounted_subtotal: float | Decimal, subtotal: float | Decimal
    ) -> Decimal:
        """Calculate VAT tax for cart at 16% rate on taxable items."""
        return await self._compute_tax(
            items, Decimal(str(discounted_subtotal)), Decimal(str(subtotal))
        )

    async def _compute_tax(self, items: list[CartItem], discounted_subtotal: Decimal, subtotal: Decimal) -> Decimal:
        """Exact-Decimal VAT computation on taxable items, prorated by discount ratio."""
        if subtotal <= 0 or discounted_subtotal <= 0:
            return Decimal("0.00")

        VAT_RATE = Decimal("0.16")
        discount_ratio = (discounted_subtotal / subtotal) if subtotal > 0 else Decimal("1")

        total_tax = Decimal("0")
        for item in items:
            is_taxable = True
            rate = VAT_RATE
            if item.product:
                if hasattr(item.product, "has_vat") and item.product.has_vat is False:
                    is_taxable = False
                elif hasattr(item.product, "vat_rate") and item.product.vat_rate is not None:
                    rate = Decimal(str(item.product.vat_rate)) / Decimal("100")

            if is_taxable:
                price = _resolve_unit_price(item)
                item_taxable_amt = (price * Decimal(str(item.quantity))) * discount_ratio
                total_tax += item_taxable_amt * rate

        return total_tax.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

    async def calculate_shipping_details(self, cart: Cart, shipping_address: dict | None = None) -> dict:
        """Calculate shipping amount and logistics routing details.

        Delegates to the logistics domain RoutingService when available,
        otherwise falls back to the legacy implementation for backwards compatibility.
        """
        if not shipping_address:
            return {"amount": 0.0, "logistics_type": "courier", "calculated_distance_km": 0.0, "route_coordinates": []}

        # Extract customer coordinates
        customer_lat = shipping_address.get("latitude") or shipping_address.get("lat")
        customer_lon = shipping_address.get("longitude") or shipping_address.get("lon") or shipping_address.get("lng")

        if customer_lat is None or customer_lon is None:
            # Fallback to default flat fee if coordinates are not present
            return {
                "amount": 250.0,
                "logistics_type": "courier",
                "calculated_distance_km": 0.0,
                "route_coordinates": [],
            }

        try:
            customer_lat = float(customer_lat)
            customer_lon = float(customer_lon)
        except ValueError:
            return {
                "amount": 250.0,
                "logistics_type": "courier",
                "calculated_distance_km": 0.0,
                "route_coordinates": [],
            }

        # Use logistics domain RoutingService if available
        if self.routing_service:
            vendor_ids = [item.product.vendor_id for item in cart.items if item.product and item.product.vendor_id]

            # Load settings from DB
            from app.domains.admin.services import SystemSettingService

            settings = await SystemSettingService.get_setting(self.db, "shipping_settings")
            if not settings:
                settings = {"flat_fee": 200.0, "rate_per_km": 20.0, "max_radius_km": 50.0, "courier_fee": 450.0}

            result = await self.routing_service.calculate_delivery_route(
                customer_coords=(customer_lat, customer_lon),
                vendor_ids=vendor_ids,
                logistics_settings=settings,
            )

            return {
                "amount": result.amount,
                "logistics_type": result.logistics_type,
                "calculated_distance_km": result.distance,
                "route_coordinates": result.route,
            }

        # Fallback to legacy implementation
        return await self._calculate_shipping_details_legacy(cart, shipping_address, customer_lat, customer_lon)

    async def _calculate_shipping_details_legacy(
        self, cart: Cart, shipping_address: dict, customer_lat: float, customer_lon: float
    ) -> dict:
        """Legacy implementation of shipping calculation for backwards compatibility."""
        # Load settings from DB
        from app.domains.admin.services import SystemSettingService

        settings = await SystemSettingService.get_setting(self.db, "shipping_settings")
        if not settings:
            settings = {"flat_fee": 200.0, "rate_per_km": 20.0, "max_radius_km": 50.0, "courier_fee": 450.0}

        flat_fee = float(settings.get("flat_fee", 200.0))
        rate_per_km = float(settings.get("rate_per_km", 20.0))
        max_radius_km = float(settings.get("max_radius_km", 50.0))
        courier_fee = float(settings.get("courier_fee", 450.0))

        # Check distance from Office to Customer
        dist_office_customer = calculate_haversine_distance(OFFICE_LAT, OFFICE_LON, customer_lat, customer_lon)

        if dist_office_customer > max_radius_km:
            # Outside Nairobi surroundings -> use Courier
            return {
                "amount": courier_fee,
                "logistics_type": "courier",
                "calculated_distance_km": dist_office_customer,
                "route_coordinates": [[OFFICE_LAT, OFFICE_LON], [customer_lat, customer_lon]],
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
            # Convert tuple to list for consistent type (List[List[float]])
            coord_list = list(v_coords)
            if coord_list not in route:
                route.append(coord_list)
        route.append([customer_lat, customer_lon])

        # Calculate total distance along the route
        total_distance = 0.0
        for i in range(len(route) - 1):
            total_distance += calculate_haversine_distance(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1])

        shipping_fee = flat_fee + (total_distance * rate_per_km)

        return {
            "amount": round(shipping_fee, 2),
            "logistics_type": "company_rider",
            "calculated_distance_km": round(total_distance, 2),
            "route_coordinates": route,
        }

    async def get_item_price(self, item: CartItem) -> float:
        """Get the current price for a cart item."""
        if item.unit_price:
            return float(item.unit_price)

        stmt = select(Product.price).where(Product.id == item.product_id)
        result = await self.db.execute(stmt)
        price = result.scalar_one_or_none()
        return float(price) if price else 0.0
