from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.responses import success_response
from app.domains.admin.services import SystemSettingService

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/status", dependencies=[Depends(require_role("admin"))])
async def get_system_status():
    """
    Get status of System infrastructure (SMS, SMTP).
    """
    return success_response(
        {
            "sms": {
                "sender_id": settings.HOSTPINNACLE_SENDER_ID,
                "enabled": bool(settings.HOSTPINNACLE_API_KEY),
            },
            "smtp": {
                "host": settings.SMTP_HOST,
                "port": settings.SMTP_PORT,
                "enabled": bool(settings.SMTP_USERNAME and settings.SMTP_PASSWORD)
                or (settings.SMTP_HOST == "localhost" and settings.SMTP_PORT == 1025),
            },
        }
    )


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
                detail=f"Invalid format for {key}. Expected [max_requests, window_seconds]",
            )
        if not all(isinstance(v, int) for v in value):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Values for {key} must be integers")

    await SystemSettingService.set_setting(
        db, "rate_limits", limits, "API Rate limits configuration: {endpoint: [max_requests, window_seconds]}"
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
        shipping_settings = {"flat_fee": 200.0, "rate_per_km": 20.0, "max_radius_km": 50.0, "courier_fee": 450.0}
    return success_response(shipping_settings)


@router.put("/shipping-settings", dependencies=[Depends(require_role("admin"))])
async def update_shipping_settings(settings_in: dict, db: AsyncSession = Depends(get_db)):
    """
    Update shipping settings.
    """
    required_keys = ["flat_fee", "rate_per_km", "max_radius_km", "courier_fee"]
    for key in required_keys:
        if key not in settings_in:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Missing required parameter: {key}")
        try:
            settings_in[key] = float(settings_in[key])
        except (ValueError, TypeError):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Value for {key} must be a number")

    await SystemSettingService.set_setting(
        db,
        "shipping_settings",
        settings_in,
        "Shipping rates & local routing constraints: flat_fee, rate_per_km, max_radius_km, courier_fee",
    )
    return success_response(settings_in)


@router.get("/auth-settings", dependencies=[Depends(require_role("admin"))])
async def get_auth_settings(db: AsyncSession = Depends(get_db)):
    """
    Get current security and token expiration settings.
    """
    auth_settings = await SystemSettingService.get_setting(db, "auth_settings")
    if not auth_settings:
        auth_settings = {
            "refresh_token_expire_days": settings.REFRESH_TOKEN_EXPIRE_DAYS,
            "access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "auto_reload_on_expiry_trigger": False,
        }
    return success_response(auth_settings)


@router.put("/auth-settings", dependencies=[Depends(require_role("admin"))])
async def update_auth_settings(settings_in: dict, db: AsyncSession = Depends(get_db)):
    """
    Update authentication & token expiration settings.
    Expected format: {"refresh_token_expire_days": 30, "access_token_expire_minutes": 30, "auto_reload_on_expiry_trigger": false}
    """
    if "refresh_token_expire_days" in settings_in:
        try:
            settings_in["refresh_token_expire_days"] = int(settings_in["refresh_token_expire_days"])
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="refresh_token_expire_days must be an integer"
            )

    await SystemSettingService.set_setting(
        db,
        "auth_settings",
        settings_in,
        "Authentication & Security Settings: refresh_token_expire_days, access_token_expire_minutes, auto_reload_on_expiry_trigger",
    )
    return success_response(settings_in)


@router.get("/general-settings", dependencies=[Depends(require_role("admin"))])
async def get_general_settings(db: AsyncSession = Depends(get_db)):
    """
    Get general platform configuration settings.
    """
    general_settings = await SystemSettingService.get_setting(db, "general_settings")
    if not general_settings:
        general_settings = {
            "site_name": "MyMedDevices",
            "site_tagline": "Certified Medical Equipment Marketplace in Kenya",
            "support_email": "support@mymeddevices.co.ke",
            "support_phone": "+254700000000",
            "currency": "KES",
            "currency_symbol": "KSh",
            "timezone": "Africa/Nairobi",
            "maintenance_mode": False,
            "allow_guest_checkout": True,
            "order_prefix": "MMD-",
            "vat_percentage": 16.0,
            "address": "Nairobi, Kenya",
        }
    return success_response(general_settings)


@router.put("/general-settings", dependencies=[Depends(require_role("admin"))])
async def update_general_settings(settings_in: dict, db: AsyncSession = Depends(get_db)):
    """
    Update general platform configuration settings.
    """
    await SystemSettingService.set_setting(
        db,
        "general_settings",
        settings_in,
        "General platform settings: site_name, support_email, support_phone, currency, timezone, maintenance_mode, etc.",
    )
    return success_response(settings_in)


