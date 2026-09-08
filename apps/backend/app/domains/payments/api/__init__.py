from app.domains.payments.api.mobile_money_api import router as mobile_money_router
from app.domains.payments.api.mpesa_stk_api import router as mpesa_stk_router

__all__ = [
    "mobile_money_router",
    "mpesa_stk_router",
]
