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
