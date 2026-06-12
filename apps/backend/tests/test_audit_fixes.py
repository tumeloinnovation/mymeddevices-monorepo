import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.vendor.services.vendor_service import VendorService
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.category import Category
from app.core.security import get_password_hash, create_access_token


@pytest.mark.asyncio
async def test_unified_settings_loaded():
    """Verify unified settings are successfully loaded and validated"""
    assert settings.DATABASE_URL is not None
    assert settings.MAX_CONTENT_LENGTH == 10 * 1024 * 1024
    assert settings.ALGORITHM == "RS256"


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    """Verify the health check endpoint returns success and correct status indicators"""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "up"
    assert "redis" in data


@pytest.mark.asyncio
async def test_request_size_limit_middleware(client: AsyncClient):
    """Verify ContentLengthLimitMiddleware intercepts requests that are too large with a 413 error"""
    # Setting an extremely large Content-Length header to trigger 413 immediately
    headers = {"Content-Length": str(settings.MAX_CONTENT_LENGTH + 100)}
    response = await client.post("/api/v1/auth/register", json={}, headers=headers)
    assert response.status_code == 413
    assert response.json()["detail"] == "Request entity too large"


@pytest.mark.asyncio
async def test_gdpr_vendor_profile_anonymization_and_product_archiving(client: AsyncClient, db: AsyncSession):
    """Verify deleting a vendor account anonymizes their vendor profile and archives their products"""
    # 1. Create a category
    category = Category(
        name="Test Category",
        slug="test-category-gdpr",
        is_active=True
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)

    # 2. Create a vendor user manually
    user = User(
        email="vendor-gdpr@example.com",
        password_hash=get_password_hash("Test123!"),
        role="vendor",
        first_name="GDPR",
        last_name="Vendor",
        phone="+254700000000",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 3. Create vendor profile
    profile = VendorProfile(
        user_id=user.id,
        store_name="GDPR Store",
        company_name="GDPR Company",
        vat_number="VAT123",
        mpesa_phone="+254700000000",
        approval_status="approved",
        business_email="vendor-gdpr-biz@example.com",
        business_phone="+254700000000"
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    # 4. Create a product for this vendor
    product = Product(
        vendor_id=profile.id,
        category_id=category.id,
        name="GDPR Stethoscope",
        slug="gdpr-stethoscope",
        base_price=3000.0,
        status="published",
        is_deleted=False
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)

    # Create access token for the user
    token = create_access_token({"sub": str(user.id)})

    # 5. Delete account
    delete_data = {
        "password": "Test123!",
        "confirm": True
    }
    response = await client.request(
        "DELETE",
        "/api/v1/auth/account",
        json=delete_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 202
    assert response.json()["success"] == True

    # 6. Verify User is anonymized
    await db.refresh(user)
    assert user.is_active == False
    assert user.email.startswith("deleted_")
    assert user.password_hash == "!deleted_no_password"
    assert user.phone is None
    assert user.first_name == "Deleted"
    assert user.last_name == "User"

    # 7. Verify VendorProfile is anonymized
    await db.refresh(profile)
    assert profile.store_name == "Deleted Vendor"
    assert profile.company_name == "Deleted Company"
    assert profile.vat_number is None
    assert profile.mpesa_phone is None
    assert profile.business_email is None
    assert profile.business_phone is None
    assert profile.approval_status == "suspended"

    # 8. Verify Products are archived
    await db.refresh(product)
    assert product.status == "archived"
    assert product.is_deleted == True
    assert product.deleted_at is not None


@pytest.mark.asyncio
async def test_db_pool_settings_loaded():
    """Verify DB pooling parameters are present in Settings"""
    assert settings.DB_POOL_SIZE == 5
    assert settings.DB_MAX_OVERFLOW == 10
    assert settings.DB_POOL_PRE_PING is True


@pytest.mark.asyncio
async def test_production_rate_limiter_requires_redis():
    """Verify rate limiter throws exception in production if REDIS_URL is missing"""
    from unittest.mock import patch
    with patch("app.core.config.settings.ENVIRONMENT", "production"), \
         patch("app.core.config.settings.REDIS_URL", ""):
        from app.core.rate_limiting import RateLimiter
        with pytest.raises(ValueError, match="REDIS_URL must be configured"):
            RateLimiter()


@pytest.mark.asyncio
async def test_vendor_service_notifications(db: AsyncSession):
    """Verify email notifications are sent out on vendor approval, rejection, and suspension"""
    from unittest.mock import patch, AsyncMock

    category = Category(name="Stethoscope", slug="stethoscope-notify", is_active=True)
    db.add(category)
    await db.commit()
    await db.refresh(category)

    user = User(
        email="vendor-notifications@example.com",
        password_hash="dummy_hash",
        role="vendor",
        first_name="Test",
        last_name="Vendor",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    profile = VendorProfile(
        user_id=user.id,
        store_name="Notify Store",
        company_name="Notify Company",
        approval_status="pending"
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    service = VendorService(db)

    with patch("app.domains.vendor.services.vendor_service.send_email", new_callable=AsyncMock) as mock_send_email:
        # 1. Approve (using user.id as approved_by so it passes foreign key constraint)
        await service.approve_vendor(user_id=str(user.id), approved_by=str(user.id))
        mock_send_email.assert_called_once()
        assert "Approved" in mock_send_email.call_args[0][1]
        assert user.email == mock_send_email.call_args[0][0]
        mock_send_email.reset_mock()

        # 2. Suspend (only approved vendors can be suspended)
        await service.suspend_vendor(user_id=str(user.id), suspended_by=str(user.id), reason="Policy Violation")
        mock_send_email.assert_called_once()
        assert "Suspended" in mock_send_email.call_args[0][1]
        assert "Policy Violation" in mock_send_email.call_args[0][2]
        mock_send_email.reset_mock()

        # 3. Reject (can suspend/change state and reject)
        await service.reject_vendor(user_id=str(user.id), approved_by=str(user.id), reason="Incomplete Docs")
        mock_send_email.assert_called_once()
        assert "Rejected" in mock_send_email.call_args[0][1]
        assert "Incomplete Docs" in mock_send_email.call_args[0][2]


@pytest.mark.asyncio
async def test_list_vendors_eager_loads_user(db: AsyncSession):
    """Verify list_vendors uses eager loading to avoid N+1 query when loading user"""
    from sqlalchemy import inspect

    user = User(
        email="eager-load-test@example.com",
        password_hash="dummy_hash",
        role="vendor",
        first_name="Eager",
        last_name="Test",
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    profile = VendorProfile(
        user_id=user.id,
        store_name="Eager Store",
        company_name="Eager Company",
        approval_status="approved"
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    # Expire all objects to force db load
    db.expire_all()

    service = VendorService(db)
    vendors, total = await service.list_vendors(status="approved")
    
    assert len(vendors) > 0
    # Inspect that 'user' relationship is already loaded (meaning it is not in the unloaded set)
    for v in vendors:
        if v.id == profile.id:
            insp = inspect(v)
            assert "user" not in insp.unloaded