@router.get("/platform-fees", dependencies=[Depends(require_role("admin"))])
async def get_platform_fees(db: AsyncSession = Depends(get_db)):
    """
    Get vendor platform commissions, tax rates, and transaction fee parameters.
    """
    platform_fees = await SystemSettingService.get_setting(db, "platform_fees")
    if not platform_fees:
        platform_fees = {
            "base_commission_percent": 10.0,
            "flat_transaction_fee": 50.0,
            "category_overrides": {},
            "tax_vat_percent": 16.0,
            "minimum_payout_amount": 1000.0,
            "payout_schedule": "weekly",
            "withdrawal_fee": 50.0,
        }
    return success_response(platform_fees)


@router.put("/platform-fees", dependencies=[Depends(require_role("admin"))])
async def update_platform_fees(settings_in: dict, db: AsyncSession = Depends(get_db)):
    """
    Update vendor platform commissions, tax rates, and transaction fee parameters.
    """
    await SystemSettingService.set_setting(
        db,
        "platform_fees",
        settings_in,
        "Platform fee structure: base_commission_percent, flat_transaction_fee, tax_vat_percent, minimum_payout_amount, etc.",
    )
    return success_response(settings_in)


# ============================================================================
# Permissions & Role Capabilities Matrix
# ============================================================================

