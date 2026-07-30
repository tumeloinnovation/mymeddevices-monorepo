"""
Special Password Placeholder Management

This module defines and manages special password formats used for accounts
that cannot have regular passwords (pending registration, guest users).

IMPORTANT: These passwords MUST:
1. Not start with "$argon2" so verify_password() rejects them
2. Use a consistent, documented format
3. Be clearly identifiable in database dumps

Security: These accounts can ONLY authenticate via OTP or other methods,
 NEVER via password login.
"""

import uuid
from typing import Literal, Optional


# Placeholder prefix constants
PLACEHOLDER_PREFIX = "!"
PLACEHOLDER_PENDING = "!pending:"
PLACEHOLDER_GUEST = "!guest:"


def is_placeholder_password(password_hash: str) -> bool:
    """
    Check if a password hash is a special placeholder.

    Args:
        password_hash: The password hash from the database

    Returns:
        True if this is a placeholder password (not Argon2)
    """
    if not password_hash:
        return False
    return password_hash.startswith(PLACEHOLDER_PREFIX)


def get_placeholder_type(password_hash: str) -> Optional[Literal["pending", "guest", "other"]]:
    """
    Identify the type of placeholder password.

    Args:
        password_hash: The password hash from the database

    Returns:
        "pending", "guest", "other", or None if not a placeholder
    """
    if not is_placeholder_password(password_hash):
        return None

    if password_hash.startswith(PLACEHOLDER_PENDING):
        return "pending"
    elif password_hash.startswith(PLACEHOLDER_GUEST):
        return "guest"
    else:
        return "other"


def create_pending_password() -> str:
    """
    Create a placeholder password for pending registration.

    Returns:
        A placeholder password hash in format: !pending:<uuid>
    """
    return f"{PLACEHOLDER_PENDING}{uuid.uuid4()}"


def create_guest_password() -> str:
    """
    Create a placeholder password for guest accounts.

    Returns:
        A placeholder password hash in format: !guest:<uuid>
    """
    return f"{PLACEHOLDER_GUEST}{uuid.uuid4()}"


def can_authenticate_with_password(password_hash: str) -> bool:
    """
    Check if an account can authenticate via password.

    Accounts with placeholder passwords (pending, guest) cannot use
    password authentication - they must use OTP or other methods.

    Args:
        password_hash: The password hash from the database

    Returns:
        True if password login is allowed (has Argon2 hash)
    """
    return password_hash.startswith("$argon2") if password_hash else False
