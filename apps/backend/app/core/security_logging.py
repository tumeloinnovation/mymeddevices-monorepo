"""
Structured Security Event Logging

This module provides centralized security event logging with consistent format,
severity levels, and support for SIEM integration.

Security Events Logged:
- Authentication (success, failure, lockout)
- Account changes (password, email, role)
- Token operations (refresh, revoke, blacklist)
- Authorization failures
- Suspicious activities

All events include: timestamp, event_type, severity, user_id (if applicable),
ip_address, user_agent, and contextual details.
"""

import json
from datetime import datetime, timezone
from typing import Any, Optional
from enum import Enum
from app.core.logging import logger


class SecurityEventType(str, Enum):
    """Security event types for categorization and filtering."""
    # Authentication events
    AUTH_SUCCESS = "auth.success"
    AUTH_FAILURE = "auth.failure"
    AUTH_LOCKOUT = "auth.lockout"
    AUTH_LOCKOUT_RESET = "auth.lockout_reset"
    AUTH_LOGOUT = "auth.logout"

    # Password events
    PASSWORD_CHANGE_SUCCESS = "password.change_success"
    PASSWORD_CHANGE_FAILURE = "password.change_failure"
    PASSWORD_RESET_REQUEST = "password.reset_request"
    PASSWORD_RESET_SUCCESS = "password.reset_success"
    PASSWORD_VALIDATION_FAILURE = "password.validation_failure"

    # Account events
    ACCOUNT_CREATED = "account.created"
    ACCOUNT_DELETED = "account.deleted"
    ACCOUNT_DISABLED = "account.disabled"
    EMAIL_CHANGE_REQUEST = "email.change_request"
    EMAIL_CHANGE_SUCCESS = "email.change_success"
    ROLE_CHANGE = "role.change"

    # Token events
    TOKEN_ISSUED = "token.issued"
    TOKEN_REFRESHED = "token.refreshed"
    TOKEN_REVOKED = "token.revoked"
    TOKEN_BLACKLISTED = "token.blacklisted"
    TOKEN_REUSE_DETECTED = "token.reuse_detected"

    # Authorization events
    AUTHORIZATION_DENIED = "authorization.denied"
    PRIVILEGE_ESCALATION_ATTEMPT = "privilege.escalation_attempt"

    # Suspicious activities
    SUSPICIOUS_ACTIVITY = "suspicious.activity"
    BRUTE_FORCE_DETECTED = "brute_force.detected"
    CREDENTIAL_STUFFING_DETECTED = "credential.stuffing_detected"
    ANOMALOUS_LOGIN = "anomalous.login"


class SecuritySeverity(str, Enum):
    """Security event severity levels."""
    CRITICAL = "critical"      # Immediate action required (e.g., breach detected)
    HIGH = "high"             # Investigate soon (e.g., multiple failed logins)
    MEDIUM = "medium"         # Monitor (e.g., password validation failure)
    LOW = "low"               # Informational (e.g., successful login)
    INFO = "info"             # Audit trail (e.g., normal operations)


def log_security_event(
    event_type: SecurityEventType,
    severity: SecuritySeverity = SecuritySeverity.INFO,
    user_id: Optional[str] = None,
    email: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> None:
    """
    Log a structured security event.

    Args:
        event_type: Type of security event
        severity: Severity level (CRITICAL, HIGH, MEDIUM, LOW, INFO)
        user_id: User UUID (if applicable)
        email: User email (if applicable)
        ip_address: Client IP address
        user_agent: Client user agent string
        details: Additional event-specific details
        request_id: Request ID for tracing
    """
    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type.value,
        "severity": severity.value,
    }

    # Add user context if available
    if user_id:
        event["user_id"] = user_id
    if email:
        event["email"] = email

    # Add request context if available
    if request_id:
        event["request_id"] = request_id
    if ip_address:
        event["ip_address"] = ip_address
    if user_agent:
        event["user_agent"] = user_agent

    # Add event-specific details
    if details:
        event["details"] = details

    # Log based on severity
    event_json = json.dumps(event)

    if severity == SecuritySeverity.CRITICAL:
        logger.error(f"[SECURITY:CRITICAL] {event_json}")
    elif severity == SecuritySeverity.HIGH:
        logger.warning(f"[SECURITY:HIGH] {event_json}")
    elif severity == SecuritySeverity.MEDIUM:
        logger.warning(f"[SECURITY:MEDIUM] {event_json}")
    elif severity == SecuritySeverity.LOW:
        logger.info(f"[SECURITY:LOW] {event_json}")
    else:  # INFO
        logger.info(f"[SECURITY:INFO] {event_json}")


# Convenience functions for common security events

def log_auth_success(
    user_id: str,
    email: str,
    method: str,  # "password", "otp", "token"
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    request_id: Optional[str] = None
) -> None:
    """Log successful authentication."""
    log_security_event(
        event_type=SecurityEventType.AUTH_SUCCESS,
        severity=SecuritySeverity.LOW,
        user_id=user_id,
        email=email,
        ip_address=ip_address,
        user_agent=user_agent,
        request_id=request_id,
        details={"method": method}
    )