DEFAULT_PERMISSION_CATEGORIES = [
    {
        "id": "users",
        "name": "User & Staff Administration",
        "description": "Permissions for managing staff credentials, user accounts, and administrative access",
        "icon": "Users",
        "permissions": [
            {
                "key": "users:view",
                "label": "View User Directory",
                "description": "Browse and search customer, staff, and vendor user accounts",
                "risk": "low",
            },
            {
                "key": "users:create",
                "label": "Create & Invite Users",
                "description": "Add new staff accounts and dispatch invitation credentials",
                "risk": "medium",
            },
            {
                "key": "users:edit",
                "label": "Edit User Profiles",
                "description": "Modify account information, department affiliations, and contact details",
                "risk": "medium",
            },
            {
                "key": "users:delete",
                "label": "Deactivate & Remove Users",
                "description": "Suspend, deactivate, or delete user and staff accounts",
                "risk": "high",
            },
            {
                "key": "roles:manage",
                "label": "Role & Policy Management",
                "description": "Configure permissions matrix and assign custom role capabilities",
                "risk": "critical",
            },
            {
                "key": "audit:view",
                "label": "View Security Audit Logs",
                "description": "Inspect administrative actions, session history, and security event logs",
                "risk": "medium",
            },
        ],
    },
    {
        "id": "catalog",
        "name": "Medical Catalog & Compliance",
        "description": "Permissions for medical device listings, inventory, and regulatory certifications",
        "icon": "Stethoscope",
        "permissions": [
            {
                "key": "catalog:view",
                "label": "Browse Medical Catalog",
                "description": "Inspect medical devices, classifications, and vendor listings",
                "risk": "low",
            },
            {
                "key": "catalog:create_edit",
                "label": "Create & Edit Listings",
                "description": "Add new medical devices and modify product specifications",
                "risk": "medium",
            },
            {
                "key": "catalog:kmpdb_verify",
                "label": "KMPDB Regulatory Verification",
                "description": "Verify Kenya Medical Practitioners & Dentists Council compliance",
                "risk": "high",
            },
            {
                "key": "catalog:ppb_classify",
                "label": "PPB Classification Audit",
                "description": "Approve Pharmacy and Poisons Board regulatory device categories",
                "risk": "high",
            },
            {
                "key": "catalog:ce_fda_approve",
                "label": "CE / FDA Medical Clearance",
                "description": "Verify international medical conformity and clearance documentation",
                "risk": "high",
            },
            {
                "key": "catalog:pricing_manage",
                "label": "Price & Markup Management",
                "description": "Configure product pricing, commission markups, and currency tiers",
                "risk": "high",
            },
            {
                "key": "catalog:delete",
                "label": "Archive / Delete Devices",
                "description": "Remove or archive discontinued medical products and listings",
                "risk": "high",
            },
        ],
    },
    {
        "id": "orders",
        "name": "Orders & Fulfillment",
        "description": "Permissions for processing healthcare purchases, shipping, and dispatch",
        "icon": "ShoppingCart",
        "permissions": [
            {
                "key": "orders:view",
                "label": "View Orders & Shipments",
                "description": "Review healthcare facility purchase orders and fulfillment status",
                "risk": "low",
            },
            {
                "key": "orders:process",
                "label": "Process & Confirm Orders",
                "description": "Approve order packaging and inventory allocation",
                "risk": "medium",
            },
            {
                "key": "orders:dispatch",
                "label": "Dispatch & Logistics Tracking",
                "description": "Assign delivery drivers and courier tracking waybills",
                "risk": "medium",
            },
            {
                "key": "orders:cancel_refund",
                "label": "Cancel Orders & Authorize Refunds",
                "description": "Cancel unfulfilled purchases and initiate customer refunds",
                "risk": "high",
            },
            {
                "key": "orders:invoices",
                "label": "Invoicing & Delivery Notes",
                "description": "Generate official tax receipts and hospital delivery manifests",
                "risk": "low",
            },
        ],
    },
    {
        "id": "finance",
        "name": "Financials & Settlements",
        "description": "Permissions for ledger auditing, M-Pesa reconciliations, and vendor disbursements",
        "icon": "CreditCard",
        "permissions": [
            {
                "key": "finance:view_ledger",
                "label": "View Financial Ledgers",
                "description": "Access platform gross revenue, vendor balances, and payout history",
                "risk": "medium",
            },
            {
                "key": "finance:mpesa_reconcile",
                "label": "M-Pesa STK Reconciliation",
                "description": "Audit Daraja payment callbacks and manual transaction matches",
                "risk": "high",
            },
            {
                "key": "finance:vendor_payouts",
                "label": "Authorize Vendor Payouts",
                "description": "Execute bank transfers and M-Pesa B2C vendor disbursements",
                "risk": "critical",
            },
            {
                "key": "finance:tax_vat_reports",
                "label": "Tax & VAT Reports (KRA)",
                "description": "Generate statutory tax withholding and 16% VAT declarations",
                "risk": "medium",
            },
            {
                "key": "finance:commissions_manage",
                "label": "Fee & Commission Settings",
                "description": "Adjust platform commission rates and payment gateway fees",
                "risk": "critical",
            },
        ],
    },
    {
        "id": "vendors",
        "name": "Vendor & Partner Moderation",
        "description": "Permissions for evaluating supplier credentials and managing vendor partnerships",
        "icon": "Store",
        "permissions": [
            {
                "key": "vendors:view",
                "label": "View Vendor Profiles",
                "description": "Inspect registered medical suppliers, licenses, and performance",
                "risk": "low",
            },
            {
                "key": "vendors:approve_kyc",
                "label": "Approve Vendor Licenses",
                "description": "Validate premise licenses and approve vendor marketplace onboarding",
                "risk": "high",
            },
            {
                "key": "vendors:suspend",
                "label": "Suspend Vendor Stores",
                "description": "Disable vendor selling privileges for policy violations",
                "risk": "high",
            },
            {
                "key": "vendors:payout_settings",
                "label": "Manage Vendor Payout Setup",
                "description": "Configure payout schedules, withdrawal limits, and bank accounts",
                "risk": "high",
            },
        ],
    },
    {
        "id": "support",
        "name": "Customer Support & Disputes",
        "description": "Permissions for handling client inquiries, tickets, and warranty returns",
        "icon": "Headphones",
        "permissions": [
            {
                "key": "tickets:view",
                "label": "View Support Tickets",
                "description": "Read helpdesk inquiries from healthcare clinics and customers",
                "risk": "low",
            },
            {
                "key": "tickets:respond",
                "label": "Respond to Support Threads",
                "description": "Post replies and resolve customer inquiries",
                "risk": "low",
            },
            {
                "key": "tickets:resolve",
                "label": "Resolve & Close Tickets",
                "description": "Mark customer support cases as resolved or escalate",
                "risk": "medium",
            },
            {
                "key": "returns:process",
                "label": "Process Device Returns & RMAs",
                "description": "Authorize equipment inspection and replacement shipments",
                "risk": "medium",
            },
        ],
    },
    {
        "id": "marketing",
        "name": "Marketing & Promotions",
        "description": "Permissions for promotional campaigns, coupon codes, and SMS broadcasts",
        "icon": "Megaphone",
        "permissions": [
            {
                "key": "marketing:view",
                "label": "View Marketing Metrics",
                "description": "Access campaign analytics and coupon redemption rates",
                "risk": "low",
            },
            {
                "key": "marketing:coupons",
                "label": "Manage Promo Coupons",
                "description": "Create discount codes, minimum order rules, and validity dates",
                "risk": "medium",
            },
            {
                "key": "marketing:campaigns",
                "label": "Send Broadcast Campaigns",
                "description": "Draft and dispatch bulk SMS and email notifications",
                "risk": "high",
            },
            {
                "key": "marketing:flash_sales",
                "label": "Configure Flash Deals",
                "description": "Schedule time-limited promotions on medical equipment",
                "risk": "medium",
            },
        ],
    },
    {
        "id": "system",
        "name": "System Security & Configuration",
        "description": "Permissions for infrastructure health, rate limiting, and core settings",
        "icon": "ShieldAlert",
        "permissions": [
            {
                "key": "system:view_settings",
                "label": "View System Configuration",
                "description": "Inspect platform configurations, mail health, and API integrations",
                "risk": "low",
            },
            {
                "key": "system:edit_settings",
                "label": "Modify Platform Settings",
                "description": "Update marketplace parameters, contact info, and operational limits",
                "risk": "critical",
            },
            {
                "key": "system:rate_limits",
                "label": "Configure Rate Limiting",
                "description": "Adjust API throttling limits and security thresholds",
                "risk": "high",
            },
            {
                "key": "system:maintenance_toggle",
                "label": "Toggle Maintenance Mode",
                "description": "Temporarily pause marketplace operations for scheduled maintenance",
                "risk": "critical",
            },
        ],
    },
]

