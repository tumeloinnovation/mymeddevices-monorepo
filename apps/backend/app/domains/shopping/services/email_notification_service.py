from typing import Any

from app.core import email_templates
from app.core.config import settings
from app.core.logging import logger
from app.core.mail import send_email


class EmailNotificationService:
    def __init__(self):
        self.site_url = settings.SITE_URL if hasattr(settings, "SITE_URL") else "https://mymeddevices.com"

    async def send_order_confirmation(
        self,
        user_email: str,
        user_name: str,
        order_number: str,
        order_date: str,
        items: list[dict[str, str]],
        total: str,
    ):
        html_content = email_templates.order_confirmation_html(
            user_name=user_name,
            order_id=order_number,
            order_date=order_date,
            items=items,
            estimated_delivery="2-3 Business Days",
            total=total,
            track_url=f"{self.site_url}/orders/{order_number}",
        )
        subject = f"Order Confirmed - #{order_number}"
        body = f"Hi {user_name}, thank you for your order #{order_number}. Total: {total}"

        await send_email(user_email, subject, body, html_content)
        logger.info(f"Order confirmation email sent to {user_email}")

    async def send_payment_received(self, user_email: str, user_name: str, order_number: str, amount: float):
        # We can use vendor_notification or a simple custom one if no dedicated payment template
        # For now, let's use a simple one as it's just a status update
        subject = f"Payment Received - Order #{order_number}"
        body = f"Hi {user_name}, we have received your payment of Ksh {amount:,.2f} for order #{order_number}."

        await send_email(user_email, subject, body)
        logger.info(f"Payment received email sent to {user_email}")

    async def send_order_shipped(
        self, user_email: str, user_name: str, order_number: str, tracking_number: str, carrier: str = "MedExpress"
    ):
        html_content = email_templates.order_shipped_html(
            user_name=user_name,
            order_id=order_number,
            tracking_number=tracking_number,
            carrier=carrier,
            estimated_delivery="Tomorrow",
            track_url=f"{self.site_url}/orders/{order_number}",
        )
        subject = f"Your order #{order_number} has shipped!"
        body = f"Hi {user_name}, your order #{order_number} has been shipped. Tracking: {tracking_number}"

        await send_email(user_email, subject, body, html_content)
        logger.info(f"Order shipped email sent to {user_email}")

    async def send_delivery_confirmation(self, user_email: str, user_name: str, order_number: str):
        html_content = email_templates.delivery_confirmation_html(user_name=user_name, order_id=order_number)
        subject = f"Order Delivered - #{order_number}"
        body = f"Hi {user_name}, your order #{order_number} has been delivered."

        await send_email(user_email, subject, body, html_content)
        logger.info(f"Delivery confirmation email sent to {user_email}")

    async def send_vendor_new_order(self, vendor_email: str, vendor_name: str, order_number: str, order_total: float):
        html_content = email_templates.vendor_notification_html(
            title="New Order Received",
            message=f"You have received a new order #{order_number} for Ksh {order_total:,.2f}.",
            detail="Please log in to your dashboard to process this order.",
        )
        subject = f"New Order - #{order_number}"
        body = f"Hi {vendor_name}, you have received a new order #{order_number} for Ksh {order_total:,.2f}."

        await send_email(vendor_email, subject, body, html_content)
        logger.info(f"Vendor notification email sent to {vendor_email}")

    async def send_vendor_order_with_items(
        self,
        vendor_email: str,
        vendor_name: str,
        order_number: str,
        order_total: float,
        items: list[dict[str, Any]],
        item_count: int,
        total_quantity: int,
        customer_name: str | None = None,
        customer_phone: str | None = None,
        order_id: str | None = None,
    ):
        """Send vendor notification with order items details."""
        # Format items for template
        formatted_items = []
        for item in items:
            formatted_items.append(
                {
                    "name": item.get("name", "Product"),
                    "quantity": item.get("quantity", 1),
                    "unit_price": f"{item.get('unit_price', 0):,.0f}",
                }
            )

        dashboard_target = order_id or order_number
        html_content = email_templates.vendor_order_items_html(
            order_number=order_number,
            order_total=f"{order_total:,.2f}",
            item_count=item_count,
            items=formatted_items,
            customer_name=customer_name,
            customer_phone=customer_phone,
            dashboard_url=f"{self.site_url}/vendor/orders/{dashboard_target}",
        )
        subject = f"New Order Received - #{order_number}"
        body = f"Hi {vendor_name}, you have received a new order #{order_number} for Ksh {order_total:,.2f} with {item_count} item(s)."

        await send_email(vendor_email, subject, body, html_content)
        logger.info(f"Vendor order with items email sent to {vendor_email}")

    async def send_account_welcome(self, user_email: str, user_name: str, account_id: str):
        html_content = email_templates.account_welcome_html(
            user_name=user_name, account_id=account_id, verify_url=f"{self.site_url}/verify"
        )
        subject = "Welcome to MyMedDevices!"
        body = f"Hi {user_name}, welcome to MyMedDevices!"

        await send_email(user_email, subject, body, html_content)
        logger.info(f"Account welcome email sent to {user_email}")

    async def send_otp(self, user_email: str, otp_code: str, purpose: str = "verification"):
        title = "Email Verification"
        lead_text = "Use the verification code below to verify your email address."
        reset_url = None  # Default: no button

        if purpose == "reset_password":
            title = "Password Reset"
            lead_text = "Use the verification code below to reset your password."
            # Generate clickable link with pre-filled code and email
            from urllib.parse import urlencode

            reset_url = f"{self.site_url}/reset-password?{urlencode({'token': otp_code, 'user_id': user_email})}"
        elif purpose == "login":
            title = "Login Verification"
            lead_text = "Use the verification code below to complete your login."
        elif purpose == "email_change":
            title = "Email Change Verification"
            lead_text = "Use the verification code below to verify your new email address."

        html_content = email_templates.otp_html(
            code=otp_code,
            title=title,
            lead_text=lead_text,
            footer_note="If you have any issues, please contact our support team.",
            expiry_minutes=15,
            reset_url=reset_url,
        )
        subject = f"Your Verification Code: {otp_code}"
        body = f"Your code is: {otp_code}"

        await send_email(user_email, subject, body, html_content)
        logger.info(f"OTP email sent to {user_email}")
