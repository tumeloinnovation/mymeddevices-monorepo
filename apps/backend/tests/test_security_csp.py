import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_csp_header_does_not_contain_broken_literal_random_nonce():
    """
    Test that the CSP header emitted by the application does NOT contain
    the broken literal string 'nonce-{RANDOM}'.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")

    csp_header = response.headers.get("content-security-policy", "")
    assert csp_header != "", "CSP header should be present"
    assert "nonce-{RANDOM}" not in csp_header, f"CSP contains broken literal nonce string: {csp_header}"