DEFAULT_ROLES = [
    {
        "key": "admin",
        "label": "Administrator",
        "description": "Full platform administrative control, user moderation & security settings",
        "badge_color": "purple",
        "is_system": True,
    },
    {
        "key": "worker",
        "label": "Operations Worker",
        "description": "Day-to-day operations, order processing & catalog maintenance",
        "badge_color": "blue",
        "is_system": True,
    },
    {
        "key": "finance",
        "label": "Finance & Billing",
        "description": "Payout disbursements, ledger auditing, M-Pesa & VAT reconciliations",
        "badge_color": "emerald",
        "is_system": True,
    },
    {
        "key": "compliance",
        "label": "Compliance & Quality",
        "description": "PPB / KMPDB regulatory clearance and vendor premise verification",
        "badge_color": "teal",
        "is_system": True,
    },
    {
        "key": "support",
        "label": "Customer Support",
        "description": "Helpdesk inquiries, clinic disputes, and return RMA processing",
        "badge_color": "cyan",
        "is_system": True,
    },
    {
        "key": "logistics",
        "label": "Logistics & Dispatch",
        "description": "Warehouse stock dispatch, parcel packaging and carrier routing",
        "badge_color": "orange",
        "is_system": True,
    },
    {
        "key": "driver",
        "label": "Delivery Driver",
        "description": "Mobile app deliveries, route drop-offs and proof-of-delivery notes",
        "badge_color": "amber",
        "is_system": True,
    },
    {
        "key": "vendor",
        "label": "Vendor Partner",
        "description": "B2B seller portal access, product listing and inventory updates",
        "badge_color": "emerald",
        "is_system": True,
    },
    {
        "key": "customer",
        "label": "Procurement Client",
        "description": "Healthcare clinic and individual medical device buyer account",
        "badge_color": "sky",
        "is_system": True,
    },
    {
        "key": "viewer",
        "label": "Auditor / Viewer",
        "description": "Read-only access for compliance audits and performance review",
        "badge_color": "zinc",
        "is_system": True,
    },
]

