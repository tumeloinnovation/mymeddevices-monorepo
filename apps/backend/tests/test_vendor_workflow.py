"""
Comprehensive Vendor Workflow Tests

Tests the complete vendor workflow from registration through order fulfillment
with proper multi-vendor data isolation.
"""
import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.shopping.models.order import Order, OrderItem, OrderStatus
from app.domains.shopping.models.cart import Cart, CartItem
from app.core.security import get_password_hash, create_access_token


# ============================================================================
# FIXTURES
# ============================================================================

async def get_token_headers(client: AsyncClient, email: str, password: str) -> dict:
    """Helper to get authenticated headers."""
    login_data = {
        "email": email,
        "password": password,
        "device_id": "test_device",
        "device_name": "Test Runner"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def admin_user(db: AsyncSession) -> User:
    """Create an admin user for approving vendors."""
    email = f"admin_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Admin123!"),
        role="admin",
        first_name="Admin",
        last_name="User",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
async def admin_token(admin_user: User) -> str:
    """Create admin access token."""
    return create_access_token({"sub": str(admin_user.id), "role": "admin"})


@pytest.fixture
async def sample_category(db: AsyncSession) -> Category:
    """Create a sample category for products."""
    slug = f"cat-{uuid.uuid4().hex[:6]}"
    category = Category(
        name="Medical Devices",
        slug=slug,
        is_active=True
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@pytest.fixture
async def customer_user(db: AsyncSession) -> User:
    """Create a customer user."""
    email = f"customer_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Test123!"),
        role="customer",
        first_name="Customer",
        last_name="One",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
async def customer_token(customer_user: User) -> str:
    """Create customer access token."""
    return create_access_token({"sub": str(customer_user.id), "role": "customer"})


