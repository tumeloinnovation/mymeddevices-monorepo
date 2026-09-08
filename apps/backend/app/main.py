import asyncio
import os
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Any

from fastapi import Depends, FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession

# Ensure all SQLAlchemy models are registered
import app.domains.auth.models  # noqa: F401
import app.domains.catalog.models  # noqa: F401
import app.domains.customers.models  # noqa: F401
import app.domains.logistics.models  # noqa: F401
import app.domains.returns.models  # noqa: F401
import app.domains.shared.models  # noqa: F401
import app.domains.shopping.models  # noqa: F401
import app.domains.payments.models  # noqa: F401
import app.domains.tickets.models  # noqa: F401
import app.domains.vendor.models  # noqa: F401
from app.core.config import settings
from app.core.cors_middleware import add_cors_middleware
from app.core.database import get_db
from app.core.logging import logger
from app.core.middleware import ContentLengthLimitMiddleware, RequestLoggingMiddleware
from app.core.security_headers import APIProtectionMiddleware, NoCacheMiddleware, SecurityHeadersMiddleware
from app.core.tasks import start_cleanup_scheduler, start_outbox_relay_scheduler
from app.domains.admin.api.analytics_api import router as admin_analytics_router
from app.domains.admin.api.bundles_api import router as admin_bundles_router
from app.domains.admin.api.marketing_campaigns_api import router as marketing_campaigns_router
from app.domains.admin.api.reviews_moderation_api import router as admin_reviews_router
from app.domains.admin.api.system_api import router as system_router
from app.domains.admin.api.users_management_api import router as users_management_router
from app.domains.auth.api.auth_api import router as auth_router
from app.domains.auth.api.otp_api import router as otp_router
from app.domains.catalog.api.catalog_api import router as catalog_router
from app.domains.catalog.api.storefront_api import router as storefront_router
from app.domains.customers.api.customer_api import router as customer_router
from app.domains.logistics.api.delivery_api import router as logistics_delivery_router
from app.domains.logistics.api.driver_api import router as logistics_driver_router
from app.domains.logistics.api.driver_matching_api import router as logistics_driver_matching_router
from app.domains.logistics.api.live_tracking_api import router as live_tracking_router
from app.domains.logistics.api.routing_api import router as logistics_routing_router
from app.domains.logistics.api.tracking_api import router as logistics_tracking_router
from app.domains.notifications.api.notifications_api import router as notifications_router
from app.domains.recommendations.api.recommendations_api import router as recommendations_router
from app.domains.returns.api.returns_api import router as returns_router
from app.domains.shopping.api.admin_orders_api import router as admin_orders_router
from app.domains.shopping.api.admin_promotions_api import router as admin_promotions_router
from app.domains.shopping.api.admin_shopping_api import router as admin_shopping_router
from app.domains.shopping.api.banner_api import public_router as public_banners_router
from app.domains.shopping.api.banner_api import router as admin_banners_router
from app.domains.shopping.api.cart_api import router as cart_router
from app.domains.shopping.api.cart_share_api import router as cart_share_router
from app.domains.shopping.api.checkout_api import router as checkout_router
from app.domains.shopping.api.coupons_api import router as coupons_router
from app.domains.payments.api.mobile_money_api import router as mobile_money_router
from app.domains.payments.api.mpesa_stk_api import router as mpesa_stk_router
from app.domains.shopping.api.order_api import router as order_router
from app.domains.shopping.api.saved_cart_api import router as saved_cart_router
from app.domains.shopping.api.shipping_api import router as shipping_router
from app.domains.shopping.api.vendor_coupons_api import router as vendor_coupons_router
from app.domains.shopping.api.vendor_orders_api import router as vendor_orders_router
from app.domains.tickets.api.tickets_api import router as tickets_router
from app.domains.users.api.users_api import router as users_router
from app.domains.vendor.api.offers_api import router as vendor_offers_router
from app.domains.vendor.api.vendor_analytics_api import router as vendor_analytics_router
from app.domains.vendor.api.vendor_api import router as vendor_router
from app.domains.vendor.api.vendor_earnings_api import router as vendor_earnings_router
from app.domains.vendor.api.vendor_reviews_api import router as vendor_reviews_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start cleanup scheduler as a background task
    cleanup_task = asyncio.create_task(start_cleanup_scheduler())
    # Start outbox relay scheduler to process pending domain events
    outbox_task = asyncio.create_task(start_outbox_relay_scheduler())

    yield

    # Cancel tasks on shutdown
    for task in (cleanup_task, outbox_task):
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


