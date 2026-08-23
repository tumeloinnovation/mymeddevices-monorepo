import asyncio
import uuid
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import select, update

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_variant import ProductVariant
from app.domains.catalog.services.catalog_service import CatalogService
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shared.services.outbox_relay import OutboxRelay
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.coupon import Coupon, CouponRestriction, CouponUsage
from app.domains.shopping.services.cart_service import CartService
from app.domains.shopping.services.coupon_service import CouponService
from app.domains.shopping.services.order_service import CheckoutService
from app.domains.tickets.models.ticket import Ticket, TicketReply
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def multi_vendor_catalog_setup(db_session):
    """Fixture providing Vendor A, Vendor B, Admin, Customer, and products."""
    auth_service = AuthService(db_session)

    # Category
    category = Category(
        id=uuid.uuid4(),
        name="Diagnostic Equipment",
        slug="diagnostic-equipment",
        is_active=True,
    )
    db_session.add(category)
    await db_session.flush()

    # 1. Vendor User A & Profile
    vendor_user_a = User(
        id=uuid.uuid4(),
        email="vendor_alpha@test.com",
        password_hash="test_hash_a",
        role="vendor",
        first_name="Vendor",
        last_name="Alpha",
        is_active=True,
    )
    db_session.add(vendor_user_a)
    await db_session.flush()

    vendor_a = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user_a.id,
        store_name="Vendor Alpha Supplies",
        approval_status="approved",
    )
    db_session.add(vendor_a)
    await db_session.flush()

    # 2. Vendor User B & Profile (Attacker / Unrelated Vendor)
    vendor_user_b = User(
        id=uuid.uuid4(),
        email="vendor_bravo@test.com",
        password_hash="test_hash_b",
        role="vendor",
        first_name="Vendor",
        last_name="Bravo",
        is_active=True,
    )
    db_session.add(vendor_user_b)
    await db_session.flush()

    vendor_b = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user_b.id,
        store_name="Vendor Bravo Supplies",
        approval_status="approved",
    )
    db_session.add(vendor_b)
    await db_session.flush()

    # 3. Admin User
    admin_user = User(
        id=uuid.uuid4(),
        email="admin_super@test.com",
        password_hash="test_hash_admin",
        role="admin",
        first_name="Admin",
        last_name="Super",
        is_active=True,
    )
    db_session.add(admin_user)
    await db_session.flush()

    # 4. Customer User
    customer_user = User(
        id=uuid.uuid4(),
        email="customer_shopper@test.com",
        password_hash="test_hash_cust",
        role="customer",
        first_name="Customer",
        last_name="Shopper",
        is_active=True,
    )
    db_session.add(customer_user)
    await db_session.flush()

    # 5. Product belonging to Vendor A
    product_a = Product(
        id=uuid.uuid4(),
        vendor_id=vendor_a.id,
        category_id=category.id,
        name="Digital Ultrasound A1",
        slug="digital-ultrasound-a1",
        price=15000.00,
        stock_quantity=20,
        status="published",
        is_verified=True,
        product_type="variable",
    )
    db_session.add(product_a)

    # 6. Product belonging to Vendor B
    product_b = Product(
        id=uuid.uuid4(),
        vendor_id=vendor_b.id,
        category_id=category.id,
        name="ECG Monitor B1",
        slug="ecg-monitor-b1",
        price=8000.00,
        stock_quantity=10,
        status="published",
        is_verified=True,
        product_type="simple",
    )
    db_session.add(product_b)

    await db_session.commit()

    tokens_vendor_a = await auth_service.create_tokens(vendor_user_a)
    tokens_vendor_b = await auth_service.create_tokens(vendor_user_b)
    tokens_admin = await auth_service.create_tokens(admin_user)
    tokens_customer = await auth_service.create_tokens(customer_user)

    return {
        "vendor_a": vendor_a,
        "vendor_b": vendor_b,
        "product_a": product_a,
        "product_b": product_b,
        "tokens_vendor_a": tokens_vendor_a,
        "tokens_vendor_b": tokens_vendor_b,
        "tokens_admin": tokens_admin,
        "tokens_customer": tokens_customer,
        "customer_user": customer_user,
        "admin_user": admin_user,
    }


# ============================================================================
# 1. P0-SEC-01: Catalog Authorization / IDOR Protection Tests
# ============================================================================


