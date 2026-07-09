from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import require_role
from app.core.database import get_db
from app.core.responses import success_response
from app.core.security import settings
from app.domains.admin.services import SystemSettingService

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/status", dependencies=[Depends(require_role("admin"))])
async def get_system_status():
    """
    Get status of System infrastructure (SMS, SMTP).
    """
    return success_response({
        "sms": {
            "sender_id": settings.HOSTPINNACLE_SENDER_ID,
            "enabled": bool(settings.HOSTPINNACLE_API_KEY),
        },
        "smtp": {
            "host": settings.SMTP_HOST,
            "port": settings.SMTP_PORT,
            "enabled": bool(settings.SMTP_USERNAME and settings.SMTP_PASSWORD) or (settings.SMTP_HOST == "localhost" and settings.SMTP_PORT == 1025),
        }
    })

@router.get("/rate-limits", dependencies=[Depends(require_role("admin"))])
async def get_rate_limits(db: AsyncSession = Depends(get_db)):
    """
    Get current rate limits.
    """
    from app.core.rate_limiting import rate_limiter
    
    # Try to get from DB first
    limits = await SystemSettingService.get_setting(db, "rate_limits")
    if not limits:
        # Fallback to hardcoded defaults in the rate limiter
        limits = rate_limiter._limits
        
    return success_response(limits)

@router.put("/rate-limits", dependencies=[Depends(require_role("admin"))])
async def update_rate_limits(limits: dict, db: AsyncSession = Depends(get_db)):
    """
    Update rate limits.
    Expected format: {"login": [5, 300], "register": [3, 3600], ...}
    Value is [max_requests, window_seconds]
    """
    # Validate format
    for key, value in limits.items():
        if not isinstance(value, (list, tuple)) or len(value) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid format for {key}. Expected [max_requests, window_seconds]"
            )
        if not all(isinstance(v, int) for v in value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Values for {key} must be integers"
            )

    await SystemSettingService.set_setting(
        db, 
        "rate_limits", 
        limits, 
        "API Rate limits configuration: {endpoint: [max_requests, window_seconds]}"
    )
    
    # Optionally trigger a refresh in the rate limiter instance if it's already loaded
    from app.core.rate_limiting import rate_limiter
    rate_limiter._limits = {k: tuple(v) for k, v in limits.items()}
    
    return success_response(limits)


@router.get("/shipping-settings", dependencies=[Depends(require_role("admin"))])
async def get_shipping_settings(db: AsyncSession = Depends(get_db)):
    """
    Get current shipping settings.
    """
    shipping_settings = await SystemSettingService.get_setting(db, "shipping_settings")
    if not shipping_settings:
        shipping_settings = {
            "flat_fee": 200.0,
            "rate_per_km": 20.0,
            "max_radius_km": 50.0,
            "courier_fee": 450.0
        }
    return success_response(shipping_settings)


@router.put("/shipping-settings", dependencies=[Depends(require_role("admin"))])
async def update_shipping_settings(settings_in: dict, db: AsyncSession = Depends(get_db)):
    """
    Update shipping settings.
    """
    required_keys = ["flat_fee", "rate_per_km", "max_radius_km", "courier_fee"]
    for key in required_keys:
        if key not in settings_in:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required parameter: {key}"
            )
        try:
            settings_in[key] = float(settings_in[key])
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Value for {key} must be a number"
            )

    await SystemSettingService.set_setting(
        db,
        "shipping_settings",
        settings_in,
        "Shipping rates & local routing constraints: flat_fee, rate_per_km, max_radius_km, courier_fee"
    )
    return success_response(settings_in)

