import io
import uuid

import pytest
from httpx import AsyncClient

from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.product import Product
from app.domains.customers.models.customer_profile import CustomerProfile
from app.domains.customers.services.loyalty_service import LoyaltyService
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def customer_setup(db_session):
    """Fixture providing Customer, Vendor, Product, and initial Customer Profile."""
    auth_service = AuthService(db_session)

    # Vendor
    vendor_user = User(
        id=uuid.uuid4(),
        email="vendor_customer_test@test.com",
        password_hash=get_password_hash("VendorPass123!"),
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor_profile = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Kenya Med Suppliers",
        approval_status="approved",
    )
    db_session.add(vendor_profile)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        vendor_id=vendor_profile.id,
        name="Digital Pulse Oximeter",
        slug="digital-pulse-oximeter",
        price=3500.00,
        stock_quantity=100,
        status="published",
        is_verified=True,
    )
    db_session.add(product)

    # Customer
    customer = User(
        id=uuid.uuid4(),
        email="customer_suite@test.com",
        password_hash=get_password_hash("CustomerPass123!"),
        role="customer",
        first_name="Jane",
        last_name="Doe",
        phone="+254711223344",
        is_active=True,
    )
    db_session.add(customer)
    await db_session.flush()

    profile = CustomerProfile(
        id=uuid.uuid4(),
        user_id=customer.id,
        loyalty_points=500,
        loyalty_tier="Bronze",
    )
    db_session.add(profile)
    await db_session.commit()

    tokens = await auth_service.create_tokens(customer)

    return {
        "customer": customer,
        "profile": profile,
        "tokens": tokens,
        "product": product,
    }