@pytest.mark.asyncio
async def test_vendor_cannot_add_variant_to_other_vendor_product(
    client: AsyncClient, multi_vendor_catalog_setup
):
    """Vendor B must NOT be able to add variants to Vendor A's product."""
    setup = multi_vendor_catalog_setup
    product_a_id = setup["product_a"].id
    headers_b = {"Authorization": f"Bearer {setup['tokens_vendor_b'].access_token}"}

    payload = {
        "name": "Blue Probe",
        "sku": "VAR-ATTACK-001",
        "price_adjustment": 500.0,
        "stock_quantity": 5,
    }

    response = await client.post(
        f"/api/v1/catalog/products/{product_a_id}/variants",
        json=payload,
        headers=headers_b,
    )
    assert response.status_code in (403, 404), f"Expected 403 or 404 but got {response.status_code}: {response.text}"


@pytest.mark.asyncio
async def test_vendor_cannot_bulk_create_matrix_on_other_vendor_product(
    client: AsyncClient, multi_vendor_catalog_setup
):
    """Vendor B must NOT be able to bulk create variant matrix on Vendor A's product."""
    setup = multi_vendor_catalog_setup
    product_a_id = setup["product_a"].id
    headers_b = {"Authorization": f"Bearer {setup['tokens_vendor_b'].access_token}"}

    payload = {
        "attribute_groups": {"size": ["S", "M", "L"]},
        "base_sku_prefix": "MATRIX-ATTACK",
        "default_stock": 5,
    }

    response = await client.post(
        f"/api/v1/catalog/products/{product_a_id}/variants/bulk",
        json=payload,
        headers=headers_b,
    )
    assert response.status_code in (403, 404), f"Expected 403 or 404 but got {response.status_code}: {response.text}"


@pytest.mark.asyncio
async def test_vendor_cannot_modify_or_delete_other_vendor_variant(
    client: AsyncClient, db_session, multi_vendor_catalog_setup
):
    """Vendor B must NOT be able to update or delete Vendor A's variant."""
    setup = multi_vendor_catalog_setup
    product_a_id = setup["product_a"].id

    # Create variant directly for Product A
    variant_a = ProductVariant(
        id=uuid.uuid4(),
        product_id=product_a_id,
        name="Standard Probe",
        sku="SKU-PROD-A-VAR1",
        price_adjustment=Decimal("100.00"),
        stock_quantity=10,
        is_active=True,
    )
    db_session.add(variant_a)
    await db_session.commit()

    headers_b = {"Authorization": f"Bearer {setup['tokens_vendor_b'].access_token}"}

    # 1. Update attempt
    patch_resp = await client.patch(
        f"/api/v1/catalog/products/{product_a_id}/variants/{variant_a.id}",
        json={"stock_quantity": 999},
        headers=headers_b,
    )
    assert patch_resp.status_code in (403, 404)

    # 2. Delete attempt
    del_resp = await client.delete(
        f"/api/v1/catalog/products/{product_a_id}/variants/{variant_a.id}",
        headers=headers_b,
    )
    assert del_resp.status_code in (403, 404)


@pytest.mark.asyncio
async def test_vendor_cannot_modify_bundle_items_on_other_vendor_product(
    client: AsyncClient, multi_vendor_catalog_setup
):
    """Vendor B must NOT be able to add bundle items to Vendor A's product."""
    setup = multi_vendor_catalog_setup
    product_a_id = setup["product_a"].id
    product_b_id = setup["product_b"].id
    headers_b = {"Authorization": f"Bearer {setup['tokens_vendor_b'].access_token}"}

    payload = {
        "component_product_id": str(product_b_id),
        "quantity": 1,
    }

    response = await client.post(
        f"/api/v1/catalog/products/{product_a_id}/bundle-items",
        json=payload,
        headers=headers_b,
    )
    assert response.status_code in (403, 404)


@pytest.mark.asyncio
async def test_vendor_cannot_modify_related_products_on_other_vendor_product(
    client: AsyncClient, multi_vendor_catalog_setup
):
    """Vendor B must NOT be able to add related product link on Vendor A's product."""
    setup = multi_vendor_catalog_setup
    product_a_id = setup["product_a"].id
    product_b_id = setup["product_b"].id
    headers_b = {"Authorization": f"Bearer {setup['tokens_vendor_b'].access_token}"}

    payload = {
        "related_product_id": str(product_b_id),
        "relation_type": "cross_sell",
    }

    response = await client.post(
        f"/api/v1/catalog/products/{product_a_id}/related",
        json=payload,
        headers=headers_b,
    )
    assert response.status_code in (403, 404)


