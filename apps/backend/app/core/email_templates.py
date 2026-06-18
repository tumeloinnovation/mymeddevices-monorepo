import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

# Setup Jinja2 environment
# The compiled templates are in apps/backend/compiled_emails
# We use absolute path to be safe
COMPILED_EMAILS_DIR = Path(__file__).parent.parent.parent / "compiled_emails"

env = Environment(
    loader=FileSystemLoader(str(COMPILED_EMAILS_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


def render_email_template(template_name: str, context: Dict[str, Any]) -> str:
    """Helper to render a compiled MJML template with Jinja2."""
    template = env.get_template(template_name)
    
    # Add common variables if not present
    if "logo_url" not in context:
        context["logo_url"] = settings.EMAIL_LOGO_URL or ""
    if "site_url" not in context:
        context["site_url"] = settings.SITE_URL or ""
        
    return template.render(**context)


def otp_html(code: str, title: str, lead_text: str, footer_note: str, expiry_minutes: int) -> str:
    return render_email_template(
        "otp.html",
        {
            "title": title,
            "preheader": f"Your verification code: {code} — expires in {expiry_minutes} minutes",
            "code": code,
            "lead_text": lead_text,
            "footer_note": footer_note,
            "expiry_minutes": expiry_minutes,
        },
    )


def vendor_notification_html(title: str, message: str, detail: Optional[str] = None) -> str:
    return render_email_template(
        "vendor_notification.html",
        {
            "title": title,
            "message": message,
            "detail": detail,
        },
    )


def new_device_login_html(
    user_name: str,
    device: str,
    browser: str,
    location: str,
    time: str,
    security_url: Optional[str] = None,
) -> str:
    return render_email_template(
        "new_device_login.html",
        {
            "user_name": user_name,
            "device": device,
            "browser": browser,
            "location": location,
            "time": time,
            "security_url": security_url or f"{settings.SITE_URL}/security",
            "title": "New Login Detected",
            "preheader": "We noticed a sign-in to your account from a new device or location.",
        },
    )


def password_changed_html(
    user_name: str,
    change_time: str,
    reset_url: Optional[str] = None,
) -> str:
    return render_email_template(
        "password_changed.html",
        {
            "user_name": user_name,
            "change_time": change_time,
            "reset_url": reset_url or f"{settings.SITE_URL}/reset-password",
            "title": "Password Changed",
            "preheader": "Your MyMedDevices account password has been updated.",
        },
    )


def account_welcome_html(
    user_name: str,
    account_id: str,
    verify_url: str,
) -> str:
    return render_email_template(
        "account_welcome.html",
        {
            "user_name": user_name,
            "account_id": account_id,
            "verify_url": verify_url,
            "title": "Welcome to MyMedDevices",
            "preheader": "Your account has been created. Complete your profile to get started.",
        },
    )


def order_confirmation_html(
    user_name: str,
    order_id: str,
    order_date: str,
    items: List[Dict[str, str]],
    estimated_delivery: str,
    total: str,
    track_url: str,
) -> str:
    return render_email_template(
        "order_confirmation.html",
        {
            "user_name": user_name,
            "order_id": order_id,
            "order_date": order_date,
            "items": items,
            "estimated_delivery": estimated_delivery,
            "total": total,
            "track_url": track_url,
            "title": f"Order Confirmed — {order_id}",
            "preheader": f"Your order {order_id} has been confirmed. Estimated delivery: {estimated_delivery}.",
        },
    )


def order_shipped_html(
    user_name: str,
    order_id: str,
    tracking_number: str,
    carrier: str,
    estimated_delivery: str,
    track_url: str,
    support_url: Optional[str] = None,
) -> str:
    return render_email_template(
        "order_shipped.html",
        {
            "user_name": user_name,
            "order_id": order_id,
            "tracking_number": tracking_number,
            "carrier": carrier,
            "estimated_delivery": estimated_delivery,
            "track_url": track_url,
            "support_url": support_url or f"{settings.SITE_URL}/support",
            "title": f"Your Order Has Shipped — {order_id}",
            "preheader": f"Your order {order_id} has been shipped via {carrier}.",
        },
    )


def delivery_confirmation_html(
    user_name: str,
    order_id: str,
    support_url: Optional[str] = None,
    instructions_url: Optional[str] = None,
) -> str:
    return render_email_template(
        "delivery_confirmation.html",
        {
            "user_name": user_name,
            "order_id": order_id,
            "support_url": support_url or f"{settings.SITE_URL}/support",
            "instructions_url": instructions_url or f"{settings.SITE_URL}/device-instructions",
            "title": f"Delivery Confirmed — {order_id}",
            "preheader": f"Your order {order_id} has been delivered.",
        },
    )
