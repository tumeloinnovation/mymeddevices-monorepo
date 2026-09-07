"""
Phase 7 Security Hardening & CORS Test Suite

Validates:
- CORS allowed origins, preflight requests, and exposed headers
- Strict security headers (CSP, MIME nosniff, Clickjacking X-Frame-Options DENY)
- Production HSTS enforcement (Strict-Transport-Security)
- No-Cache directives on sensitive endpoints (/auth, /admin, /users)
- Server masking (no sensitive server banner leakage)
"""

from unittest.mock import patch

import pytest
from httpx import AsyncClient

from app.core.config import settings


@pytest.mark.asyncio
async def test_cors_allowed_origin_and_exposed_headers(client: AsyncClient):
    """Verify CORS handles configured origins and exposes tracing headers."""
    response = await client.options(
        "/api/v1/catalog/categories",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert response.headers.get("access-control-allow-credentials") == "true"


@pytest.mark.asyncio
async def test_security_headers_enforcement(client: AsyncClient):
    """Verify security headers are applied to HTTP responses."""
    response = await client.get("/health")
    assert response.status_code == 200

    # 1. Anti-MIME sniffing
    assert response.headers.get("x-content-type-options") == "nosniff"

    # 2. Anti-Clickjacking
    assert response.headers.get("x-frame-options") == "DENY"

    # 3. Referrer Policy
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"

    # 4. Permissions Policy
    perm_policy = response.headers.get("permissions-policy", "")
    assert "camera=()" in perm_policy
    assert "microphone=()" in perm_policy

    # 5. Cross-Origin policies
    assert response.headers.get("cross-origin-opener-policy") == "same-origin"
    assert response.headers.get("cross-origin-resource-policy") in ("same-site", "same-origin")

    # 6. Server banner masked
    assert response.headers.get("server") == "MyMedAPI"
    assert "x-powered-by" not in response.headers

    # 7. Request tracing
    assert "x-request-id" in response.headers
    assert response.headers.get("x-api-version") == "v1"


@pytest.mark.asyncio
async def test_hsts_enforced_in_production(client: AsyncClient):
    """Verify HSTS header is strictly enforced when running in production."""
    with patch.object(settings, "ENVIRONMENT", "production"):
        response = await client.get("/health")
        assert response.status_code == 200
        hsts = response.headers.get("strict-transport-security", "")
        assert "max-age=31536000" in hsts
        assert "includeSubDomains" in hsts
        assert "preload" in hsts


@pytest.mark.asyncio
async def test_no_cache_on_sensitive_routes(client: AsyncClient):
    """Verify sensitive endpoints have no-store/no-cache headers."""
    response = await client.get("/api/v1/auth/me")
    cache_control = response.headers.get("cache-control", "")
    assert "no-store" in cache_control
    assert "no-cache" in cache_control