def log_auth_failure(
    email: str,
    reason: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    request_id: Optional[str] = None
) -> None:
    """Log failed authentication attempt."""
    log_security_event(
        event_type=SecurityEventType.AUTH_FAILURE,
        severity=SecuritySeverity.MEDIUM,
        email=email,
        ip_address=ip_address,
        user_agent=user_agent,
        request_id=request_id,
        details={"reason": reason}
    )


def log_account_lockout(
    email: str,
    failed_attempts: int,
    lockout_duration_minutes: int,
    ip_address: Optional[str] = None,
    request_id: Optional[str] = None
) -> None:
    """Log account lockout event."""
    log_security_event(
        event_type=SecurityEventType.AUTH_LOCKOUT,
        severity=SecuritySeverity.HIGH,
        email=email,
        ip_address=ip_address,
        request_id=request_id,
        details={
            "failed_attempts": failed_attempts,
            "lockout_duration_minutes": lockout_duration_minutes
        }
    )


def log_password_validation_failure(
    email: str,
    validation_errors: list[str],
    ip_address: Optional[str] = None,
    request_id: Optional[str] = None
) -> None:
    """Log password validation failure."""
    log_security_event(
        event_type=SecurityEventType.PASSWORD_VALIDATION_FAILURE,
        severity=SecuritySeverity.LOW,
        email=email,
        ip_address=ip_address,
        request_id=request_id,
        details={"validation_errors": validation_errors}
    )


def log_token_issued(
    user_id: str,
    email: str,
    token_type: str,  # "access", "refresh"
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    request_id: Optional[str] = None
) -> None:
    """Log token issuance."""
    log_security_event(
        event_type=SecurityEventType.TOKEN_ISSUED,
        severity=SecuritySeverity.INFO,
        user_id=user_id,
        email=email,
        ip_address=ip_address,
        user_agent=user_agent,
        request_id=request_id,
        details={"token_type": token_type}
    )


def log_token_refreshed(
    user_id: str,
    email: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    request_id: Optional[str] = None
) -> None:
    """Log token refresh (rotation)."""
    log_security_event(
        event_type=SecurityEventType.TOKEN_REFRESHED,
        severity=SecuritySeverity.INFO,
        user_id=user_id,
        email=email,
        ip_address=ip_address,
        user_agent=user_agent,
        request_id=request_id
    )


def log_token_revoked(
    user_id: str,
    email: str,
    reason: str,  # "logout", "password_change", "security"
    ip_address: Optional[str] = None,
    request_id: Optional[str] = None
) -> None:
    """Log token revocation."""
    log_security_event(
        event_type=SecurityEventType.TOKEN_REVOKED,
        severity=SecuritySeverity.LOW,
        user_id=user_id,
        email=email,
        ip_address=ip_address,
        request_id=request_id,
        details={"reason": reason}
    )


def log_token_reuse_detected(
    email: str,
    token_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    request_id: Optional[str] = None
) -> None:
    """Log attempt to reuse a revoked token (potential theft)."""
    log_security_event(
        event_type=SecurityEventType.TOKEN_REUSE_DETECTED,
        severity=SecuritySeverity.HIGH,
        email=email,
        ip_address=ip_address,
        request_id=request_id,
        details={"token_id": token_id} if token_id else {}
    )


def log_suspicious_activity(
    description: str,
    severity: SecuritySeverity = SecuritySeverity.HIGH,
    email: Optional[str] = None,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> None:
    """Log suspicious activity."""
    log_security_event(
        event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity=severity,
        user_id=user_id,
        email=email,
        ip_address=ip_address,
        request_id=request_id,
        details={"description": description, **(details or {})}
    )


def log_authorization_denied(
    user_id: str,
    email: str,
    resource: str,
    action: str,
    ip_address: Optional[str] = None,
    request_id: Optional[str] = None
) -> None:
    """Log authorization denial."""
    log_security_event(
        event_type=SecurityEventType.AUTHORIZATION_DENIED,
        severity=SecuritySeverity.MEDIUM,
        user_id=user_id,
        email=email,
        ip_address=ip_address,
        request_id=request_id,
        details={"resource": resource, "action": action}
    )


def extract_request_context(request) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Extract request context (request_id, ip_address, user_agent) from a FastAPI request.

    Args:
        request: FastAPI Request object

    Returns:
        Tuple of (request_id, ip_address, user_agent)
    """
    request_id = getattr(request.state, "request_id", None) if request else None

    ip_address = None
    user_agent = None
    if request:
        # Try to get IP from X-Forwarded-For header first (proxy/reverse proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            ip_address = forwarded_for.split(",")[0].strip()
        else:
            ip_address = request.client.host if request.client else None

        user_agent = request.headers.get("User-Agent")

    return request_id, ip_address, user_agent