async def create_vendor_with_profile(
    db: AsyncSession,
    name: str,
    approval_status: str = "pending"
) -> tuple[User, VendorProfile]:
    """Helper to create a vendor user with profile."""
    email = f"vendor_{name}_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Test123!"),
        role="vendor",
        first_name=f"Vendor",
        last_name=name,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    profile = VendorProfile(
        user_id=user.id,
        store_name=f"{name}'s Store",
        approval_status=approval_status
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return user, profile


async def create_published_product(
    db: AsyncSession,
    vendor_profile: VendorProfile,
    category: Category,
    name: str,
    price: float
) -> Product:
    """Helper to create a published product for a vendor."""
    slug = f"prod-{uuid.uuid4().hex[:6]}"
    product = Product(
        vendor_id=vendor_profile.id,
        category_id=category.id,
        name=name,
        slug=slug,
        sku=f"SKU-{uuid.uuid4().hex[:6]}",
        base_price=price,
        price=price * 1.05,  # 5% markup
        status="published",
        stock_quantity=100,
        short_description=f"{name} short description",
        description=f"Detailed description for {name}"
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def create_cart_with_items(
    db: AsyncSession,
    user: User,
    products: list[Product]
) -> Cart:
    """Helper to create a cart with items from multiple vendors."""
    cart = Cart(user_id=user.id)
    db.add(cart)
    await db.commit()
    await db.refresh(cart)

    for product in products:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=1,
            unit_price=product.price
        )
        db.add(cart_item)
    await db.commit()
    await db.refresh(cart)
    return cart


# ============================================================================
# TEST CLASS: VENDOR REGISTRATION & APPROVAL
# ============================================================================

class TestVendorRegistrationAndApproval:
    """Test vendor registration flow and admin approval process."""

    @pytest.mark.asyncio
    async def test_vendor_registration_creates_pending_profile(
        self, client: AsyncClient
    ):
        """Test that vendor registration creates a pending vendor profile."""
        vendor_data = {
            "email": f"vendor_{uuid.uuid4().hex[:6]}@example.com",
            "password": "Test123!",
            "company_name": "New Medical Supplies Ltd",
            "phone": "+254712345678"
        }

        response = await client.post("/api/v1/auth/register/vendor", json=vendor_data)
        assert response.status_code == 201

        data = response.json()["data"]
        assert data["role"] == "vendor"
        assert data["is_verified"] == False
        assert "next_steps" in data

    @pytest.mark.asyncio
    async def test_vendor_cannot_create_products_when_pending(
        self, client: AsyncClient, db: AsyncSession, sample_category: Category
    ):
        """Test that pending vendors cannot create products."""
        # Create pending vendor
        _, vendor_profile = await create_vendor_with_profile(db, "Pending", "pending")
        vendor_token = create_access_token({
            "sub": str(vendor_profile.user_id),
            "role": "vendor"
        })

        # Attempt to create product
        product_data = {
            "category_id": str(sample_category.id),
            "name": "Test Product",
            "sku": f"SKU-{uuid.uuid4().hex[:6]}",
            "base_price": 1000.0,
            "short_description": "A test product",
            "description": "Detailed description for test product"
        }

        response = await client.post(
            "/api/v1/catalog/products",
            json=product_data,
            headers={"Authorization": f"Bearer {vendor_token}"}
        )

        # Should fail due to pending status
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_admin_can_approve_vendor(
        self, client: AsyncClient, db: AsyncSession, admin_token: str
    ):
        """Test that admin can approve a pending vendor."""
        # Create pending vendor
        vendor_user, vendor_profile = await create_vendor_with_profile(db, "ApproveMe", "pending")

        # Admin approves vendor using user_id (not vendor_profile.id)
        response = await client.post(
            f"/api/v1/vendors/admin/{vendor_user.id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={}
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["approval_status"] == "approved"

        # Verify in database
        await db.refresh(vendor_profile)
        assert vendor_profile.approval_status == "approved"


# ============================================================================
# TEST CLASS: MULTI-VENDOR ORDERS
# ============================================================================

class TestMultiVendorOrders:
    """Test order creation with products from multiple vendors."""

    @pytest.mark.asyncio
    async def test_single_order_with_multiple_vendors(
        self, client: AsyncClient, db: AsyncSession, sample_category: Category
    ):
        """Test that checkout creates a single order with items from multiple vendors."""
        # Create two approved vendors with products
        vendor_a_user, vendor_a_profile = await create_vendor_with_profile(
            db, "VendorA", "approved"
        )
        product_a = await create_published_product(
            db, vendor_a_profile, sample_category, "Product A", 1000.0
        )

        vendor_b_user, vendor_b_profile = await create_vendor_with_profile(
            db, "VendorB", "approved"
        )
        product_b = await create_published_product(
            db, vendor_b_profile, sample_category, "Product B", 2000.0
        )

        # Create customer
        customer_email = f"customer_{uuid.uuid4().hex[:6]}@example.com"
        customer_user = User(
            email=customer_email,
            password_hash=get_password_hash("Test123!"),
            role="customer",
            is_active=True,
            is_verified=True
        )
        db.add(customer_user)
        await db.commit()
        await db.refresh(customer_user)

        # Create cart with both products
        cart = await create_cart_with_items(db, customer_user, [product_a, product_b])

        # Create order via checkout
        customer_token = create_access_token({
            "sub": str(customer_user.id),
            "role": "customer"
        })

        checkout_data = {
            "cart_id": str(cart.id),
            "shipping_address": {
                "address_line1": "123 Test St",
                "city": "Nairobi",
                "country": "KE"
            }
        }

        response = await client.post(
            "/api/v1/shopping/checkout",
            json=checkout_data,
            headers={"Authorization": f"Bearer {customer_token}"}
        )

        assert response.status_code in [200, 201]  # Allow both status codes
        order_data = response.json()["data"]

        # Verify single order was created
        order_id = order_data["id"]
        stmt = select(Order).where(Order.id == order_id)
        result = await db.execute(stmt)
        order = result.scalar_one()

        # Verify order has 2 items from different vendors
        stmt = select(OrderItem).where(OrderItem.order_id == order_id)
        result = await db.execute(stmt)
        order_items = result.scalars().all()

        assert len(order_items) == 2

        vendor_ids = {item.vendor_id for item in order_items}
        assert vendor_a_profile.id in vendor_ids
        assert vendor_b_profile.id in vendor_ids

    @pytest.mark.asyncio
    async def test_order_items_have_correct_vendor_ids(
        self, client: AsyncClient, db: AsyncSession, sample_category: Category
    ):
        """Test that each order item has the correct vendor_id."""
        # Create vendors and products
        vendor_a_user, vendor_a_profile = await create_vendor_with_profile(
            db, "VendorA", "approved"
        )
        product_a = await create_published_product(
            db, vendor_a_profile, sample_category, "Product A", 1000.0
        )

        vendor_b_user, vendor_b_profile = await create_vendor_with_profile(
            db, "VendorB", "approved"
        )
        product_b = await create_published_product(
            db, vendor_b_profile, sample_category, "Product B", 2000.0
        )

        # Create customer and checkout
        customer_email = f"customer_{uuid.uuid4().hex[:6]}@example.com"
        customer_user = User(
            email=customer_email,
            password_hash=get_password_hash("Test123!"),
            role="customer",
            is_active=True,
            is_verified=True
        )
        db.add(customer_user)
        await db.commit()
        await db.refresh(customer_user)

        cart = await create_cart_with_items(db, customer_user, [product_a, product_b])

        customer_token = create_access_token({
            "sub": str(customer_user.id),
            "role": "customer"
        })

        checkout_data = {
            "cart_id": str(cart.id),
            "shipping_address": {"address_line1": "123 Test St", "city": "Nairobi"}
        }

        response = await client.post(
            "/api/v1/shopping/checkout",
            json=checkout_data,
            headers={"Authorization": f"Bearer {customer_token}"}
        )

        order_id = response.json()["data"]["id"]

        # Verify each item has correct vendor_id
        stmt = select(OrderItem).where(OrderItem.order_id == order_id)
        result = await db.execute(stmt)
        order_items = result.scalars().all()

        for item in order_items:
            if item.product_id == product_a.id:
                assert item.vendor_id == vendor_a_profile.id
            elif item.product_id == product_b.id:
                assert item.vendor_id == vendor_b_profile.id


# ============================================================================
# TEST CLASS: VENDOR DATA ISOLATION
# ============================================================================

class TestVendorDataIsolation:
    """Test that vendors can only see their own order items."""

    @pytest.mark.asyncio
    async def test_vendor_sees_only_their_order_items(
        self, client: AsyncClient, db: AsyncSession, sample_category: Category
    ):
        """Test that Vendor A sees only their items when fetching orders."""
        # Setup: Create Vendor A, Vendor B, and their products
        vendor_a_user, vendor_a_profile = await create_vendor_with_profile(
            db, "VendorA", "approved"
        )
        product_a = await create_published_product(
            db, vendor_a_profile, sample_category, "Product A", 1000.0
        )

        vendor_b_user, vendor_b_profile = await create_vendor_with_profile(
            db, "VendorB", "approved"
        )
        product_b = await create_published_product(
            db, vendor_b_profile, sample_category, "Product B", 2000.0
        )

        # Customer buys both products
        customer_email = f"customer_{uuid.uuid4().hex[:6]}@example.com"
        customer_user = User(
            email=customer_email,
            password_hash=get_password_hash("Test123!"),
            role="customer",
            is_active=True,
            is_verified=True
        )
        db.add(customer_user)
        await db.commit()
        await db.refresh(customer_user)

        cart = await create_cart_with_items(db, customer_user, [product_a, product_b])

        customer_token = create_access_token({
            "sub": str(customer_user.id),
            "role": "customer"
        })

        checkout_data = {
            "cart_id": str(cart.id),
            "shipping_address": {"address_line1": "123 Test St", "city": "Nairobi"}
        }

        response = await client.post(
            "/api/v1/shopping/checkout",
            json=checkout_data,
            headers={"Authorization": f"Bearer {customer_token}"}
        )

        order_id = response.json()["data"]["id"]

        # Vendor A fetches orders
        vendor_a_token = create_access_token({
            "sub": str(vendor_a_user.id),
            "role": "vendor"
        })

        response = await client.get(
            "/api/v1/admin/shopping/orders/vendor",
            headers={"Authorization": f"Bearer {vendor_a_token}"}
        )

        assert response.status_code == 200
        data = response.json()["data"]

        # Vendor A should see the order but only their items
        orders = data["orders"]
        assert len(orders) == 1

        vendor_order = orders[0]
        assert vendor_order["id"] == str(order_id)

        # Should only see Product A (their product)
        items = vendor_order["items"]
        assert len(items) == 1
        assert items[0]["product_id"] == str(product_a.id)
        assert items[0]["vendor_id"] == str(vendor_a_profile.id)

        # Total should reflect only Vendor A's portion
        expected_total = product_a.price
        assert float(vendor_order["total_amount"]) == expected_total

    @pytest.mark.asyncio
    async def test_vendor_cannot_access_other_vendor_items(
        self, client: AsyncClient, db: AsyncSession, sample_category: Category
    ):
        """Test that Vendor A cannot access Vendor B's order items."""
        # Setup vendors and products
        vendor_a_user, vendor_a_profile = await create_vendor_with_profile(
            db, "VendorA", "approved"
        )
        product_a = await create_published_product(
            db, vendor_a_profile, sample_category, "Product A", 1000.0
        )

        vendor_b_user, vendor_b_profile = await create_vendor_with_profile(
            db, "VendorB", "approved"
        )
        product_b = await create_published_product(
            db, vendor_b_profile, sample_category, "Product B", 2000.0
        )

        # Customer creates order with both products
        customer_email = f"customer_{uuid.uuid4().hex[:6]}@example.com"
        customer_user = User(
            email=customer_email,
            password_hash=get_password_hash("Test123!"),
            role="customer",
            is_active=True,
            is_verified=True
        )
        db.add(customer_user)
        await db.commit()
        await db.refresh(customer_user)

        cart = await create_cart_with_items(db, customer_user, [product_a, product_b])

        customer_token = create_access_token({
            "sub": str(customer_user.id),
            "role": "customer"
        })

        checkout_data = {
            "cart_id": str(cart.id),
            "shipping_address": {"address_line1": "123 Test St", "city": "Nairobi"}
        }

        response = await client.post(
            "/api/v1/shopping/checkout",
            json=checkout_data,
            headers={"Authorization": f"Bearer {customer_token}"}
        )

        order_id = response.json()["data"]["id"]

        # Get OrderItem IDs
        stmt = select(OrderItem).where(OrderItem.order_id == order_id)
        result = await db.execute(stmt)
        all_items = result.scalars().all()

        vendor_a_item = next(i for i in all_items if i.vendor_id == vendor_a_profile.id)
        vendor_b_item = next(i for i in all_items if i.vendor_id == vendor_b_profile.id)

        # Vendor A tries to fetch Vendor B's item
        vendor_a_token = create_access_token({
            "sub": str(vendor_a_user.id),
            "role": "vendor"
        })

        # This should fail or not show Vendor B's item
        response = await client.get(
            f"/api/v1/admin/shopping/orders/vendor",
            headers={"Authorization": f"Bearer {vendor_a_token}"}
        )

        data = response.json()["data"]["orders"][0]
        item_ids = [item["id"] for item in data["items"]]

        # Vendor B's item should NOT be in the list
        assert str(vendor_b_item.id) not in item_ids
        # Only Vendor A's item should be present
        assert str(vendor_a_item.id) in item_ids

    @pytest.mark.asyncio
    async def test_vendor_total_is_calculated_correctly(
        self, client: AsyncClient, db: AsyncSession, sample_category: Category
    ):
        """Test that vendor's total reflects only their portion."""
        # Create vendors with different priced products
        vendor_a_user, vendor_a_profile = await create_vendor_with_profile(
            db, "VendorA", "approved"
        )
        product_a = await create_published_product(
            db, vendor_a_profile, sample_category, "Product A", 1500.0
        )

        vendor_b_user, vendor_b_profile = await create_vendor_with_profile(
            db, "VendorB", "approved"
        )
        product_b = await create_published_product(
            db, vendor_b_profile, sample_category, "Product B", 3000.0
        )

        # Customer buys both
        customer_email = f"customer_{uuid.uuid4().hex[:6]}@example.com"
        customer_user = User(
            email=customer_email,
            password_hash=get_password_hash("Test123!"),
            role="customer",
            is_active=True,
            is_verified=True
        )
        db.add(customer_user)
        await db.commit()
        await db.refresh(customer_user)

        cart = await create_cart_with_items(db, customer_user, [product_a, product_b])

        customer_token = create_access_token({
            "sub": str(customer_user.id),
            "role": "customer"
        })

        checkout_data = {
            "cart_id": str(cart.id),
            "shipping_address": {"address_line1": "123 Test St", "city": "Nairobi"}
        }

        await client.post(
            "/api/v1/shopping/checkout",
            json=checkout_data,
            headers={"Authorization": f"Bearer {customer_token}"}
        )

        # Vendor A fetches orders
        vendor_a_token = create_access_token({
            "sub": str(vendor_a_user.id),
            "role": "vendor"
        })

        response = await client.get(
            "/api/v1/admin/shopping/orders/vendor",
            headers={"Authorization": f"Bearer {vendor_a_token}"}
        )

        vendor_order = response.json()["data"]["orders"][0]

        # Total should be only Product A's price (1500 * 1.05 = 1575)
        expected_total = product_a.price
        assert float(vendor_order["total_amount"]) == expected_total

        # Should not include Product B's price
        assert float(vendor_order["total_amount"]) != (product_a.price + product_b.price)


# ============================================================================
# TEST CLASS: END-TO-END VENDOR WORKFLOW
# ============================================================================

class TestEndToEndVendorWorkflow:
    """Test complete vendor workflow from registration to fulfillment."""

    @pytest.mark.asyncio
    async def test_complete_vendor_workflow(
        self, client: AsyncClient, db: AsyncSession, sample_category: Category,
        admin_token: str
    ):
        """
        Test complete workflow:
        1. Vendor registration
        2. Admin approval
        3. Product creation
        4. Customer purchase
        5. Vendor sees only their items
        """
        # Step 1: Vendor registers
        vendor_email = f"vendor_{uuid.uuid4().hex[:6]}@example.com"
        vendor_data = {
            "email": vendor_email,
            "password": "Test123!",
            "company_name": "Complete Test Medical Ltd",
            "phone": "+254712345678"
        }

        response = await client.post("/api/v1/auth/register/vendor", json=vendor_data)
        assert response.status_code == 201
        vendor_user_id = response.json()["data"]["id"]

        # Verify vendor is pending
        stmt = select(VendorProfile).where(VendorProfile.user_id == uuid.UUID(vendor_user_id))
        result = await db.execute(stmt)
        vendor_profile = result.scalar_one()
        assert vendor_profile.approval_status == "pending"

        # Step 2: Admin approves vendor (using user_id)
        response = await client.post(
            f"/api/v1/vendors/admin/{vendor_user_id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={}
        )
        assert response.status_code == 200

        # Step 3: Vendor creates product
        vendor_token = create_access_token({
            "sub": vendor_user_id,
            "role": "vendor"
        })

        product_data = {
            "category_id": str(sample_category.id),
            "name": "Complete Test Product",
            "sku": f"CTP-{uuid.uuid4().hex[:6]}",
            "base_price": 2500.0,
            "short_description": "A complete test product",
            "description": "This is a complete test product description",
            "stock_quantity": 100
        }

        response = await client.post(
            "/api/v1/catalog/products",
            json=product_data,
            headers={"Authorization": f"Bearer {vendor_token}"}
        )
        assert response.status_code in [200, 201]  # Allow both status codes

        # Product endpoint returns product directly, not wrapped in success_response
        product_data = response.json()
        product_id = product_data.get("id") or product_data.get("data", {}).get("id")

        # Step 4: Customer purchases product (along with another vendor's product)
        vendor_b_user, vendor_b_profile = await create_vendor_with_profile(
            db, "VendorB", "approved"
        )
        product_b = await create_published_product(
            db, vendor_b_profile, sample_category, "Product B", 1500.0
        )

        customer_email = f"customer_{uuid.uuid4().hex[:6]}@example.com"
        customer_user = User(
            email=customer_email,
            password_hash=get_password_hash("Test123!"),
            role="customer",
            is_active=True,
            is_verified=True
        )
        db.add(customer_user)
        await db.commit()
        await db.refresh(customer_user)

        # Add both products to cart
        stmt = select(Product).where(Product.id == uuid.UUID(product_id))
        result = await db.execute(stmt)
        product_a = result.scalar_one()

        cart = await create_cart_with_items(db, customer_user, [product_a, product_b])

        customer_token = create_access_token({
            "sub": str(customer_user.id),
            "role": "customer"
        })

        checkout_data = {
            "cart_id": str(cart.id),
            "shipping_address": {"address_line1": "456 Complete St", "city": "Nairobi"}
        }

        response = await client.post(
            "/api/v1/shopping/checkout",
            json=checkout_data,
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code in [200, 201]  # Allow both status codes

        # Step 5: Verify vendor sees only their items
        response = await client.get(
            "/api/v1/admin/shopping/orders/vendor",
            headers={"Authorization": f"Bearer {vendor_token}"}
        )

        assert response.status_code == 200
        orders = response.json()["data"]["orders"]
        assert len(orders) == 1

        vendor_order = orders[0]
        assert len(vendor_order["items"]) == 1
        assert vendor_order["items"][0]["product_id"] == product_id

        # Verify total is only their portion
        expected_total = product_a.price
        assert float(vendor_order["total_amount"]) == expected_total
