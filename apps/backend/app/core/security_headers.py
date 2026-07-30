"""
Security Headers Middleware for FastAPI.

Adds comprehensive security headers to all HTTP responses to protect
against various web vulnerabilities and attacks.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.base import RequestResponseEndpoint
from app.core.config import settings
from app.core.logging import logger


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all HTTP responses.

    Security headers added:
    - X-Content-Type-Options: Prevents MIME-sniffing
    - X-Frame-Options: Prevents clickjacking
    - Content-Security-Policy: Controls resource loading
    - Referrer-Policy: Controls referrer information
    - Permissions-Policy: Controls browser features
    - Cross-Origin-Opener-Policy: Process isolation
    - Cross-Origin-Resource-Policy: Same-site only
    - Strict-Transport-Security: HTTPS enforcement (production only)

    Environment-specific behavior:
    - Development: Looser CSP, no HSTS
    - Production: Strict CSP, HSTS enabled
    """

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        response = await call_next(request)

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Referrer policy - strict for privacy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions policy (formerly Feature-Policy)
        # Controls which browser features can be used
        permissions_policy = [
            "geolocation=()",
            "microphone=()",
            "camera=()",
            "payment=(self)",
            "usb=()",
            "magnetometer=()",
            "gyroscope=()",
            "accelerometer=()",
        ]
        response.headers["Permissions-Policy"] = ", ".join(permissions_policy)

        # Cross-Origin policies for better isolation
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

        # Content-Security-Policy
        csp_directives = self._get_csp_directives()
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        # Strict-Transport-Security (HTTPS only, production only)
        if settings.ENVIRONMENT == "production":
            # 1 year max-age, include subdomains
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        else:
            logger.debug("Skipping HSTS in development environment")

        return response

    def _get_csp_directives(self) -> list[str]:
        """
        Build CSP directives based on environment.

        Development: Allow localhost, inline scripts for dev tools
        Production: Strict policy, block all external resources except approved
        """
        is_dev = settings.ENVIRONMENT in ("development", "testing")

        if is_dev:
            # Development CSP - allows more for debugging
            return [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://127.0.0.1:*",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: blob: https:",
                "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
                "frame-ancestors 'none'",
                "form-action 'self'",
                "base-uri 'self'",
                "upgrade-insecure-requests",
            ]
        else:
            # Production CSP - strict
            return [
                "default-src 'self'",
                "script-src 'self' 'nonce-{RANDOM}' 'strict-dynamic'",  # Requires nonce implementation
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: blob: https: 'self'",
                "connect-src 'self' https:",
                "frame-ancestors 'none'",
                "form-action 'self'",
                "base-uri 'self'",
                "require-trusted-types-for 'script'",
                "upgrade-insecure-requests",
                "block-all-mixed-content",
            ]


class APIProtectionMiddleware(BaseHTTPMiddleware):
    """
    Additional API-specific protections.

    Adds:
    - API versioning information
    - Rate limit information headers
    - Request ID tracking
    """

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        # Add unique request ID for tracing
        import uuid
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)

        # Add request ID to response
        response.headers["X-Request-ID"] = request_id

        # API information
        response.headers["X-API-Version"] = "v1"

        # Security headers specific to APIs
        response.headers["X-Content-Type-Options"] = "nosniff"

        return response


class NoCacheMiddleware(BaseHTTPMiddleware):
    """
    Disable caching for sensitive endpoints.

    This middleware adds cache-control headers to prevent
    caching of sensitive data in browsers or proxies.

    Apply selectively to routes that handle sensitive data.
    """

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        response = await call_next(request)

        # Apply to auth-related and admin routes
        sensitive_paths = ["/api/v1/auth", "/api/v1/admin", "/api/v1/users"]

        if any(request.url.path.startswith(path) for path in sensitive_paths):
            # No cache, no store, must revalidate
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"

        return response


# Helper function to easily apply security headers
def add_security_headers(app) -> None:
    """
    Add all security middleware to a FastAPI application.

    Usage:
        from app.core.security_headers import add_security_headers
        add_security_headers(app)

    Or use individual middleware classes for fine-grained control.
    """
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(APIProtectionMiddleware)
    app.add_middleware(NoCacheMiddleware)

    logger.info("Security headers middleware registered")
