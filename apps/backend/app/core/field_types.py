import re
from typing import Annotated

from pydantic import BeforeValidator

KENYAN_PHONE_RE = re.compile(r"^(\+254|0)[1-9]\d{8}$")


def normalize_kenyan_phone(v: str | None) -> str | None:
    """
    Normalize any Kenyan phone string into international +254XXXXXXXXX format.
    Accepts None or empty string gracefully for optional fields.
    """
    if not v:
        return v

    cleaned = v.strip()
    if cleaned.startswith("0"):
        cleaned = "+254" + cleaned[1:]
    elif cleaned.startswith("254") and not cleaned.startswith("+"):
        cleaned = "+" + cleaned

    if not KENYAN_PHONE_RE.match(cleaned):
        raise ValueError("Must be a valid Kenyan phone number (e.g. +254712345678 or 0712345678)")

    return cleaned


# Reusable Pydantic field types
KenyanPhone = Annotated[str, BeforeValidator(normalize_kenyan_phone)]
OptionalKenyanPhone = Annotated[str | None, BeforeValidator(normalize_kenyan_phone)]
