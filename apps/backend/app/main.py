from contextlib import asynccontextmanager
import asyncio
from datetime import datetime, timezone
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.logging import logger
from app.core.middleware import RequestLoggingMiddleware, ContentLengthLimitMiddleware
from app.core.config import settings
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.auth.api.auth_api import router as auth_router
from app.domains.auth.api.otp_api import router as otp_router
from app.domains.users.api.users_api import router as users_router
from app.domains.vendor.api.vendor_api import router as vendor_router
from app.domains.catalog.api.catalog_api import router as catalog_router
from app.domains.catalog.api.storefront_api import router as storefront_router
from app.domains.admin.api.system_api import router as system_router
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

# Add logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Add size limit middleware (registered after logging so it runs before it in ASGI execution)
app.add_middleware(ContentLengthLimitMiddleware, max_content_length=settings.MAX_CONTENT_LENGTH)

# Include Routers
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(otp_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(vendor_router, prefix="/api/v1")
app.include_router(catalog_router, prefix="/api/v1/catalog")
app.include_router(storefront_router, prefix="/api/v1/storefront")
app.include_router(system_router, prefix="/api/v1")

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
