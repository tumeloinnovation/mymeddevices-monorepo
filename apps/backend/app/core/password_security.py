"""
Password strength validation and security utilities.

Enforces strong password requirements to protect user accounts
from credential stuffing, brute force, and dictionary attacks.
"""

import re
from typing import Tuple, List
from dataclasses import dataclass

# Top 1000 most common passwords (sample set - expand as needed)
COMMON_PASSWORDS = {
    # Simple sequences
    "password", "password123", "12345678", "123456789", "qwerty",
    "abc123", "letmein", "monkey", "dragon", "master",

    # Common patterns
    "password1", "iloveyou", "princess", "admin", "welcome",
    "football", "123123", "batman", "trustno1", "superman",

    # Year-based
    "password2024", "password2025", "password2026",
    "20242024", "20252025",

    # Personal info patterns
    "mypassword", "mypassword123", "password1234",
    "mypass", "passw0rd", "pass123",

    # Keyboard patterns
    "qwertyuiop", "asdfghjkl", "zxcvbnm", "1q2w3e4r",

    # Common names/words
    "charlie", "andrew", "michael", "jordan", "matthew",
    "ashley", "jennifer", "amanda", "joshua", "daniel",

    # Context-specific
    "mymed", "mymed123", "medical", "devices123",
}


@dataclass
class PasswordPolicy:
    """Configurable password policy settings."""
    min_length: int = 8
    max_length: int = 128
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_digit: bool = True
    require_special: bool = True
    forbidden_common_passwords: bool = True
    forbid_user_info_in_password: bool = True
    min_unique_characters: int = 8


class PasswordValidationError(Exception):
    """Raised when password validation fails."""

    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__("; ".join(errors))


