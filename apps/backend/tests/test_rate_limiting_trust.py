import pytest
from fastapi import Request

from app.core.rate_limiting import get_identifier


@pytest.mark.asyncio
async def test_spoofed_x_forwarded_for_is_ignored_from_untrusted_client():
    """
    Test that when a direct untrusted client (e.g. 198.51.100.25) sends
    a spoofed X-Forwarded-For header, the rate limiter uses the peer socket IP
    (198.51.100.25) and NOT the spoofed header (1.1.1.1).
    """
    # Create mock Request from direct untrusted client
    scope = {
        "type": "http",
        "client": ("198.51.100.25", 54321),
        "headers": [
            (b"host", b"testserver"),
            (b"x-forwarded-for", b"1.1.1.1, 8.8.8.8"),
        ],
    }
    request = Request(scope)

    identifier = await get_identifier(request, "login")

    # Invariant: Must use peer IP 198.51.100.25, NOT 1.1.1.1
    assert "198.51.100.25" in identifier, f"Expected peer IP 198.51.100.25 in identifier, got {identifier}"
    assert "1.1.1.1" not in identifier, f"Spoofed IP 1.1.1.1 was trusted! Identifier: {identifier}"


@pytest.mark.asyncio
async def test_trusted_proxy_extracts_client_ip():
    """
    Test that when a request comes from a TRUSTED proxy (e.g. 127.0.0.1),
    the X-Forwarded-For header IS used to identify the real client.
    """
    scope = {
        "type": "http",
        "client": ("127.0.0.1", 54321),
        "headers": [
            (b"host", b"testserver"),
            (b"x-forwarded-for", b"203.0.113.50"),
        ],
    }
    request = Request(scope)

    identifier = await get_identifier(request, "login")

    # Invariant: Trusted proxy forwarding header should be extracted
    assert "203.0.113.50" in identifier, f"Expected forwarded IP 203.0.113.50 in identifier, got {identifier}"
