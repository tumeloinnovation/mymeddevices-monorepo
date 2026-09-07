from unittest.mock import patch

import pytest

from app.core.middleware import _redact_body


def test_sensitive_field_redaction():
    """
    Test that sensitive fields (password, tokens, otp, secret, pins) are redacted in request logs.
    """
    payload = {
        "email": "user@test.com",
        "password": "SuperSecretPassword123!",
        "access_token": "jwt.token.secret",
        "otp": "123456",
        "nested": {
            "token": "nested_secret",
            "safe_field": "visible_value",
        },
    }

    redacted = _redact_body(payload)

    assert redacted["email"] == "user@test.com"
    assert redacted["password"] == "<redacted>"
    assert redacted["access_token"] == "<redacted>"
    assert redacted["nested"]["token"] == "<redacted>"
    assert redacted["nested"]["safe_field"] == "visible_value"


def test_sensitive_field_redaction_matches_substring_variants():
    """
    Credential-bearing key variants (old_password, new_password, otp code/pin fields)
    must be redacted even when the exact key name differs from the base word.
    """
    payload = {
        "old_password": "OldPass123!",
        "new_password": "NewPass456!",
        "code": "654321",  # OTP verification code
        "pin": "9876",
        "otp_code": "112233",
        "api_token": "abc.def.ghi",
        "client_secret": "s3cr3t",
        "authorization_code": "auth-code-1",
        "profile": {
            "first_name": "Jane",
            "postal_code": "00100",  # Non-credential field: stays visible
        },
        "contacts": [{"phone": "0712345678", "verification_code": "445566"}],
    }

    redacted = _redact_body(payload)

    assert redacted["old_password"] == "<redacted>"
    assert redacted["new_password"] == "<redacted>"
    assert redacted["code"] == "<redacted>"
    assert redacted["pin"] == "<redacted>"
    assert redacted["otp_code"] == "<redacted>"
    assert redacted["api_token"] == "<redacted>"
    assert redacted["client_secret"] == "<redacted>"
    assert redacted["authorization_code"] == "<redacted>"
    assert redacted["profile"]["first_name"] == "Jane"
    assert redacted["profile"]["postal_code"] == "00100"
    assert redacted["contacts"][0]["phone"] == "0712345678"
    assert redacted["contacts"][0]["verification_code"] == "<redacted>"


@pytest.mark.asyncio
async def test_simulated_sms_otp_code_not_logged_outside_development():
    """Simulated-SMS OTP codes (used for login) must never reach logs outside development."""
    from app.core.config import settings
    from app.domains.auth.services.otp_service import OTPService

    otp_code = "654321"
    service = OTPService(db=None)

    for environment in ("production", "staging"):
        with (
            patch.object(settings, "HOSTPINNACLE_API_KEY", None),
            patch.object(settings, "HOSTPINNACLE_PARTNER_ID", None),
            patch.object(settings, "ENVIRONMENT", environment),
            patch("app.domains.auth.services.otp_service.logger") as mock_logger,
        ):
            result = await service.send_otp_sms("0712345678", otp_code, purpose="login")

            assert result is True
            logged_messages = [str(call.args[0]) for call in mock_logger.info.call_args_list if call.args]
            logged_messages += [str(call.args[0]) for call in mock_logger.warning.call_args_list if call.args]
            assert logged_messages, "expected the missing-SMS-credentials path to log something"
            assert all(otp_code not in message for message in logged_messages)


@pytest.mark.asyncio
async def test_simulated_sms_otp_code_logged_in_development():
    """In local development the simulated SMS code remains available for testing convenience."""
    from app.core.config import settings
    from app.domains.auth.services.otp_service import OTPService

    otp_code = "654321"
    service = OTPService(db=None)

    with (
        patch.object(settings, "HOSTPINNACLE_API_KEY", None),
        patch.object(settings, "HOSTPINNACLE_PARTNER_ID", None),
        patch.object(settings, "ENVIRONMENT", "development"),
        patch("app.domains.auth.services.otp_service.logger") as mock_logger,
    ):
        result = await service.send_otp_sms("0712345678", otp_code, purpose="login")

        assert result is True
        logged_messages = [str(call.args[0]) for call in mock_logger.info.call_args_list if call.args]
        assert any(otp_code in message for message in logged_messages)
