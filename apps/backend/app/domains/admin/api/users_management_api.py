import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.logging import logger
from app.core.responses import success_response
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile

router = APIRouter(prefix="/users", tags=["Admin - User Management"])


# ============================================================================
# Schemas
# ============================================================================


class UserStatsResponse(BaseModel):
    """User statistics overview"""

    total_customers: int
    active_customers: int
    total_vendors: int
    active_vendors: int
    pending_vendors: int
    total_staff: int
    active_staff: int
    new_this_month: int
    active_today: int


class CustomerListItem(BaseModel):
    """Customer list item"""

    id: str
    name: str
    email: str
    phone: str | None
    location: str | None
    status: str
    total_orders: int = 0
    total_spent: float = 0
    last_order_date: str | None
    joined_date: str


class CustomerListResponse(BaseModel):
    """Paginated customer list response"""

    customers: list[CustomerListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class StaffListItem(BaseModel):
    """Staff list item"""

    id: str
    name: str
    email: str
    role: str
    status: str
    department: str | None
    last_login: str | None
    joined_date: str
    permissions_count: int


class StaffListResponse(BaseModel):
    """Paginated staff list response"""

    staff: list[StaffListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class VendorListItem(BaseModel):
    """Vendor list item for admin"""

    id: str
    name: str
    email: str
    phone: str | None
    company_name: str | None
    store_name: str | None
    status: str
    is_verified: bool
    joined_date: str
    approval_date: str | None


class VendorListResponse(BaseModel):
    """Paginated vendor list response"""

    vendors: list[VendorListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminCustomerCreate(BaseModel):
    """Admin customer creation schema"""

    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: str
    first_name: str = Field(..., min_length=1, alias="firstName")
    last_name: str = Field(..., min_length=1, alias="lastName")
    loyalty_points: int | None = 0
    notes: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class UserPasswordUpdateRequest(BaseModel):
    """Admin user password update schema"""

    password: str = Field(..., min_length=8, description="New password for the user")
    force_change: bool = Field(
        default=True, description="Whether user must change password on next login"
    )
    notify_user: bool = Field(
        default=True, description="Whether to send email notification to user"
    )


# ============================================================================
# Stats Endpoints
# ============================================================================


@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))], db: AsyncSession = Depends(get_db)
):
    """Get user statistics across all roles"""

    # Get all counts
    total_customers_result = await db.execute(select(func.count(User.id)).where(User.role == "customer"))
    total_customers = total_customers_result.scalar() or 0

    active_customers_result = await db.execute(
        select(func.count(User.id)).where(and_(User.role == "customer", User.is_active == True))
    )
    active_customers = active_customers_result.scalar() or 0

    total_vendors_result = await db.execute(select(func.count(User.id)).where(User.role == "vendor"))
    total_vendors = total_vendors_result.scalar() or 0

    # Get vendor profile statuses
    active_vendors_result = await db.execute(
        select(func.count(VendorProfile.id)).where(VendorProfile.approval_status == "approved")
    )
    active_vendors = active_vendors_result.scalar() or 0

    pending_vendors_result = await db.execute(
        select(func.count(VendorProfile.id)).where(VendorProfile.approval_status == "pending")
    )
    pending_vendors = pending_vendors_result.scalar() or 0

    total_staff_result = await db.execute(
        select(func.count(User.id)).where(or_(User.role == "admin", User.role == "worker"))
    )
    total_staff = total_staff_result.scalar() or 0

    active_staff_result = await db.execute(
        select(func.count(User.id)).where(
            and_(or_(User.role == "admin", User.role == "worker"), User.is_active == True)
        )
    )
    active_staff = active_staff_result.scalar() or 0

    # New this month
    one_month_ago = datetime.now(UTC) - timedelta(days=30)
    new_this_month_result = await db.execute(select(func.count(User.id)).where(User.created_at >= one_month_ago))
    new_this_month = new_this_month_result.scalar() or 0

    # Active today (simplified - users who were created today or updated today)
    today = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    active_today_result = await db.execute(
        select(func.count(User.id)).where(or_(User.created_at >= today, User.updated_at >= today))
    )
    active_today = active_today_result.scalar() or 0

    return UserStatsResponse(
        total_customers=total_customers,
        active_customers=active_customers,
        total_vendors=total_vendors,
        active_vendors=active_vendors,
        pending_vendors=pending_vendors,
        total_staff=total_staff,
        active_staff=active_staff,
        new_this_month=new_this_month,
        active_today=active_today,
    )