tags_metadata = [
    {
        "name": "Authentication",
        "description": "Operations for user registration, login, refresh, password reset, and account deletion.",
    },
    {"name": "OTP", "description": "One-Time Password generation and verification for MFA and identity verification."},
    {"name": "Users", "description": "User profile management and user detail queries."},
    {"name": "Vendor", "description": "Vendor profiles, verification status, store settings, and admin approvals."},
    {"name": "Catalog", "description": "Product catalog listings, categories, file uploads, and pricing markups."},
    {
        "name": "Storefront",
        "description": "Public catalog API endpoints for customers browsing and purchasing devices.",
    },
]

SHOW_DOCS_ENVS = {"development", "dev", "local", "staging", "testing"}
show_docs = settings.ENVIRONMENT.lower() in SHOW_DOCS_ENVS

app = FastAPI(
    title="MyMedDevices API Portal",
    description="Backend services for MyMedDevices: medical device marketplace and portals.",
    version="1.0.0",
    lifespan=lifespan,
    openapi_tags=tags_metadata,
    docs_url="/docs" if show_docs else None,
    redoc_url="/redoc" if show_docs else None,
    openapi_url="/openapi.json" if show_docs else None,
)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import AuthorizationError, BusinessRuleError, ConflictError, DomainError, NotFoundError


@app.exception_handler(NotFoundError)
async def not_found_exception_handler(request, exc: NotFoundError):
    logger.info(f"NotFound: {exc.message}")
    return JSONResponse(status_code=404, content={"success": False, "detail": exc.message, "code": exc.code})


@app.exception_handler(BusinessRuleError)
async def business_rule_exception_handler(request, exc: BusinessRuleError):
    logger.warning(f"BusinessRuleViolation: {exc.message}")
    return JSONResponse(status_code=400, content={"success": False, "detail": exc.message, "code": exc.code})


@app.exception_handler(ConflictError)
async def conflict_exception_handler(request, exc: ConflictError):
    logger.warning(f"ConflictError: {exc.message}")
    return JSONResponse(status_code=409, content={"success": False, "detail": exc.message, "code": exc.code})


@app.exception_handler(AuthorizationError)
async def authorization_exception_handler(request, exc: AuthorizationError):
    logger.warning(f"AuthorizationError: {exc.message}")
    return JSONResponse(status_code=403, content={"success": False, "detail": exc.message, "code": exc.code})


@app.exception_handler(DomainError)
async def domain_exception_handler(request, exc: DomainError):
    logger.warning(f"DomainError: {exc.message}")
    return JSONResponse(status_code=400, content={"success": False, "detail": exc.message, "code": exc.code})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        loc = " -> ".join([str(x) for x in error["loc"] if x != "body"])
        msg = error["msg"]
        errors.append(f"{loc}: {msg}")

    # Create a friendly message for common errors
    friendly_msg = "Validation error"
    if errors:
        friendly_msg = "; ".join(errors)
        # Custom transformations for known errors
        friendly_msg = friendly_msg.replace("Value error, ", "")

    from fastapi.encoders import jsonable_encoder

    logger.warning(f"Validation error: {friendly_msg}")
    return JSONResponse(
        status_code=422, content={"success": False, "detail": friendly_msg, "errors": jsonable_encoder(exc.errors())}
    )


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request, exc: IntegrityError):
    logger.error(f"Database integrity error: {exc}")
    err_msg = str(exc.orig) if exc.orig else str(exc)
    if "unique constraint" in err_msg.lower() or "duplicate key" in err_msg.lower():
        if "users_email_key" in err_msg or "users.email" in err_msg:
            return JSONResponse(
                status_code=409, content={"success": False, "detail": "A user with this email already exists"}
            )
        return JSONResponse(
            status_code=409,
            content={"success": False, "detail": "Resource already exists due to unique constraint violation"},
        )
    return JSONResponse(
        status_code=400, content={"success": False, "detail": "Database integrity constraint violation"}
    )


# Add Custom CORS Middleware (supports wildcard patterns for local networks)
add_cors_middleware(app)

# Add security headers middleware (runs before logging, so headers are logged)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(APIProtectionMiddleware)
app.add_middleware(NoCacheMiddleware)

# Add logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Add size limit middleware (registered after logging so it runs before it in ASGI execution)
app.add_middleware(ContentLengthLimitMiddleware, max_content_length=settings.MAX_CONTENT_LENGTH)

