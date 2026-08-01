"""
Notification consumer for processing OrderPaid events.

This consumer listens for OrderPaid events and:
1. Sends email notifications to vendors for new orders
2. Sends SMS notifications (optional)
"""
from faststream.rabbit import RabbitRouter
from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.broker import order_exchange
from app.core.database import get_db
from app.domains.shared.events.events import OrderPaidEvent
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.auth.models.user import User
from app.domains.shopping.services.email_notification_service import EmailNotificationService
from app.domains.catalog.models.product import Product


# Create the notification router
notification_router = RabbitRouter()
email_service = EmailNotificationService()


@notification_router.subscriber(
    queue="vendor.notifications",
    exchange=order_exchange,
    routing_key="order.paid"
)
async def handle_order_paid(message: OrderPaidEvent):
    """
    Process OrderPaid event to send vendor notifications.

    For each sub-order:
    1. Get vendor contact information
    2. Fetch product details for items
    3. Send email notification with items
    4. Optionally send SMS
    """
    logger.info(f"Processing vendor notifications for order {message.order_id}")

    async for db in get_db():
        try:
            for sub_order in message.sub_orders:
                # Get vendor profile with user email
                stmt = select(VendorProfile, User).join(
                    User, VendorProfile.user_id == User.id
                ).where(VendorProfile.id == sub_order.vendor_id)

                result = await db.execute(stmt)
                row = result.first()

                if not row:
                    logger.warning(f"Vendor {sub_order.vendor_id} not found, skipping notification")
                    continue

                vendor_profile, user = row

                # Determine email address
                vendor_email = vendor_profile.business_email or user.email
                if not vendor_email:
                    logger.warning(f"No email found for vendor {sub_order.vendor_id}, skipping notification")
                    continue

                # Fetch product details for items
                item_count = len(sub_order.items)
                total_quantity = sum(item.quantity for item in sub_order.items)

                # Get product IDs for this sub-order
                product_ids = [item.product_id for item in sub_order.items]

                # Fetch products
                products_stmt = select(Product).where(Product.id.in_(product_ids))
                products_result = await db.execute(products_stmt)
                products = {p.id: p for p in products_result.scalars()}

                # Build items list with product names
                items_with_names = []
                for item in sub_order.items:
                    product = products.get(item.product_id)
                    items_with_names.append({
                        "name": product.name if product else f"Product {str(item.product_id)[:8]}",
                        "quantity": item.quantity,
                        "unit_price": float(item.unit_price)
                    })

                # Get order and customer info
                customer_name = None
                customer_phone = None
                from app.domains.shopping.models.order import Order
                order_stmt = select(Order).where(Order.id == message.order_id).options(
                    selectinload(Order.user)
                )
                order_result = await db.execute(order_stmt)
                order = order_result.scalar_one_or_none()
                if order:
                    if order.user:
                        customer_name = f"{order.user.first_name or ''} {order.user.last_name or ''}".strip() or order.user.email
                        customer_phone = order.user.phone
                    elif order.shipping_address:
                        customer_name = order.shipping_address.get("full_name") or order.shipping_address.get("first_name")
                        customer_phone = order.shipping_address.get("phone")

                order_number_display = str(order.order_number) if (order and order.order_number) else str(message.order_id)[:8]

                # Send email notification with items
                try:
                    await email_service.send_vendor_order_with_items(
                        vendor_email=vendor_email,
                        vendor_name=vendor_profile.store_name,
                        order_number=order_number_display,
                        order_id=str(message.order_id),
                        order_total=float(sub_order.subtotal_amount),
                        items=items_with_names,
                        item_count=item_count,
                        total_quantity=total_quantity,
                        customer_name=customer_name,
                        customer_phone=customer_phone
                    )
                    logger.info(
                        f"Sent new order notification to vendor {sub_order.vendor_id} "
                        f"at {vendor_email} for order {message.order_id}"
                    )
                except Exception as email_error:
                    logger.error(f"Failed to send email to vendor {sub_order.vendor_id}: {email_error}")
                    # Continue processing other vendors

            logger.info(f"Vendor notifications completed for order {message.order_id}")

        except Exception as e:
            logger.error(f"Failed to process vendor notifications for order {message.order_id}: {e}")
            # Don't raise here - we don't want to fail the entire order flow
            # if notifications fail


# Export for consumer app
__all__ = ["notification_router"]