# ============================================================================
# Customer Management Endpoints
# ============================================================================


@router.get("/customers", response_model=CustomerListResponse)
async def list_customers(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    search: str | None = Query(None, description="Search by name, email, phone"),
    status_filter: str | None = Query(None, description="Filter by status: active, inactive, suspended"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List customers with pagination and filtering"""

    # Build query
    query = select(User).where(User.role == "customer")

    # Apply status filter
    if status_filter == "active":
        query = query.where(User.is_active == True)
    elif status_filter == "inactive":
        query = query.where(User.is_active == False)
    elif status_filter == "suspended":
        # For now, suspended is same as inactive
        query = query.where(User.is_active == False)

    # Apply search
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                User.email.ilike(search_pattern),
                User.first_name.ilike(search_pattern),
                User.last_name.ilike(search_pattern),
                User.phone.ilike(search_pattern),
            )
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and ordering
    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    # Execute
    result = await db.execute(query)
    users = result.scalars().all()

    # Fetch order stats for these users
    user_ids = [user.id for user in users]
    order_stats = {}
    if user_ids:
        from app.domains.shopping.models.order import Order

        stats_query = (
            select(
                Order.user_id,
                func.count(Order.id).label("total_orders"),
                func.sum(Order.total_amount).label("total_spent"),
                func.max(Order.created_at).label("last_order"),
            )
            .where(and_(Order.user_id.in_(user_ids), Order.status != "cancelled"))
            .group_by(Order.user_id)
        )
        stats_result = await db.execute(stats_query)
        for row in stats_result.all():
            order_stats[row.user_id] = {
                "total_orders": row.total_orders or 0,
                "total_spent": float(row.total_spent or 0.0),
                "last_order_date": row.last_order.isoformat() if row.last_order else None,
            }

    # Build response
    customers = []
    for user in users:
        name = " ".join(filter(None, [user.first_name, user.last_name])) or "Customer"
        status = "active" if user.is_active else "inactive"

        # Determine status based on is_active
        if not user.is_active:
            status = "suspended"  # Could be refined with additional logic

        user_order_stats = order_stats.get(user.id, {"total_orders": 0, "total_spent": 0.0, "last_order_date": None})

        customers.append(
            CustomerListItem(
                id=str(user.id),
                name=name,
                email=user.email,
                phone=user.phone,
                location=None,  # Could be added from address tables later
                status=status,
                total_orders=user_order_stats["total_orders"],
                total_spent=user_order_stats["total_spent"],
                last_order_date=user_order_stats["last_order_date"],
                joined_date=user.created_at.isoformat() if user.created_at else None,
            )
        )

    total_pages = (total + page_size - 1) // page_size

    return CustomerListResponse(
        customers=customers, total=total, page=page, page_size=page_size, total_pages=total_pages
    )


@router.get("/customers/{customer_id}")
async def get_customer(
    customer_id: str,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """Get customer details"""
    from sqlalchemy.orm import selectinload

    try:
        customer_uuid = uuid.UUID(customer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid customer ID")

    result = await db.execute(
        select(User)
        .options(selectinload(User.customer_profile))
        .where(and_(User.id == customer_uuid, User.role == "customer"))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    name = " ".join(filter(None, [user.first_name, user.last_name])) or "Customer"

    profile = user.customer_profile
    return success_response(
        {
            "id": str(user.id),
            "name": name,
            "email": user.email,
            "phone": user.phone,
            "status": "active" if user.is_active else "inactive",
            "is_verified": user.is_verified,
            "joined_date": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.updated_at.isoformat() if user.updated_at else None,
            "loyalty_tier": profile.loyalty_tier if profile else "bronze",
            "loyalty_points": profile.loyalty_points if profile else 0,
            "notes": profile.notes if profile else None,
            "avatar_url": profile.avatar_url if profile else None,
            "email_order_updates": profile.email_order_updates if profile else True,
            "email_promotions": profile.email_promotions if profile else False,
            "email_newsletter": profile.email_newsletter if profile else True,
            "email_security": profile.email_security if profile else True,
            "sms_order_updates": profile.sms_order_updates if profile else True,
            "sms_promotions": profile.sms_promotions if profile else False,
            "sms_security": profile.sms_security if profile else True,
            "language": profile.language if profile else "en",
            "timezone": profile.timezone if profile else "eat",
        }
    )


@router.patch("/customers/{customer_id}/status")
async def update_customer_status(
    customer_id: str,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    action: str = Query(..., description="Action: activate, deactivate, suspend"),
    db: AsyncSession = Depends(get_db),
):
    """Update customer status"""
    try:
        customer_uuid = uuid.UUID(customer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid customer ID")

    result = await db.execute(select(User).where(and_(User.id == customer_uuid, User.role == "customer")))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    if action == "activate":
        user.is_active = True
    elif action in ["deactivate", "suspend"]:
        user.is_active = False
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    await db.commit()
    await db.refresh(user)

    logger.info(f"Customer {customer_id} status updated to {action} by {current_user.email}")

    return success_response(
        {"message": f"Customer {action}d successfully", "status": "active" if user.is_active else "inactive"}
    )


@router.post("/customers")
async def create_customer(
    data: AdminCustomerCreate,
    current_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db),
):
    """Create a new customer account"""
    # Check if user exists
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    from app.core.security import get_password_hash_async
    from app.domains.customers.models.customer_profile import CustomerProfile

    new_user = User(
        email=data.email,
        password_hash=await get_password_hash_async(data.password),
        role="customer",
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        is_active=True,
        is_verified=True,  # Pre-verified
    )

    db.add(new_user)
    await db.flush()  # Get new_user.id

    # Create customer profile
    new_profile = CustomerProfile(user_id=new_user.id, loyalty_points=data.loyalty_points or 0, notes=data.notes)
    db.add(new_profile)
    await db.commit()

    # Send welcome email
    try:
        from app.domains.shopping.services.email_notification_service import EmailNotificationService

        email_service = EmailNotificationService()
        user_name = f"{new_user.first_name} {new_user.last_name}".strip() or new_user.email.split("@")[0]
        await email_service.send_account_welcome(new_user.email, user_name, str(new_user.id))
    except Exception as e:
        logger.error(f"Failed to send welcome email: {e}")

    return success_response(
        {"id": str(new_user.id), "email": new_user.email, "message": "Customer account created successfully!"}
    )


@router.put("/customers/{customer_id}/password")
async def set_customer_password(
    customer_id: str,
    payload: UserPasswordUpdateRequest,
    current_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db),
):
    """Set or reset a customer's password (admin only)"""
    try:
        customer_uuid = uuid.UUID(customer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid customer ID")

    result = await db.execute(
        select(User).where(and_(User.id == customer_uuid, User.role == "customer"))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    from app.core.security import get_password_hash_async

    user.password_hash = await get_password_hash_async(payload.password)

    # Force password change flag could be stored in user metadata or a separate field
    # For now, we'll rely on the notification to inform the user

    await db.commit()

    # Audit log
    logger.info(
        f"Password updated for customer {customer_id} by admin {current_user.email}. Force change: {payload.force_change}"
    )

    # Send password change notification if requested
    if payload.notify_user:
        try:
            from app.domains.shopping.services.email_notification_service import EmailNotificationService

            email_service = EmailNotificationService()
            user_name = f"{user.first_name} {user.last_name}".strip() or user.email.split("@")[0]
            await email_service.send_password_reset_notification(
                user.email, user_name, payload.force_change
            )
        except Exception as e:
            logger.error(f"Failed to send password notification: {e}")

    return success_response(
        {
            "message": "Password updated successfully",
            "force_change": payload.force_change,
            "notified": payload.notify_user,
        }
    )


# ============================================================================
# Staff Management Endpoints
# ============================================================================


@router.get("/staff", response_model=StaffListResponse)
async def list_staff(
    current_user: Annotated[User, Depends(require_role("admin"))],
    search: str | None = Query(None, description="Search by name, email"),
    role_filter: str | None = Query(None, description="Filter by role: admin, worker"),
    status_filter: str | None = Query(None, description="Filter by status: active, inactive, pending"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List staff members (admin and worker roles)"""

    # Build query
    query = select(User).where(User.role != "guest")

    # Apply role filter
    if role_filter and role_filter != "all":
        query = query.where(User.role == role_filter)

    # Apply status filter
    if status_filter == "active":
        query = query.where(User.is_active == True)
    elif status_filter == "inactive":
        query = query.where(User.is_active == False)
    elif status_filter == "pending":
        query = query.where(User.is_verified == False)

    # Apply search
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                User.email.ilike(search_pattern),
                User.first_name.ilike(search_pattern),
                User.last_name.ilike(search_pattern),
            )
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and ordering
    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    # Execute
    result = await db.execute(query)
    users = result.scalars().all()

    dept_map = {
        "admin": "Executive Management",
        "finance": "Finance & Accounting",
        "compliance": "Clinical & Regulatory Affairs",
        "support": "Customer Support",
        "logistics": "Logistics & Supply Chain",
        "driver": "Logistics & Delivery",
        "vendor": "Vendor Operations",
        "customer": "Client Accounts",
        "worker": "Operations",
    }

    # Fetch permissions matrix & staff overrides
    from app.domains.admin.api.system_api import DEFAULT_ROLE_MATRIX
    from app.domains.admin.services import SystemSettingService

    saved_matrix = await SystemSettingService.get_setting(db, "role_permissions")
    saved_overrides = await SystemSettingService.get_setting(db, "staff_permission_overrides") or {}

    role_matrix = dict(DEFAULT_ROLE_MATRIX)
    if saved_matrix and isinstance(saved_matrix, dict):
        role_matrix.update(saved_matrix)

    # Build response
    staff_list = []
    for user in users:
        name = " ".join(filter(None, [user.first_name, user.last_name])) or user.company_name or "Staff Member"

        # Determine status
        if not user.is_active:
            status = "inactive"
        elif not user.is_verified:
            status = "pending"
        else:
            status = "active"

        department = dept_map.get(user.role, "Operations")

        # Calculate dynamic permissions count
        user_id_str = str(user.id)
        base_perms = set(role_matrix.get(user.role, []))
        user_override = saved_overrides.get(user_id_str, {})
        granted = set(user_override.get("granted", []))
        revoked = set(user_override.get("revoked", []))
        effective_perms = (base_perms | granted) - revoked

        staff_list.append(
            StaffListItem(
                id=user_id_str,
                name=name,
                email=user.email,
                role=user.role,
                status=status,
                department=department,
                last_login=user.updated_at.isoformat() if user.updated_at else None,
                joined_date=user.created_at.isoformat() if user.created_at else None,
                permissions_count=len(effective_perms),
            )
        )

    total_pages = (total + page_size - 1) // page_size

    return StaffListResponse(staff=staff_list, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/staff/{staff_id}")
async def get_staff_member(
    staff_id: str, current_user: Annotated[User, Depends(require_role("admin"))], db: AsyncSession = Depends(get_db)
):
    """Get staff member details with effective permissions"""
    try:
        staff_uuid = uuid.UUID(staff_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff ID")

    result = await db.execute(select(User).where(User.id == staff_uuid))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found")

    name = " ".join(filter(None, [user.first_name, user.last_name])) or user.company_name or "Staff Member"

    dept_map = {
        "admin": "Executive Management",
        "finance": "Finance & Accounting",
        "compliance": "Clinical & Regulatory Affairs",
        "support": "Customer Support",
        "logistics": "Logistics & Supply Chain",
        "driver": "Logistics & Delivery",
        "vendor": "Vendor Operations",
        "customer": "Client Accounts",
        "worker": "Operations",
    }
    department = dept_map.get(user.role, "Operations")

    # Fetch permissions & overrides
    from app.domains.admin.api.system_api import DEFAULT_ROLE_MATRIX
    from app.domains.admin.services import SystemSettingService

    saved_matrix = await SystemSettingService.get_setting(db, "role_permissions")
    saved_overrides = await SystemSettingService.get_setting(db, "staff_permission_overrides") or {}

    role_matrix = dict(DEFAULT_ROLE_MATRIX)
    if saved_matrix and isinstance(saved_matrix, dict):
        role_matrix.update(saved_matrix)

    base_perms = set(role_matrix.get(user.role, []))
    user_override = saved_overrides.get(str(user.id), {})
    granted = set(user_override.get("granted", []))
    revoked = set(user_override.get("revoked", []))
    effective_perms = sorted(list((base_perms | granted) - revoked))

    return success_response(
        {
            "id": str(user.id),
            "name": name,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role,
            "phone": user.phone,
            "department": department,
            "is_active": user.is_active,
            "status": "active" if user.is_active else "inactive",
            "is_verified": user.is_verified,
            "joined_date": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.updated_at.isoformat() if user.updated_at else None,
            "permissions": effective_perms,
            "permissions_count": len(effective_perms),
            "is_customized": bool(granted or revoked),
            "granted_overrides": sorted(list(granted)),
            "revoked_overrides": sorted(list(revoked)),
        }
    )


class StaffPermissionUpdateRequest(BaseModel):
    granted: list[str] = Field(default_factory=list)
    revoked: list[str] = Field(default_factory=list)
    role: str | None = None
    department: str | None = None


@router.get("/staff/{staff_id}/permissions")
async def get_staff_permissions(
    staff_id: str,
    current_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed permissions breakdown for a specific staff member.
    """
    try:
        staff_uuid = uuid.UUID(staff_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff ID")

    result = await db.execute(select(User).where(User.id == staff_uuid))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found")

    from app.domains.admin.api.system_api import DEFAULT_PERMISSION_CATEGORIES, DEFAULT_ROLE_MATRIX, DEFAULT_ROLES
    from app.domains.admin.services import SystemSettingService

    saved_matrix = await SystemSettingService.get_setting(db, "role_permissions")
    saved_roles = await SystemSettingService.get_setting(db, "custom_roles") or []
    saved_overrides = await SystemSettingService.get_setting(db, "staff_permission_overrides") or {}

    role_matrix = dict(DEFAULT_ROLE_MATRIX)
    if saved_matrix and isinstance(saved_matrix, dict):
        role_matrix.update(saved_matrix)

    all_roles = list(DEFAULT_ROLES)
    if saved_roles:
        existing_keys = {r["key"] for r in all_roles}
        for cr in saved_roles:
            if cr.get("key") not in existing_keys:
                all_roles.append(cr)

    user_id_str = str(user.id)
    base_perms = set(role_matrix.get(user.role, []))
    user_override = saved_overrides.get(user_id_str, {})
    granted = set(user_override.get("granted", []))
    revoked = set(user_override.get("revoked", []))
    effective_perms = sorted(list((base_perms | granted) - revoked))

    name = " ".join(filter(None, [user.first_name, user.last_name])) or user.company_name or "Staff Member"

    return success_response(
        {
            "staff_id": user_id_str,
            "name": name,
            "email": user.email,
            "role": user.role,
            "categories": DEFAULT_PERMISSION_CATEGORIES,
            "available_roles": all_roles,
            "base_permissions": sorted(list(base_perms)),
            "granted_overrides": sorted(list(granted)),
            "revoked_overrides": sorted(list(revoked)),
            "effective_permissions": effective_perms,
            "is_customized": bool(granted or revoked),
        }
    )


@router.put("/staff/{staff_id}/permissions")
async def update_staff_permissions(
    staff_id: str,
    payload: StaffPermissionUpdateRequest,
    current_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db),
):
    """
    Update custom permission overrides or assigned role for a staff member.
    """
    try:
        staff_uuid = uuid.UUID(staff_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff ID")

    result = await db.execute(select(User).where(User.id == staff_uuid))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found")

    # Update role if provided
    if payload.role and payload.role != user.role:
        valid_roles = {"admin", "worker", "finance", "compliance", "support", "logistics", "driver", "vendor", "customer", "viewer"}
        if payload.role in valid_roles:
            user.role = payload.role
            await db.commit()
            await db.refresh(user)

    from app.domains.admin.api.system_api import DEFAULT_ROLE_MATRIX
    from app.domains.admin.services import SystemSettingService

    saved_overrides = await SystemSettingService.get_setting(db, "staff_permission_overrides") or {}
    user_id_str = str(user.id)

    # Clean granted and revoked lists
    granted = sorted(list(set(payload.granted)))
    revoked = sorted(list(set(payload.revoked)))

    if granted or revoked:
        saved_overrides[user_id_str] = {
            "granted": granted,
            "revoked": revoked,
            "updated_at": datetime.now(UTC).isoformat(),
            "updated_by": current_user.email,
        }
    elif user_id_str in saved_overrides:
        del saved_overrides[user_id_str]

    await SystemSettingService.set_setting(
        db,
        "staff_permission_overrides",
        saved_overrides,
        "Individual staff custom permission overrides: {user_id: {granted: [...], revoked: [...]}}",
    )

    saved_matrix = await SystemSettingService.get_setting(db, "role_permissions")
    role_matrix = dict(DEFAULT_ROLE_MATRIX)
    if saved_matrix and isinstance(saved_matrix, dict):
        role_matrix.update(saved_matrix)

    base_perms = set(role_matrix.get(user.role, []))
    effective_perms = sorted(list((base_perms | set(granted)) - set(revoked)))

    logger.info(f"Permissions updated for staff member {user_id_str} by {current_user.email}")

    return success_response(
        {
            "message": f"Permissions updated successfully for {user.email}",
            "staff_id": user_id_str,
            "role": user.role,
            "granted_overrides": granted,
            "revoked_overrides": revoked,
            "effective_permissions": effective_perms,
            "is_customized": bool(granted or revoked),
        }
    )


@router.delete("/staff/{staff_id}/permissions/overrides")
async def reset_staff_permission_overrides(
    staff_id: str,
    current_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db),
):
    """
    Reset staff member custom overrides back to their base role defaults.
    """
    try:
        staff_uuid = uuid.UUID(staff_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff ID")

    result = await db.execute(select(User).where(User.id == staff_uuid))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found")

    from app.domains.admin.services import SystemSettingService

    saved_overrides = await SystemSettingService.get_setting(db, "staff_permission_overrides") or {}
    user_id_str = str(user.id)

    if user_id_str in saved_overrides:
        del saved_overrides[user_id_str]
        await SystemSettingService.set_setting(
            db,
            "staff_permission_overrides",
            saved_overrides,
            "Individual staff custom permission overrides: {user_id: {granted: [...], revoked: [...]}}",
        )

    return success_response(
        {
            "message": "Custom permission overrides reset to standard role defaults",
            "staff_id": user_id_str,
            "is_customized": False,
        }
    )


class StaffCreateRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    role: str = "worker"


@router.post("/staff")
async def create_staff(
    current_user: Annotated[User, Depends(require_role("admin"))],
    data: StaffCreateRequest | None = None,
    email: str | None = Query(None, description="Staff email (deprecated, use JSON body)"),
    role: str = Query("worker", description="Staff role: admin, worker"),
    first_name: str | None = Query(None),
    last_name: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Create a new staff member (sends invite email)"""
    eff_email = data.email if data else email
    eff_role = data.role if data else role
    eff_first_name = data.first_name if data else first_name
    eff_last_name = data.last_name if data else last_name

    if not eff_email or not eff_first_name or not eff_last_name:
        raise HTTPException(status_code=400, detail="email, first_name, and last_name are required")

    # Check if user exists
    existing = await db.execute(select(User).where(User.email == eff_email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Create staff user
    import secrets
    import string

    alphabet = string.ascii_letters + string.digits
    temp_password = "".join(secrets.choice(alphabet) for i in range(12))

    from app.core.security import get_password_hash_async

    new_user = User(
        email=eff_email,
        password_hash=await get_password_hash_async(temp_password),
        role=eff_role,
        first_name=eff_first_name,
        last_name=eff_last_name,
        is_active=True,
        is_verified=True,  # Staff are pre-verified
    )

    db.add(new_user)

    # Create an outbox event for the invitation email

    from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus

    invitation_event = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type="User",
        aggregate_id=str(new_user.id),
        event_type="StaffInvitationCreated",
        payload={
            "email": eff_email,
            "first_name": eff_first_name,
            "last_name": eff_last_name,
            "role": eff_role,
            "temp_password": temp_password,
        },
        status=OutboxStatus.PENDING,
    )
    db.add(invitation_event)

    await db.commit()
    await db.refresh(new_user)

    return success_response(
        {
            "id": str(new_user.id),
            "email": new_user.email,
            "role": new_user.role,
            "temp_password": temp_password,
            "message": "Staff member created successfully. Share the temporary password securely with the new staff member.",
        }
    )


@router.patch("/staff/{staff_id}/status")
async def update_staff_status(
    staff_id: str,
    current_user: Annotated[User, Depends(require_role("admin"))],
    action: str = Query(..., description="Action: activate, deactivate"),
    db: AsyncSession = Depends(get_db),
):
    """Update staff status"""
    try:
        staff_uuid = uuid.UUID(staff_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff ID")

    result = await db.execute(
        select(User).where(and_(User.id == staff_uuid, or_(User.role == "admin", User.role == "worker")))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found")

    if action == "activate":
        user.is_active = True
    elif action == "deactivate":
        user.is_active = False
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    await db.commit()
    await db.refresh(user)

    logger.info(f"Staff {staff_id} status updated to {action} by {current_user.email}")

    return success_response(
        {"message": f"Staff member {action}d successfully", "status": "active" if user.is_active else "inactive"}
    )


@router.put("/staff/{staff_id}/password")
async def set_staff_password(
    staff_id: str,
    payload: UserPasswordUpdateRequest,
    current_user: Annotated[User, Depends(require_role("admin"))],
    db: AsyncSession = Depends(get_db),
):
    """Set or reset a staff member's password (admin only)"""
    try:
        staff_uuid = uuid.UUID(staff_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff ID")

    # Prevent self-password change (admin should use their own profile page)
    if str(current_user.id) == staff_id:
        raise HTTPException(status_code=400, detail="Cannot change your own password via this endpoint")

    result = await db.execute(select(User).where(User.id == staff_uuid))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found")

    from app.core.security import get_password_hash_async

    user.password_hash = await get_password_hash_async(payload.password)

    await db.commit()

    # Audit log
    logger.info(
        f"Password updated for staff {staff_id} by admin {current_user.email}. Force change: {payload.force_change}"
    )

    # Send password change notification if requested
    if payload.notify_user:
        try:
            from app.domains.auth.services.email_service import EmailService

            email_service = EmailService()
            user_name = f"{user.first_name} {user.last_name}".strip() or user.email.split("@")[0]
            # TODO: Create staff password reset email template
            # For now, just log it
            logger.info(f"Password reset notification queued for {user.email}")
        except Exception as e:
            logger.error(f"Failed to send password notification: {e}")

    return success_response(
        {
            "message": "Password updated successfully",
            "force_change": payload.force_change,
            "notified": payload.notify_user,
        }
    )


@router.delete("/staff/{staff_id}")
async def delete_staff(
    staff_id: str, current_user: Annotated[User, Depends(require_role("admin"))], db: AsyncSession = Depends(get_db)
):
    """Delete a staff member or user account"""
    try:
        staff_uuid = uuid.UUID(staff_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff ID")

    # Prevent self-deletion
    if str(current_user.id) == staff_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    result = await db.execute(select(User).where(User.id == staff_uuid))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Staff member not found")

    try:
        await db.delete(user)
        await db.commit()
        logger.info(f"User {staff_id} deleted by {current_user.email}")
    except Exception as e:
        await db.rollback()
        user.is_active = False
        await db.commit()
        logger.info(f"User {staff_id} deactivated due to dependent records: {e}")

    return success_response({"message": "Staff member deleted successfully"})


# ============================================================================
# Vendor Management Endpoints (Simplified for Users Overview)
# ============================================================================


@router.get("/vendors/overview", response_model=VendorListResponse)
async def list_vendors_overview(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    status_filter: str | None = Query(None, description="Filter by approval status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=2000),
    db: AsyncSession = Depends(get_db),
):
    """List vendors with basic info for overview page"""

    # Build query with joins
    from sqlalchemy.orm import selectinload

    query = select(User).where(User.role == "vendor").options(selectinload(User.vendor_profile))

    # Get total count
    count_result = await db.execute(select(func.count(User.id)).where(User.role == "vendor"))
    total = count_result.scalar() or 0

    # Apply status filter based on vendor profile
    if status_filter:
        query = query.join(VendorProfile).where(VendorProfile.approval_status == status_filter)

    # Apply pagination
    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    # Execute
    result = await db.execute(query)
    users = result.scalars().all()

    # Build response
    vendors = []
    for user in users:
        profile = user.vendor_profile
        name = " ".join(filter(None, [user.first_name, user.last_name])) or user.company_name or "Vendor"

        vendors.append(
            VendorListItem(
                id=str(user.id),
                name=name,
                email=user.email,
                phone=user.phone,
                company_name=user.company_name,
                store_name=profile.store_name if profile else None,
                status=profile.approval_status if profile else "pending",
                is_verified=user.is_verified,
                joined_date=user.created_at.isoformat() if user.created_at else None,
                approval_date=profile.approved_at.isoformat() if profile and profile.approved_at else None,
            )
        )

    total_pages = (total + page_size - 1) // page_size

    return VendorListResponse(vendors=vendors, total=total, page=page, page_size=page_size, total_pages=total_pages)
