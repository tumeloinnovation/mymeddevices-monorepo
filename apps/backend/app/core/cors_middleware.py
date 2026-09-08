"""
Custom CORS middleware that supports wildcard patterns for local network origins.

This allows mobile devices on the same network (e.g., 192.168.x.x) to access the API
during development while maintaining strict CORS in production.
"""

import re

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.config import settings
from app.core.logging import logger


def origin_matches(pattern: str, origin: str) -> bool:
    """
    Check if an origin matches a pattern that may contain wildcards.

    Supports:
    - Exact matches: http://localhost:3000
    - Port wildcards: http://localhost:* (matches any port)
    - IP wildcard ranges: http://192.168.*:* (matches any IP in that range)
    """
    if pattern == "*" or origin == "*":
        return True

    # Convert wildcard pattern to regex
    # Escape special regex chars except * which becomes .*
    regex_pattern = pattern.replace(".", r"\.").replace("*", ".*")
    # Anchor to match full origin
    regex_pattern = f"^{regex_pattern}$"

    return re.match(regex_pattern, origin) is not None


class WildcardCORSMiddleware(BaseHTTPMiddleware):
    """
    CORS middleware that supports wildcard patterns in allowed origins.

    This is needed because Starlette's CORSMiddleware doesn't support wildcard
    patterns like "http://192.168.*:*" which are essential for mobile testing
    on local networks where the device's IP can vary.

    In production, use the standard list of exact origins from env vars.
    """

    def __init__(self, app):
        super().__init__(app)
        self.allow_origins = settings.cors_origins
        self.allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
        self.allow_headers = ["*"]
        self.expose_headers = ["X-Request-ID", "X-API-Version", "Content-Disposition"]
        self.allow_credentials = True
        self.max_age = 600

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Get the origin from the request
        origin = request.headers.get("origin")

        # Check if origin is allowed
        origin_allowed = False
        if origin:
            origin_allowed = any(origin_matches(pattern, origin) for pattern in self.allow_origins)

        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            if origin_allowed:
                self._add_cors_headers(response, origin)
            return response

        # Process the request
        response = await call_next(request)

        # Add CORS headers if origin is allowed
        if origin_allowed:
            self._add_cors_headers(response, origin)

        return response

    def _add_cors_headers(self, response: Response, origin: str | None) -> None:
        """Add CORS headers to the response."""
        # Allow the specific origin (not * when credentials are enabled)
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin

        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = ", ".join(self.allow_methods)
        response.headers["Access-Control-Allow-Headers"] = ", ".join(self.allow_headers)
        response.headers["Access-Control-Expose-Headers"] = ", ".join(self.expose_headers)
        response.headers["Access-Control-Max-Age"] = str(self.max_age)

        # Vary header is important for caching
        response.headers["Vary"] = "Origin"


def add_cors_middleware(app) -> None:
    """
    Add the custom CORS middleware to a FastAPI application.

    This should be called BEFORE other middleware to ensure CORS headers
    are added to all responses.
    """
    app.add_middleware(WildcardCORSMiddleware)
    logger.info("Custom CORS middleware with wildcard support registered")
    logger.debug(f"Allowed origins patterns: {settings.cors_origins}")
