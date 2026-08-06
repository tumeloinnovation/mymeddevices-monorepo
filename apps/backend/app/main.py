import os
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime, timezone
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.logging import logger
from app.core.middleware import RequestLoggingMiddleware, ContentLengthLimitMiddleware
from app.core.security_headers import SecurityHeadersMiddleware, APIProtectionMiddleware, NoCacheMiddleware
from app.core.config import settings
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.auth.api.auth_api import router as auth_router
from app.domains.auth.api.otp_api import router as otp_router
from app.domains.users.api.users_api import router as users_router
from app.domains.customers.api.customer_api import router as customer_router
from app.domains.vendor.api.vendor_api import router as vendor_router
from app.domains.vendor.api.vendor_analytics_api import router as vendor_analytics_router
from app.domains.vendor.api.vendor_earnings_api import router as vendor_earnings_router
from app.domains.vendor.api.vendor_reviews_api import router as vendor_reviews_router
from app.domains.catalog.api.catalog_api import router as catalog_router
from app.domains.catalog.api.storefront_api import router as storefront_router
from app.domains.shopping.api.cart_api import router as cart_router
from app.domains.shopping.api.cart_share_api import router as cart_share_router
from app.domains.shopping.api.coupons_api import router as coupons_router
from app.domains.shopping.api.vendor_coupons_api import router as vendor_coupons_router
from app.domains.shopping.api.saved_cart_api import router as saved_cart_router
from app.domains.shopping.api.admin_shopping_api import router as admin_shopping_router
from app.domains.shopping.api.checkout_api import router as checkout_router
from app.domains.shopping.api.order_api import router as order_router
from app.domains.shopping.api.payment_api import router as payment_router
from app.domains.shopping.api.shipping_api import router as shipping_router
from app.domains.payments.api import payments_router as mpesa_payments_router
from app.domains.payments.api.simple_payments_api import router as simple_payments_router
from app.domains.shopping.api.admin_orders_api import router as admin_orders_router
from app.domains.shopping.api.vendor_orders_api import router as vendor_orders_router
from app.domains.shopping.api.banner_api import router as admin_banners_router
from app.domains.shopping.api.banner_api import public_router as public_banners_router
from app.domains.admin.api.system_api import router as system_router
from app.domains.admin.api.users_management_api import router as users_management_router
from app.domains.admin.api.reviews_moderation_api import router as admin_reviews_router
from app.domains.recommendations.api.recommendations_api import router as recommendations_router
from app.domains.tickets.api.tickets_api import router as tickets_router
from app.domains.returns.api.returns_api import router as returns_router
from app.domains.payments.api.payment_methods_api import router as payment_methods_router
from app.core.tasks import start_cleanup_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start cleanup scheduler as a background task
    cleanup_task = asyncio.create_task(start_cleanup_scheduler())
    yield
    # Cancel task on shutdown
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

tags_metadata = [
    {"name": "Authentication", "description": "Operations for user registration, login, refresh, password reset, and account deletion."},
    {"name": "OTP", "description": "One-Time Password generation and verification for MFA and identity verification."},
    {"name": "Users", "description": "User profile management and user detail queries."},
    {"name": "Vendor", "description": "Vendor profiles, verification status, store settings, and admin approvals."},
    {"name": "Catalog", "description": "Product catalog listings, categories, file uploads, and pricing markups."},
    {"name": "Storefront", "description": "Public catalog API endpoints for customers browsing and purchasing devices."},
]

app = FastAPI(
    title="MyMedDevices API Portal",
    description="Backend services for MyMedDevices: medical device marketplace and portals.",
    version="1.0.0",
    lifespan=lifespan,
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc"
)

from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from fastapi.exceptions import RequestValidationError

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
        status_code=422,
        content={
            "success": False, 
            "detail": friendly_msg,
            "errors": jsonable_encoder(exc.errors())
        }
    )

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request, exc: IntegrityError):
    logger.error(f"Database integrity error: {exc}")
    err_msg = str(exc.orig) if exc.orig else str(exc)
    if "unique constraint" in err_msg.lower() or "duplicate key" in err_msg.lower():
        if "users_email_key" in err_msg or "users.email" in err_msg:
            return JSONResponse(
                status_code=409,
                content={"success": False, "detail": "A user with this email already exists"}
            )
        return JSONResponse(
            status_code=409,
            content={"success": False, "detail": "Resource already exists due to unique constraint violation"}
        )
    return JSONResponse(
        status_code=400,
        content={"success": False, "detail": "Database integrity constraint violation"}
    )

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.include_router(catalog_router, prefix="/api/v1/catalog")
app.include_router(storefront_router, prefix="/api/v1/storefront")
app.include_router(cart_router, prefix="/api/v1/shopping")
app.include_router(cart_share_router, prefix="/api/v1/shopping")
app.include_router(coupons_router, prefix="/api/v1/shopping")
app.include_router(vendor_coupons_router, prefix="/api/v1/shopping")
app.include_router(saved_cart_router, prefix="/api/v1/shopping")
app.include_router(checkout_router, prefix="/api/v1/shopping")
app.include_router(order_router, prefix="/api/v1/shopping")
app.include_router(payment_router, prefix="/api/v1/shopping")
app.include_router(shipping_router, prefix="/api/v1/shopping")
app.include_router(admin_shopping_router, prefix="/api/v1")
app.include_router(recommendations_router, prefix="/api/v1/recommendations")
app.include_router(tickets_router, prefix="/api/v1")
app.include_router(returns_router, prefix="/api/v1")
app.include_router(payment_methods_router, prefix="/api/v1")
app.include_router(admin_orders_router, prefix="/api/v1")
app.include_router(vendor_orders_router, prefix="/api/v1")
app.include_router(admin_banners_router, prefix="/api/v1")
app.include_router(public_banners_router, prefix="/api/v1/shopping")
app.include_router(mpesa_payments_router, prefix="/api/v1")
app.include_router(simple_payments_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1/admin")
app.include_router(users_management_router, prefix="/api/v1/admin")
app.include_router(admin_reviews_router, prefix="/api/v1")

# Serve uploaded static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.AVATAR_UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    logger.info("Hello World from root!")
    return {"message": "Welcome to MyMedDevices API"}

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

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

    Returns: Summary of what was cleared
    """
    from app.core.rate_limiting import rate_limiter

    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=403,
            content={"error": "Rate limit reset is not allowed in production"}
        )

    result = {"cleared": {}}

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
