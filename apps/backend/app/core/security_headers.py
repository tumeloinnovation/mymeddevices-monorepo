"""
Security Headers Middleware for FastAPI.

Adds comprehensive security headers to all HTTP responses to protect
against various web vulnerabilities and attacks.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

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
        # Note: Cross-Origin-Resource-Policy is set to 'same-site' instead of 'same-origin'
        # to allow CORS requests from mobile devices and other origins while maintaining security
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-site"

        # Content-Security-Policy
        path = request.url.path
        csp_directives = self._get_csp_directives(path=path)
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        # Strict-Transport-Security (HTTPS only, production and staging)
        if settings.ENVIRONMENT.lower() in ("production", "staging"):
            # 1 year max-age, include subdomains, preload
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        else:
            logger.debug("Skipping HSTS in development/testing environment")

        # Mask server signature
        response.headers["Server"] = "MyMedAPI"
        if "X-Powered-By" in response.headers:
            del response.headers["X-Powered-By"]

        return response

    def _get_csp_directives(self, path: str = "") -> list[str]:
        """
        Build CSP directives based on environment and requested path.

        Development / Docs: Allow localhost, Swagger UI / ReDoc CDNs, inline scripts
        Production: Strict policy, block unauthorized external resources
        """
        is_dev = settings.ENVIRONMENT.lower() in ("development", "testing", "local", "dev")
        is_docs = path in ("/docs", "/redoc", "/openapi.json") or path.startswith("/docs") or path.startswith("/redoc")

        if is_dev or is_docs:
            # Development & API Docs CSP - allows Swagger UI, ReDoc, and local dev
            return [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com http://localhost:* http://127.0.0.1:*",
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com data:",
                "img-src 'self' data: blob: https: https://fastapi.tiangolo.com https://cdn.jsdelivr.net",
                "worker-src 'self' blob:",
                "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https:",
                "frame-ancestors 'none'",
                "form-action 'self'",
                "base-uri 'self'",
            ]
        else:
            # Production CSP - strict policy
            return [
                "default-src 'self'",
                "script-src 'self'",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com data:",
                "img-src 'self' data: blob: https:",
                "connect-src 'self' https:",
                "frame-ancestors 'none'",
                "form-action 'self'",
                "base-uri 'self'",
                "upgrade-insecure-requests",
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
