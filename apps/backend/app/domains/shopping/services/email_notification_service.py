import os
import uuid
from typing import Optional, List, Dict
from app.core.mail import send_email
from app.core.logging import logger
from app.core.config import settings
from app.core import email_templates

class EmailNotificationService:
    def __init__(self):
        self.site_url = settings.SITE_URL if hasattr(settings, "SITE_URL") else "https://mymeddevices.com"

    async def send_order_confirmation(self, user_email: str, user_name: str, order_number: str, order_date: str, items: List[Dict[str, str]], total: str):
        html_content = email_templates.order_confirmation_html(
            user_name=user_name,
            order_id=order_number,
            order_date=order_date,
            items=items,
            estimated_delivery="2-3 Business Days",
            total=total,
            track_url=f"{self.site_url}/orders/{order_number}"
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

    async def send_order_shipped(self, user_email: str, user_name: str, order_number: str, tracking_number: str, carrier: str = "MedExpress"):
        html_content = email_templates.order_shipped_html(
            user_name=user_name,
            order_id=order_number,
            tracking_number=tracking_number,
            carrier=carrier,
            estimated_delivery="Tomorrow",
            track_url=f"{self.site_url}/orders/{order_number}"
        )
        subject = f"Your order #{order_number} has shipped!"
        body = f"Hi {user_name}, your order #{order_number} has been shipped. Tracking: {tracking_number}"
        
        await send_email(user_email, subject, body, html_content)
        logger.info(f"Order shipped email sent to {user_email}")

    async def send_delivery_confirmation(self, user_email: str, user_name: str, order_number: str):
        html_content = email_templates.delivery_confirmation_html(
            user_name=user_name,
            order_id=order_number
        )
        subject = f"Order Delivered - #{order_number}"
        body = f"Hi {user_name}, your order #{order_number} has been delivered."
        
        await send_email(user_email, subject, body, html_content)
        logger.info(f"Delivery confirmation email sent to {user_email}")

    async def send_vendor_new_order(self, vendor_email: str, vendor_name: str, order_number: str, order_total: float):
        html_content = email_templates.vendor_notification_html(
            title="New Order Received",
            message=f"You have received a new order #{order_number} for Ksh {order_total:,.2f}.",
            detail=f"Please log in to your dashboard to process this order."
        )
        subject = f"New Order - #{order_number}"
        body = f"Hi {vendor_name}, you have received a new order #{order_number} for Ksh {order_total:,.2f}."
        
        await send_email(vendor_email, subject, body, html_content)
        logger.info(f"Vendor notification email sent to {vendor_email}")

    async def send_account_welcome(self, user_email: str, user_name: str, account_id: str):
        html_content = email_templates.account_welcome_html(
            user_name=user_name,
            account_id=account_id,
            verify_url=f"{self.site_url}/verify"
        )
        subject = "Welcome to MyMedDevices!"
        body = f"Hi {user_name}, welcome to MyMedDevices!"
        
        await send_email(user_email, subject, body, html_content)
        logger.info(f"Account welcome email sent to {user_email}")

    async def send_otp(self, user_email: str, otp_code: str, purpose: str = "verification"):
        title = "Email Verification"
        lead_text = "Use the verification code below to verify your email address."
        if purpose == "reset_password":
            title = "Password Reset"
            lead_text = "Use the verification code below to reset your password."
        
        html_content = email_templates.otp_html(
            code=otp_code,
            title=title,
            lead_text=lead_text,
            footer_note="Valid for 15 minutes.",
            expiry_minutes=15
        )
        subject = f"Your Verification Code: {otp_code}"
        body = f"Your code is: {otp_code}"
        
        await send_email(user_email, subject, body, html_content)
        logger.info(f"OTP email sent to {user_email}")
