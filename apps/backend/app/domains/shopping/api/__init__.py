from app.domains.shopping.api.admin_shopping_api import router as admin_shopping_router
from app.domains.shopping.api.cart_api import router as cart_router
from app.domains.shopping.api.cart_share_api import router as cart_share_router
from app.domains.shopping.api.coupons_api import router as coupons_router
from app.domains.shopping.api.saved_cart_api import router as saved_cart_router
from app.domains.shopping.api.shipping_api import router as shipping_router
from app.domains.shopping.api.vendor_coupons_api import router as vendor_coupons_router

__all__ = [
    "cart_router",
    "cart_share_router",
    "coupons_router",
    "vendor_coupons_router",
    "saved_cart_router",
    "admin_shopping_router",
    "shipping_router",
]
