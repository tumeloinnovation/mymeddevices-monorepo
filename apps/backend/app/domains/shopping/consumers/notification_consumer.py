"""
Notification consumer for processing OrderPaid events.

This consumer listens for OrderPaid events and:
1. Sends email notifications to vendors for new orders
2. Sends SMS notifications (optional)
"""
from faststream.rabbit import RabbitRouter
from loguru import logger
from sqlalchemy import select

from app.core.broker import order_exchange
from app.core.database import get_db
from app.domains.shared.events.events import OrderPaidEvent
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.auth.models.user import User
from app.domains.shopping.services.email_notification_service import EmailNotificationService


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
    2. Send email notification
    3. Optionally send SMS
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

                # Send email notification
                item_count = len(sub_order.items)
                total_quantity = sum(item.quantity for item in sub_order.items)

                try:
                    await email_service.send_vendor_new_order(
                        vendor_email=vendor_email,
                        vendor_name=vendor_profile.store_name,
                        order_number=str(message.order_id)[:8],  # Shortened order number
                        order_total=float(sub_order.subtotal_amount),
                        item_count=item_count,
                        total_quantity=total_quantity
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
