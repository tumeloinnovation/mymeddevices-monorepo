from .user import User
from .token_device import RefreshToken, UserDevice
from .otp import OTP

# Import VendorProfile to ensure User.vendor_profile relationship can be resolved
# This must be imported after User to avoid circular dependency
from app.domains.vendor.models.vendor_profile import VendorProfile  # noqa: F401
from app.domains.customers.models.customer_profile import CustomerProfile  # noqa: F401
