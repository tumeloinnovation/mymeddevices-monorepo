from fastapi import APIRouter, Depends
from app.core.dependencies import require_role
from app.core.responses import success_response
from app.core.security import settings

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/status", dependencies=[Depends(require_role("admin"))])
async def get_system_status():
    """
    Get status of SMS infrastructure.
    """
    return success_response({
        "sms": {
            "sender_id": settings.HOSTPINNACLE_SENDER_ID,
            "enabled": bool(settings.HOSTPINNACLE_API_KEY),
        }
    })