class PasswordValidator:
    """
    Comprehensive password strength validator.

    Enforces complexity requirements, checks against common passwords,
    and validates against user information to prevent credential reuse.
    """

    def __init__(self, policy: PasswordPolicy | None = None):
        self.policy = policy or PasswordPolicy()

    def validate(
        self,
        password: str,
        user_info: dict | None = None
    ) -> Tuple[bool, List[str]]:
        """
        Validate password against security policy.

        Args:
            password: The password to validate
            user_info: Optional dict with user data (email, name, etc.)
                      to prevent inclusion in password

        Returns:
            (is_valid, error_messages)
        """
        errors = []

        # Length check
        if len(password) < self.policy.min_length:
            errors.append(f"Password must be at least {self.policy.min_length} characters long")

        if len(password) > self.policy.max_length:
            errors.append(f"Password must not exceed {self.policy.max_length} characters")

        # Complexity checks
        if self.policy.require_uppercase and not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter (A-Z)")

        if self.policy.require_lowercase and not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter (a-z)")

        if self.policy.require_digit and not re.search(r'\d', password):
            errors.append("Password must contain at least one number (0-9)")

        if self.policy.require_special:
            # Define special characters that are commonly allowed
            special_chars = r'[!@#$%^&*(),.?":{}|<>~`_+\-=\[\]\\]'
            if not re.search(special_chars, password):
                errors.append(
                    "Password must contain at least one special character "
                    "(!@#$%^&*(),.?\":{}|<>~`_+-=[]\\)"
                )

        # Unique character count (prevents aaaaabbbbbcccc type patterns)
        if self.policy.min_unique_characters:
            unique_chars = len(set(password))
            if unique_chars < self.policy.min_unique_characters:
                errors.append(
                    f"Password must contain at least {self.policy.min_unique_characters} "
                    "unique characters"
                )

        # Common password check
        if self.policy.forbidden_common_passwords:
            normalized = password.lower().strip()
            if normalized in COMMON_PASSWORDS:
                errors.append("This password is too common and easily guessed. Please choose a stronger password.")

        # Character sequence detection (e.g., "abcd", "1234", "qwerty")
        self._check_sequences(password, errors)

        # Repetitive character detection (e.g., "aaaa", "1111")
        self._check_repetitions(password, errors)

        # User info check (prevent email/name in password)
        if self.policy.forbid_user_info_in_password and user_info:
            self._check_user_info(password, user_info, errors)

        return len(errors) == 0, errors

    def _check_sequences(self, password: str, errors: List[str]) -> None:
        """Check for common keyboard/character sequences."""
        password_lower = password.lower()

        # Character sequences to check
        sequences = [
            # Letter sequences
            "abcdefghijklmnopqrstuvwxyz",
            # Reverse letter sequences
            "zyxwvutsrqponmlkjihgfedcba",
            # Number sequences
            "0123456789",
            # Reverse number sequences
            "9876543210",
            # Keyboard rows (QWERTY)
            "qwertyuiop",
            "asdfghjkl",
            "zxcvbnm",
        ]

        for seq in sequences:
            # Check for 4+ consecutive characters
            for i in range(len(seq) - 3):
                fragment = seq[i:i+4]
                if fragment in password_lower:
                    errors.append(
                        f"Password contains a common sequence ('{fragment}'). "
                        "Avoid sequential characters."
                    )
                    return  # Only report one sequence error

    def _check_repetitions(self, password: str, errors: List[str]) -> None:
        """Check for excessive character repetition."""
        if re.search(r'(.)\1{3,}', password):
            errors.append(
                "Password contains repeated characters. "
                "Avoid using the same character 4+ times in a row."
            )

    def _check_user_info(self, password: str, user_info: dict, errors: List[str]) -> None:
        """Check if password contains user's personal information."""
        password_lower = password.lower()

        # Extract user info fields (handle None values)
        email = (user_info.get("email") or "").lower()
        first_name = (user_info.get("first_name") or "").lower()
        last_name = (user_info.get("last_name") or "").lower()
        company_name = (user_info.get("company_name") or "").lower()

        # Get username from email (before @)
        username = email.split("@")[0] if email else ""

        # Check each piece of info
        for info_name, info_value in [
            ("email username", username),
            ("first name", first_name),
            ("last name", last_name),
            ("company name", company_name),
        ]:
            if info_value and len(info_value) >= 3 and info_value not in ("test", "guest", "admin", "demo") and info_value in password_lower:
                errors.append(
                    f"Password cannot contain your {info_name}. "
                    f"Found '{info_value}' in password."
                )

    def get_strength_score(self, password: str) -> int:
        """
        Calculate password strength score (0-100).
        Useful for visual feedback during registration.

        Scoring:
        - Length: up to 30 points
        - Character variety: up to 30 points
        - Complexity: up to 20 points
        - Unpredictability: up to 20 points
        """
        score = 0

        # Length score (0-30)
        length_score = min(len(password) / 16 * 30, 30)
        score += length_score

        # Character variety (0-30)
        has_upper = bool(re.search(r'[A-Z]', password))
        has_lower = bool(re.search(r'[a-z]', password))
        has_digit = bool(re.search(r'\d', password))
        has_special = bool(re.search(r'[!@#$%^&*(),.?":{}|<>~`_+\-=\[\]\\]', password))

        variety_score = sum([has_upper, has_lower, has_digit, has_special]) * 7.5
        score += variety_score

        # Complexity bonus (0-20)
        if len(set(password)) >= 8:
            score += 10
        if len(set(password)) >= 12:
            score += 10

        # Unpredictability (0-20)
        password_lower = password.lower()
        if password_lower not in COMMON_PASSWORDS:
            score += 10

        # Deduct for patterns
        if re.search(r'(.)\1{2,}', password):
            score -= 5
        if re.search(r'0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef', password_lower):
            score -= 5

        return max(0, min(100, int(score)))


# Global validator instance with default policy
password_validator = PasswordValidator()


def validate_password(
    password: str,
    user_info: dict | None = None,
    policy: PasswordPolicy | None = None
) -> Tuple[bool, List[str]]:
    """
    Convenience function to validate a password.

    Args:
        password: The password to validate
        user_info: Optional user context for validation
        policy: Optional custom policy (uses default if not provided)

    Returns:
        (is_valid, error_messages)

    Raises:
        PasswordValidationError: If validation fails and raise_on=True

    Example:
        >>> is_valid, errors = validate_password("Weak123!")
        >>> if not is_valid:
        ...     print("; ".join(errors))
    """
    validator = PasswordValidator(policy) if policy else password_validator
    return validator.validate(password, user_info)


def get_password_strength(password: str) -> dict:
    """
    Get password strength information for UI feedback.

    Returns:
        Dict with:
        - score: 0-100 strength score
        - label: 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'
        - color: Hex color for UI indicator
    """
    score = password_validator.get_strength_score(password)

    if score < 20:
        label = "Weak"
        color = "#ef4444"  # Red
    elif score < 40:
        label = "Fair"
        color = "#f59e0b"  # Orange
    elif score < 60:
        label = "Good"
        color = "#eab308"  # Yellow
    elif score < 80:
        label = "Strong"
        color = "#22c55e"  # Green
    else:
        label = "Very Strong"
        color = "#16a34a"  # Dark Green

    return {
        "score": score,
        "label": label,
        "color": color
    }
