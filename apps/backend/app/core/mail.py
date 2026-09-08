import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import anyio

from app.core.config import settings
from app.core.logging import logger


def _send_smtp_sync(to_email: str, subject: str, body: str, html_content: str | None = None) -> bool:
    """Synchronous helper to send email via SMTP, to be executed in a thread pool."""
    # Log the email in development/testing so developers can see the output and OTP codes immediately
    if settings.ENVIRONMENT in ("development", "testing") or settings.SMTP_HOST == "localhost":
        logger.info(
            f"\n[EMAIL SIMULATION] {subject}\n"
            f"To: {to_email}\n"
            f"Body: {body}\n"
            f"--------------------------------------------------------"
        )

    try:
        # Create message container
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.FROM_EMAIL
        msg["To"] = to_email
        if settings.REPLY_TO_EMAIL:
            msg["Reply-To"] = settings.REPLY_TO_EMAIL

        # Attach text body
        msg.attach(MIMEText(body, "plain", "utf-8"))

        # Attach HTML body
        if html_content:
            msg.attach(MIMEText(html_content, "html", "utf-8"))
        else:
            # Simple fallback HTML structure if none provided
            fallback_html = f"<html><body><p>{body}</p></body></html>"
            msg.attach(MIMEText(fallback_html, "html", "utf-8"))

        # Establish connection
        # Use reasonable timeout for localhost - Mailpit needs more than 1 second
        timeout = 5.0 if settings.SMTP_HOST in ("localhost", "127.0.0.1") else 10.0
        server: smtplib.SMTP
        if settings.SMTP_USE_SSL:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout)
            if settings.SMTP_USE_TLS:
                server.starttls()

        # Authenticate if credentials are provided
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

        # Send email
        server.sendmail(settings.FROM_EMAIL, [to_email], msg.as_string())
        server.close()

        logger.info(f"Email sent successfully to {to_email} via SMTP ({settings.SMTP_HOST}:{settings.SMTP_PORT})")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMTP email to {to_email}: {e}")
        return False


async def send_email(to_email: str, subject: str, body: str, html_content: str | None = None) -> bool:
    """
    Send an email via SMTP client asynchronously.
    Runs SMTP operations in a worker thread to keep the event loop unblocked.
    """
    return await anyio.to_thread.run_sync(_send_smtp_sync, to_email, subject, body, html_content)
