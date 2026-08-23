from app.domains.customers.models.customer_profile import CustomerProfile  # noqa: F401
from app.domains.logistics.models.driver_profile import DriverProfile  # noqa: F401

# Import VendorProfile to ensure User.vendor_profile relationship can be resolved
# This must be imported after User to avoid circular dependency
from app.domains.vendor.models.vendor_profile import VendorProfile  # noqa: F401

from .otp import OTP
from .token_device import RefreshToken, UserDevice
from .user import User

__all__ = ["OTP", "RefreshToken", "UserDevice", "User", "CustomerProfile", "VendorProfile", "DriverProfile"]