# Include Routers
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(otp_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(customer_router, prefix="/api/v1/customers")
app.include_router(vendor_router, prefix="/api/v1")
app.include_router(vendor_analytics_router, prefix="/api/v1")
app.include_router(vendor_earnings_router, prefix="/api/v1")
app.include_router(vendor_reviews_router, prefix="/api/v1")
app.include_router(vendor_offers_router, prefix="/api/v1")
app.include_router(catalog_router, prefix="/api/v1/catalog")
app.include_router(storefront_router, prefix="/api/v1/storefront")
app.include_router(cart_router, prefix="/api/v1/shopping")
app.include_router(cart_share_router, prefix="/api/v1/shopping")
app.include_router(coupons_router, prefix="/api/v1/shopping")
app.include_router(vendor_coupons_router, prefix="/api/v1/shopping")
app.include_router(saved_cart_router, prefix="/api/v1/shopping")
app.include_router(checkout_router, prefix="/api/v1/shopping")
app.include_router(order_router, prefix="/api/v1/shopping")
app.include_router(shipping_router, prefix="/api/v1/shopping")
app.include_router(admin_shopping_router, prefix="/api/v1")
app.include_router(recommendations_router, prefix="/api/v1/recommendations")
app.include_router(tickets_router, prefix="/api/v1")
app.include_router(returns_router, prefix="/api/v1")
app.include_router(admin_orders_router, prefix="/api/v1")
app.include_router(vendor_orders_router, prefix="/api/v1")
# Payments Domain Routers
app.include_router(mpesa_stk_router, prefix="/api/v1/payments/mpesa")
app.include_router(mobile_money_router, prefix="/api/v1/admin/payments/mobile-money")
app.include_router(admin_banners_router, prefix="/api/v1")
app.include_router(public_banners_router, prefix="/api/v1/shopping")
app.include_router(admin_promotions_router, prefix="/api/v1")
app.include_router(admin_analytics_router, prefix="/api/v1")
app.include_router(admin_bundles_router, prefix="/api/v1/admin")
app.include_router(marketing_campaigns_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1/admin")
app.include_router(users_management_router, prefix="/api/v1/admin")
app.include_router(admin_reviews_router, prefix="/api/v1")
app.include_router(logistics_routing_router, prefix="/api/v1")
app.include_router(logistics_delivery_router, prefix="/api/v1/logistics")
app.include_router(logistics_driver_router, prefix="/api/v1/logistics")
app.include_router(logistics_driver_matching_router, prefix="/api/v1")
app.include_router(logistics_tracking_router, prefix="/api/v1/logistics")
app.include_router(live_tracking_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1/notifications")

# Serve uploaded static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.AVATAR_UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.DELIVERY_PROOF_UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    logger.info("Hello World from root!")
    return {"message": "Welcome to MyMedDevices API"}


@app.api_route("/health", methods=["GET", "HEAD"])
@app.api_route("/api/v1/health", methods=["GET", "HEAD"])
@app.api_route("/api/v1/healthcheck", methods=["GET", "HEAD"])
async def health_check(db: AsyncSession = Depends(get_db)):
    health_status = {"status": "healthy", "timestamp": datetime.now(UTC).isoformat()}

    # Check database connectivity
    try:
        from sqlalchemy import text

        await db.execute(text("SELECT 1"))
        health_status["database"] = "up"
    except Exception as e:
        health_status["database"] = "down"
        health_status["status"] = "unhealthy"
        health_status["database_error"] = str(e)

    # Check Redis connectivity
    from app.core.rate_limiting import rate_limiter

    if rate_limiter.redis_client:
        try:
            await rate_limiter.redis_client.ping()
            health_status["redis"] = "up"
        except Exception as e:
            health_status["redis"] = "down"
            health_status["status"] = "unhealthy"
            health_status["redis_error"] = str(e)
    else:
        health_status["redis"] = "disabled"

    return health_status


@app.post("/debug/reset-rate-limits")
async def reset_rate_limits():
    """
    Reset all rate limits. Development-only endpoint.

    This endpoint:
    - Clears in-memory rate limit storage
    - Clears Redis rate limit keys if Redis is configured
    - Only works in development/staging environments
    - DISABLED in production

    Returns: Summary of what was cleared
    """
    from app.core.rate_limiting import rate_limiter

    # SECURITY: Disable debug endpoints in production (case-insensitive check)
    if settings.ENVIRONMENT.lower() == "production":
        return JSONResponse(status_code=403, content={"error": "Rate limit reset is not allowed in production"})

    result: dict[str, Any] = {"cleared": {}}

    # Clear in-memory storage
    if rate_limiter._requests:
        count = len(rate_limiter._requests)
        rate_limiter.clear()
        result["cleared"]["in_memory"] = count

    # Clear Redis keys if configured
    if rate_limiter.redis_client:
        try:
            # Find all rate limit keys
            keys = []
            async for key in rate_limiter.redis_client.scan_iter(match="rate_limit:*"):
                keys.append(key)

            if keys:
                await rate_limiter.redis_client.delete(*keys)
                result["cleared"]["redis"] = len(keys)
        except Exception as e:
            result["redis_error"] = str(e)
            logger.warning(f"Failed to clear Redis rate limits: {e}")

    logger.info(f"Rate limits reset: {result}")
    return result