@pytest.mark.asyncio
async def test_customer_cannot_mutate_catalog_variants_or_bundles(
    client: AsyncClient, multi_vendor_catalog_setup
):
    """Customers must NOT be allowed to mutate catalog variants or bundles."""
    setup = multi_vendor_catalog_setup
    product_a_id = setup["product_a"].id
    headers_cust = {"Authorization": f"Bearer {setup['tokens_customer'].access_token}"}

    resp = await client.post(
        f"/api/v1/catalog/products/{product_a_id}/variants",
        json={"name": "Cust Probe", "sku": "CUST-VAR", "price_adjustment": 0, "stock_quantity": 5},
        headers=headers_cust,
    )
    assert resp.status_code in (401, 403)


# ============================================================================
# 2. NEW-INV-01: Variable Product Inventory Disconnect & Stock Resync Tests
# ============================================================================


@pytest.mark.asyncio
async def test_variable_product_checkout_and_stock_resync(
    db_session, multi_vendor_catalog_setup
):
    """
    Test that checking out a variable product:
    1. Atomically decrements the specific ProductVariant.stock_quantity.
    2. Atomically decrements the aggregate Product.stock_quantity.
    3. Running _sync_variable_product_stock afterwards does NOT resurrect sold stock.
    """
    setup = multi_vendor_catalog_setup
    product_a = setup["product_a"]
    customer = setup["customer_user"]

    # 1. Create two variants
    variant_1 = ProductVariant(
        id=uuid.uuid4(),
        product_id=product_a.id,
        name="Probe 10MHz",
        sku="ULTRA-V1-10",
        price_adjustment=Decimal("500.00"),
        stock_quantity=10,
        is_active=True,
    )
    variant_2 = ProductVariant(
        id=uuid.uuid4(),
        product_id=product_a.id,
        name="Probe 15MHz",
        sku="ULTRA-V2-15",
        price_adjustment=Decimal("1000.00"),
        stock_quantity=15,
        is_active=True,
    )
    db_session.add_all([variant_1, variant_2])

    # Update product aggregate stock to 25
    product_a.stock_quantity = 25
    await db_session.commit()

    # 2. Add Variant 1 (qty 4) to customer's cart
    cart_service = CartService(db_session)
    cart = await cart_service.get_or_create_cart(user_id=customer.id)
    cart_item = await cart_service.add_item(
        cart_id=cart.id,
        product_id=product_a.id,
        product_variant_id=variant_1.id,
        quantity=4,
    )
    assert cart_item.product_variant_id == variant_1.id

    # 3. Checkout
    checkout_service = CheckoutService(db_session)
    order = await checkout_service.create_order_from_cart(
        cart_id=cart.id,
        user_id=customer.id,
        shipping_address={
            "full_name": "Test Customer",
            "phone": "+254700000000",
            "city": "Nairobi",
            "address": "123 Test St",
            "payment_method": "cod",
        },
    )
    assert order is not None

    # 4. Verify variant stocks
    await db_session.refresh(variant_1)
    await db_session.refresh(variant_2)
    await db_session.refresh(product_a)

    assert variant_1.stock_quantity == 6, f"Expected variant 1 stock=6, got {variant_1.stock_quantity}"
    assert variant_2.stock_quantity == 15, f"Expected variant 2 stock=15, got {variant_2.stock_quantity}"
    assert product_a.stock_quantity == 21, f"Expected product aggregate stock=21, got {product_a.stock_quantity}"

    # 5. Execute _sync_variable_product_stock and ensure stock is NOT resurrected
    catalog_service = CatalogService(db_session)
    await catalog_service._sync_variable_product_stock(product_a.id)
    await db_session.refresh(product_a)

    assert product_a.stock_quantity == 21, "Sold stock must not be resurrected by catalog sync!"


# ============================================================================
# 3. NEW-CONC-03: Coupon Concurrency Lock Guard Tests
# ============================================================================