@pytest.mark.asyncio
async def test_customer_profile_and_avatar(client: AsyncClient, customer_setup):
    """CUST-001: Customer Profile retrieval, update, and avatar upload."""
    d = customer_setup
    headers = {"Authorization": f"Bearer {d['tokens'].access_token}"}

    # 1. Get profile
    get_res = await client.get("/api/v1/customers/me", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["email"] == "customer_suite@test.com"
    assert get_res.json()["data"]["loyalty_points"] == 500

    # 2. Update profile
    update_payload = {
        "marketing_enabled": True,
        "email_order_updates": True,
        "language": "sw",
        "notes": "Prefers morning deliveries",
    }
    put_res = await client.put("/api/v1/customers/me", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    assert put_res.json()["data"]["language"] == "sw"
    assert put_res.json()["data"]["notes"] == "Prefers morning deliveries"

    # 3. Upload avatar
    fake_image = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4")
    upload_res = await client.post(
        "/api/v1/customers/me/avatar",
        files={"file": ("test_avatar.png", fake_image, "image/png")},
        headers=headers,
    )
    assert upload_res.status_code == 200
    assert "avatar_url" in upload_res.json()["data"]


@pytest.mark.asyncio
async def test_customer_address_book_lifecycle(client: AsyncClient, customer_setup):
    """CUST-002: Customer Address CRUD, default toggles, and retrieval."""
    d = customer_setup
    headers = {"Authorization": f"Bearer {d['tokens'].access_token}"}

    # 1. Create Address -> 200
    addr_payload = {
        "first_name": "Jane",
        "last_name": "Doe",
        "phone": "+254711223344",
        "address_line1": "Ngong Road, Suite 402",
        "city": "Nairobi",
        "state": "Nairobi County",
        "country": "Kenya",
        "postal_code": "00100",
        "type": "shipping",
        "is_default": True,
    }
    create_res = await client.post("/api/v1/customers/addresses", json=addr_payload, headers=headers)
    assert create_res.status_code == 200
    addr_id = create_res.json()["data"]["id"]

    # 2. List addresses
    list_res = await client.get("/api/v1/customers/addresses", headers=headers)
    assert list_res.status_code == 200
    assert any(a["id"] == addr_id for a in list_res.json()["data"])

    # 3. Update Address
    update_res = await client.put(
        f"/api/v1/customers/addresses/{addr_id}",
        json={"address_line1": "Ngong Road, Suite 500"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["address_line1"] == "Ngong Road, Suite 500"

    # 4. Set as default billing address
    default_res = await client.put(
        f"/api/v1/customers/addresses/{addr_id}/default",
        json={"type": "billing"},
        headers=headers,
    )
    assert default_res.status_code == 200

    # 5. Delete Address
    del_res = await client.delete(f"/api/v1/customers/addresses/{addr_id}", headers=headers)
    assert del_res.status_code == 200


@pytest.mark.asyncio
async def test_customer_wishlist_and_reviews(client: AsyncClient, customer_setup):
    """CUST-003: Wishlist additions, updates, clear, and product reviews."""
    d = customer_setup
    headers = {"Authorization": f"Bearer {d['tokens'].access_token}"}
    p_id = str(d["product"].id)

    # 1. Add to wishlist
    add_wish = await client.post(
        "/api/v1/customers/wishlist",
        json={"product_id": p_id, "notes": "Need for next month procurement"},
        headers=headers,
    )
    assert add_wish.status_code == 200
    wish_id = add_wish.json()["data"]["id"]

    # 2. List wishlist
    list_wish = await client.get("/api/v1/customers/wishlist", headers=headers)
    assert list_wish.status_code == 200
    assert len(list_wish.json()["data"]) >= 1

    # 3. Update wishlist item
    put_wish = await client.put(
        f"/api/v1/customers/wishlist/items/{wish_id}",
        json={"notes": "Urgent procurement"},
        headers=headers,
    )
    assert put_wish.status_code == 200
    assert put_wish.json()["data"]["notes"] == "Urgent procurement"

    # 4. Create Product Review -> 200
    review_payload = {
        "product_id": p_id,
        "rating": 5,
        "comment": "Accurate readings, durable build quality, and easy to sanitize.",
    }
    create_rev = await client.post("/api/v1/customers/reviews", json=review_payload, headers=headers)
    assert create_rev.status_code == 200
    rev_id = create_rev.json()["data"]["id"]

    # 5. Get my reviews
    my_revs = await client.get("/api/v1/customers/reviews", headers=headers)
    assert my_revs.status_code == 200
    assert any(r["id"] == rev_id for r in my_revs.json()["data"])

    # 6. Update review
    put_rev = await client.put(
        f"/api/v1/customers/reviews/{rev_id}",
        json={"comment": "Updated: Outstanding medical device"},
        headers=headers,
    )
    assert put_rev.status_code == 200
    assert put_rev.json()["data"]["comment"] == "Updated: Outstanding medical device"

    # 7. Delete review
    del_rev = await client.delete(f"/api/v1/customers/reviews/{rev_id}", headers=headers)
    assert del_rev.status_code == 200

    # 8. Clear wishlist
    clear_wish = await client.delete("/api/v1/customers/wishlist", headers=headers)
    assert clear_wish.status_code == 200


@pytest.mark.asyncio
async def test_customer_loyalty_ledger_and_redemption(client: AsyncClient, customer_setup):
    """CUST-004: Loyalty status, summary, ledger history, and points redemption."""
    d = customer_setup
    headers = {"Authorization": f"Bearer {d['tokens'].access_token}"}

    # 1. Loyalty status
    status_res = await client.get("/api/v1/customers/me/loyalty", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["data"]["points_balance"] == 500

    # 2. Loyalty summary
    summary_res = await client.get("/api/v1/customers/me/loyalty/summary", headers=headers)
    assert summary_res.status_code == 200
    assert "current_tier" in summary_res.json()["data"]

    # 3. Redeem points
    redeem_payload = {
        "points": 100,
        "description": "Discount on PPE order",
    }
    red_res = await client.post("/api/v1/customers/me/loyalty/redeem", json=redeem_payload, headers=headers)
    assert red_res.status_code == 200
    assert red_res.json()["data"]["new_balance"] == 400

    # 4. Loyalty ledger history
    ledger_res = await client.get("/api/v1/customers/me/loyalty/ledger", headers=headers)
    assert ledger_res.status_code == 200
    assert len(ledger_res.json()["data"]["items"]) >= 1
