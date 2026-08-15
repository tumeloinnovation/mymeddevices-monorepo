import re


class PasswordValidator:
    """Password complexity validator for user security"""

    # Minimum password requirements
    MIN_LENGTH = 8
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGIT = True
    REQUIRE_SPECIAL = True

    # Regex patterns
    UPPERCASE_PATTERN = re.compile(r"[A-Z]")
    LOWERCASE_PATTERN = re.compile(r"[a-z]")
    DIGIT_PATTERN = re.compile(r"\d")
    SPECIAL_PATTERN = re.compile(r'[!@#$%^&*()_+\-=\[\]{};\'\\:"|<>,./?`~]')

    @classmethod
    def validate(cls, password: str) -> tuple[bool, list[str]]:
        """
        Validate password against complexity requirements.

        Returns:
            (is_valid, list of error messages)
        """
        errors = []

        if len(password) < cls.MIN_LENGTH:
            errors.append(f"Password must be at least {cls.MIN_LENGTH} characters long")

        if cls.REQUIRE_UPPERCASE and not cls.UPPERCASE_PATTERN.search(password):
            errors.append("Password must contain at least one uppercase letter")

        if cls.REQUIRE_LOWERCASE and not cls.LOWERCASE_PATTERN.search(password):
            errors.append("Password must contain at least one lowercase letter")

        if cls.REQUIRE_DIGIT and not cls.DIGIT_PATTERN.search(password):
            errors.append("Password must contain at least one digit")

        if cls.REQUIRE_SPECIAL and not cls.SPECIAL_PATTERN.search(password):
            errors.append("Password must contain at least one special character")

        return len(errors) == 0, errors

    @classmethod
    def get_requirements(cls) -> list[str]:
        """Return a list of password requirements for display"""
        requirements = [f"At least {cls.MIN_LENGTH} characters long"]
        if cls.REQUIRE_UPPERCASE:
            requirements.append("One uppercase letter")
        if cls.REQUIRE_LOWERCASE:
            requirements.append("One lowercase letter")
        if cls.REQUIRE_DIGIT:
            requirements.append("One digit")
        if cls.REQUIRE_SPECIAL:
            requirements.append("One special character (!@#$%^&*()_+-=[]{};':\"|<>,./?`~)")

        return requirements


def validate_password_field(password: str) -> None:
    """
    Pydantic field validator for password fields.
    Raises ValueError if password doesn't meet requirements.
    """
    is_valid, errors = PasswordValidator.validate(password)
    if not is_valid:
        raise ValueError("; ".join(errors))