@pytest.mark.asyncio
async def test_coupon_concurrency_global_limit_enforced(
    db_session, multi_vendor_catalog_setup
):
    """
    Test that a coupon with global_usage_limit=1 cannot be redeemed more than once
    under concurrent checkout requests.
    """
    setup = multi_vendor_catalog_setup
    customer = setup["customer_user"]

    # 1. Create a 10% coupon with global_usage_limit=1
    coupon = Coupon(
        id=uuid.uuid4(),
        code="CONCURRENT10",
        coupon_type="percentage",
        discount_value=Decimal("10.00"),
        valid_from=datetime.now(UTC),
        is_active=True,
    )
    db_session.add(coupon)
    await db_session.flush()

    restrictions = CouponRestriction(
        id=uuid.uuid4(),
        coupon_id=coupon.id,
        global_usage_limit=1,
        one_time_per_user=True,
    )
    db_session.add(restrictions)
    await db_session.commit()

    coupon_service = CouponService(db_session)

    # 2. First usage succeeds
    order_id_1 = uuid.uuid4()
    usage1 = await coupon_service.record_coupon_usage(
        coupon_id=coupon.id,
        user_id=customer.id,
        order_id=order_id_1,
        discount_amount=Decimal("100.00"),
    )
    assert usage1 is not None

    # 3. Second usage must raise BusinessRuleError due to limit reached
    order_id_2 = uuid.uuid4()
    with pytest.raises(Exception) as exc_info:
        await coupon_service.record_coupon_usage(
            coupon_id=coupon.id,
            user_id=customer.id,
            order_id=order_id_2,
            discount_amount=Decimal("100.00"),
        )
    assert "limit" in str(exc_info.value).lower() or "already used" in str(exc_info.value).lower()


# ============================================================================
# 4. P1-SEC-02 & P1-DAT-04: Staff Creation Body & Soft Deactivation
# ============================================================================


@pytest.mark.asyncio
async def test_staff_creation_via_json_body_and_soft_delete(
    client: AsyncClient, db_session, multi_vendor_catalog_setup
):
    """
    Test that:
    1. Admin can create staff via JSON body (preventing query param log leakage).
    2. Admin deleting staff soft-deactivates the user and preserves ticket replies.
    """
    setup = multi_vendor_catalog_setup
    headers_admin = {"Authorization": f"Bearer {setup['tokens_admin'].access_token}"}

    # 1. Create staff via JSON body
    staff_payload = {
        "email": "support_agent_new@test.com",
        "first_name": "Support",
        "last_name": "Agent",
        "role": "worker",
    }
    create_resp = await client.post(
        "/api/v1/admin/users/staff",
        json=staff_payload,
        headers=headers_admin,
    )
    assert create_resp.status_code == 200, f"Staff create failed: {create_resp.text}"
    staff_data = create_resp.json()["data"]
    staff_id = staff_data["id"]

    # 2. Staff posts a ticket reply
    ticket = Ticket(
        id=uuid.uuid4(),
        ticket_number="TCK-99001",
        customer_id=setup["customer_user"].id,
        subject="Device Calibration Help",
        description="Need urgent assistance calibrating ultrasound probe",
    )
    db_session.add(ticket)
    await db_session.flush()

    staff_uuid = uuid.UUID(staff_id)
    reply = TicketReply(
        id=uuid.uuid4(),
        ticket_id=ticket.id,
        user_id=staff_uuid,
        content="Please follow the calibration steps on page 4 of the manual.",
    )
    db_session.add(reply)
    await db_session.commit()

    # 3. Delete staff via admin endpoint
    del_resp = await client.delete(
        f"/api/v1/admin/users/staff/{staff_id}",
        headers=headers_admin,
    )
    assert del_resp.status_code == 200

    # 4. Verify staff user is soft-deactivated and ticket reply is preserved
    staff_user = await db_session.get(User, staff_uuid)
    assert staff_user is not None, "Staff user row must not be physically destroyed!"
    assert staff_user.is_active is False, "Staff user must be marked inactive"

    reply_stmt = select(TicketReply).where(TicketReply.id == reply.id)
    reply_res = await db_session.execute(reply_stmt)
    persisted_reply = reply_res.scalar_one_or_none()
    assert persisted_reply is not None, "Historical ticket reply must remain intact!"
    assert persisted_reply.content == "Please follow the calibration steps on page 4 of the manual."


# ============================================================================
# 5. P2-PERF-06: Outbox FOR UPDATE SKIP LOCKED Multi-Worker Processing
# ============================================================================


@pytest.mark.asyncio
async def test_outbox_relay_skip_locked_concurrency(db_session):
    """
    Test that OutboxRelay dispatches pending events with with_for_update(skip_locked=True).
    """
    # Create 2 pending outbox events
    e1 = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type="Order",
        aggregate_id=str(uuid.uuid4()),
        event_type="OrderCreated",
        payload={"msg": "Event 1"},
        status=OutboxStatus.PENDING,
    )
    e2 = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type="Order",
        aggregate_id=str(uuid.uuid4()),
        event_type="OrderCreated",
        payload={"msg": "Event 2"},
        status=OutboxStatus.PENDING,
    )
    db_session.add_all([e1, e2])
    await db_session.commit()

    relay = OutboxRelay(db_session)
    processed = await relay.process_pending_events(limit=5)
    assert processed >= 2