DEFAULT_ROLE_MATRIX: dict[str, list[str]] = {
    "admin": [
        "users:view", "users:create", "users:edit", "users:delete", "roles:manage", "audit:view",
        "catalog:view", "catalog:create_edit", "catalog:kmpdb_verify", "catalog:ppb_classify", "catalog:ce_fda_approve", "catalog:pricing_manage", "catalog:delete",
        "orders:view", "orders:process", "orders:dispatch", "orders:cancel_refund", "orders:invoices",
        "finance:view_ledger", "finance:mpesa_reconcile", "finance:vendor_payouts", "finance:tax_vat_reports", "finance:commissions_manage",
        "vendors:view", "vendors:approve_kyc", "vendors:suspend", "vendors:payout_settings",
        "tickets:view", "tickets:respond", "tickets:resolve", "returns:process",
        "marketing:view", "marketing:coupons", "marketing:campaigns", "marketing:flash_sales",
        "system:view_settings", "system:edit_settings", "system:rate_limits", "system:maintenance_toggle",
    ],
    "worker": [
        "users:view",
        "catalog:view", "catalog:create_edit",
        "orders:view", "orders:process", "orders:dispatch", "orders:invoices",
        "tickets:view", "tickets:respond",
        "marketing:view",
    ],
    "finance": [
        "orders:view", "orders:invoices",
        "finance:view_ledger", "finance:mpesa_reconcile", "finance:vendor_payouts", "finance:tax_vat_reports", "finance:commissions_manage",
        "vendors:view",
    ],
    "compliance": [
        "catalog:view", "catalog:kmpdb_verify", "catalog:ppb_classify", "catalog:ce_fda_approve",
        "vendors:view", "vendors:approve_kyc",
        "audit:view",
    ],
    "support": [
        "users:view",
        "catalog:view",
        "orders:view",
        "tickets:view", "tickets:respond", "tickets:resolve",
        "returns:process",
    ],
    "logistics": [
        "catalog:view",
        "orders:view", "orders:process", "orders:dispatch", "orders:invoices",
    ],
    "driver": [
        "orders:view", "orders:dispatch",
    ],
    "vendor": [
        "catalog:view", "catalog:create_edit",
        "orders:view", "orders:process",
        "tickets:view", "tickets:respond",
    ],
    "customer": [
        "catalog:view", "orders:view", "tickets:view",
    ],
    "viewer": [
        "users:view",
        "catalog:view",
        "orders:view",
        "finance:view_ledger",
        "vendors:view",
        "audit:view",
    ],
}


@router.get("/permissions", dependencies=[Depends(require_role("admin"))])
async def get_permissions_matrix(db: AsyncSession = Depends(get_db)):
    """
    Get full system permissions matrix, categories, and role capability configurations.
    """
    saved_matrix = await SystemSettingService.get_setting(db, "role_permissions")
    saved_roles = await SystemSettingService.get_setting(db, "custom_roles")

    effective_matrix = dict(DEFAULT_ROLE_MATRIX)
    if saved_matrix and isinstance(saved_matrix, dict):
        effective_matrix.update(saved_matrix)

    effective_roles = list(DEFAULT_ROLES)
    if saved_roles and isinstance(saved_roles, list):
        existing_keys = {r["key"] for r in effective_roles}
        for cr in saved_roles:
            if cr.get("key") not in existing_keys:
                effective_roles.append(cr)

    return success_response(
        {
            "categories": DEFAULT_PERMISSION_CATEGORIES,
            "roles": effective_roles,
            "matrix": effective_matrix,
            "is_customized": bool(saved_matrix or saved_roles),
        }
    )


@router.put("/permissions", dependencies=[Depends(require_role("admin"))])
async def update_permissions_matrix(payload: dict, db: AsyncSession = Depends(get_db)):
    """
    Update role permissions matrix and custom role definitions.
    """
    matrix = payload.get("matrix", {})
    custom_roles = payload.get("custom_roles", [])

    if not isinstance(matrix, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Matrix must be a dictionary")

    # Clean and validate permissions matrix
    cleaned_matrix: dict[str, list[str]] = {}
    for role_key, perms in matrix.items():
        if isinstance(perms, list):
            cleaned_matrix[role_key] = [str(p) for p in perms]

    await SystemSettingService.set_setting(
        db,
        "role_permissions",
        cleaned_matrix,
        "Role permissions matrix mapping role keys to granted permission strings",
    )

    if isinstance(custom_roles, list):
        await SystemSettingService.set_setting(
            db,
            "custom_roles",
            custom_roles,
            "Custom administrative role definitions",
        )

    return success_response(
        {
            "message": "Role capabilities matrix saved successfully",
            "matrix": cleaned_matrix,
            "custom_roles": custom_roles,
        }
    )


@router.post("/permissions/reset", dependencies=[Depends(require_role("admin"))])
async def reset_permissions_matrix(db: AsyncSession = Depends(get_db)):
    """
    Reset permissions matrix back to default system configuration.
    """
    await SystemSettingService.set_setting(
        db,
        "role_permissions",
        DEFAULT_ROLE_MATRIX,
        "Default system role permissions matrix",
    )
    await SystemSettingService.set_setting(
        db,
        "custom_roles",
        [],
        "Custom administrative role definitions",
    )

    return success_response(
        {
            "message": "Permissions matrix reset to default system values",
            "categories": DEFAULT_PERMISSION_CATEGORIES,
            "roles": DEFAULT_ROLES,
            "matrix": DEFAULT_ROLE_MATRIX,
            "is_customized": False,
        }
    )


