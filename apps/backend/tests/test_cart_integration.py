"""
Integration tests for cart operations

Tests the full cart lifecycle including:
- Guest cart creation and management
- Item addition, update, removal
- Cart validation
- Guest cart merging
- Coupon application
"""

import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.auth.models.user import User
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.vendor.models.vendor_profile import VendorProfile


async def create_test_user_token(db: AsyncSession, email: str) -> str:
    from app.domains.auth.models.user import User
    from app.core.security import get_password_hash, create_access_token

    user = User(
        email=email,
        password_hash=get_password_hash("TestPassword123!"),
        role="customer",
        first_name="Test",
        last_name="User",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return create_access_token({"sub": str(user.id)})


@pytest.fixture
async def vendor_user(db: AsyncSession) -> User:
    from app.core.security import get_password_hash
    email = f"vendor_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Test123!"),
        role="vendor",
        first_name="Vendor",
        last_name="Shop",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    profile = VendorProfile(
        user_id=user.id,
        store_name=f"Store_{uuid.uuid4().hex[:6]}",
        approval_status="approved"
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return user


@pytest.fixture
async def sample_category(db: AsyncSession) -> Category:
    slug = f"cat-{uuid.uuid4().hex[:6]}"
    category = Category(
        name="Shopping Category",
        slug=slug,
        is_active=True
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@pytest.fixture
async def test_products(db: AsyncSession, vendor_user: User, sample_category: Category):
    from sqlalchemy import select
    
    stmt = select(VendorProfile).where(VendorProfile.user_id == vendor_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one()
    
    p1 = Product(
        vendor_id=profile.id,
        category_id=sample_category.id,
        name="Test Product 1",
        slug=f"prod-{uuid.uuid4().hex[:6]}",
        sku=f"SKU-{uuid.uuid4().hex[:6]}",
        base_price=1000.0,
        price=1000.0,
        status="published",
        stock_quantity=10,
    )
    p2 = Product(
        vendor_id=profile.id,
        category_id=sample_category.id,
        name="Test Product 2",
        slug=f"prod-{uuid.uuid4().hex[:6]}",
        sku=f"SKU-{uuid.uuid4().hex[:6]}",
        base_price=2000.0,
        price=2000.0,
        status="published",
        stock_quantity=10,
    )
    db.add_all([p1, p2])
    await db.commit()
    await db.refresh(p1)
    await db.refresh(p2)
    return p1, p2


@pytest.mark.asyncio
class TestCartIntegration:
    """Test cart operations end-to-end"""

    async def test_guest_cart_lifecycle(self, async_client: AsyncClient, test_products: tuple, db: AsyncSession):
        """Test creating and managing a guest cart"""
        p1, p2 = test_products
        # Create guest cart via get storefront cart endpoint (which auto-creates)
        response = await async_client.get("/shopping/cart/my")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "cart_token" in data["data"]

        cart_token = data["data"]["cart_token"]

        # Add item to guest cart
        response = await async_client.post(
            "/shopping/cart/items",
            json={
                "product_id": str(p1.id),
                "quantity": 2,
            },
            params={"cart_token": cart_token}
        )
        assert response.status_code == 200
        item_data = response.json()
        assert item_data["success"] is True
        assert item_data["data"]["quantity"] == 2

        # Get cart
        response = await async_client.get("/shopping/cart/my", params={"cart_token": cart_token})
        assert response.status_code == 200
        cart_data = response.json()
        assert cart_data["success"] is True
        assert len(cart_data["data"]["items"]) == 1

    async def test_add_multiple_items(self, async_client: AsyncClient, test_products: tuple, db: AsyncSession):
        """Test adding multiple items to cart"""
        p1, p2 = test_products
        # Create guest cart
        response = await async_client.get("/shopping/cart/my")
        cart_token = response.json()["data"]["cart_token"]

        # Add first item
        await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p1.id), "quantity": 1},
            params={"cart_token": cart_token}
        )

        # Add second item
        response = await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p2.id), "quantity": 3},
            params={"cart_token": cart_token}
        )
        assert response.status_code == 200

        # Verify cart has both items
        response = await async_client.get("/shopping/cart/my", params={"cart_token": cart_token})
        cart_data = response.json()
        assert len(cart_data["data"]["items"]) == 2
        # Sum quantities of items in cart
        total_quantity = sum(item["quantity"] for item in cart_data["data"]["items"])
        assert total_quantity == 4  # 1 + 3

    async def test_update_item_quantity(self, async_client: AsyncClient, test_products: tuple, db: AsyncSession):
        """Test updating cart item quantity"""
        p1, p2 = test_products
        # Create cart and add item
        response = await async_client.get("/shopping/cart/my")
        cart_token = response.json()["data"]["cart_token"]

        response = await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p1.id), "quantity": 1},
            params={"cart_token": cart_token}
        )
        item_id = response.json()["data"]["id"]

        # Update quantity
        response = await async_client.patch(
            f"/shopping/cart/items/{item_id}",
            json={"quantity": 5},
            params={"cart_token": cart_token}
        )
        assert response.status_code == 200
        assert response.json()["data"]["quantity"] == 5

    async def test_remove_item(self, async_client: AsyncClient, test_products: tuple, db: AsyncSession):
        """Test removing item from cart"""
        p1, p2 = test_products
        # Create cart and add item
        response = await async_client.get("/shopping/cart/my")
        cart_token = response.json()["data"]["cart_token"]

        response = await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p1.id), "quantity": 1},
            params={"cart_token": cart_token}
        )
        item_id = response.json()["data"]["id"]

        # Remove item
        response = await async_client.delete(
            f"/shopping/cart/items/{item_id}",
            params={"cart_token": cart_token}
        )
        assert response.status_code == 200

        # Verify cart is empty
        response = await async_client.get("/shopping/cart/my", params={"cart_token": cart_token})
        cart_data = response.json()
        assert len(cart_data["data"]["items"]) == 0

    async def test_clear_cart(self, async_client: AsyncClient, test_products: tuple, db: AsyncSession):
        """Test clearing entire cart"""
        p1, p2 = test_products
        # Create cart and add items
        response = await async_client.get("/shopping/cart/my")
        cart_token = response.json()["data"]["cart_token"]

        await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p1.id), "quantity": 2},
            params={"cart_token": cart_token}
        )
        await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p2.id), "quantity": 1},
            params={"cart_token": cart_token}
        )

        # Clear cart
        response = await async_client.delete(
            "/shopping/cart/clear",
            params={"cart_token": cart_token}
        )
        assert response.status_code == 200
        assert response.json()["data"]["removed_count"] == 2

    async def test_cart_validation(self, async_client: AsyncClient, test_products: tuple, db: AsyncSession):
        """Test cart validation endpoint"""
        p1, p2 = test_products
        # Create cart
        response = await async_client.get("/shopping/cart/my")
        cart = response.json()["data"]
        cart_id = cart["id"]
        cart_token = cart["cart_token"]

        # Add item
        await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p1.id), "quantity": 1},
            params={"cart_token": cart_token}
        )

        # Validate cart
        response = await async_client.post(
            "/shopping/cart/validate",
            params={"cart_id": cart_id}
        )
        assert response.status_code == 200
        validation_data = response.json()
        assert validation_data["success"] is True
        assert "is_valid" in validation_data["data"]


@pytest.mark.asyncio
class TestCartMerge:
    """Test guest cart merging on login"""

    async def test_merge_guest_cart(self, async_client: AsyncClient, test_products: tuple, db: AsyncSession):
        """Test merging guest cart into customer cart"""
        p1, p2 = test_products
        # Create guest cart with items
        response = await async_client.get("/shopping/cart/my")
        guest_token = response.json()["data"]["cart_token"]

        # Add items to guest cart
        await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p1.id), "quantity": 2},
            params={"cart_token": guest_token}
        )

        # Create authenticated user with their own cart
        access_token = await create_test_user_token(db, "mergetest@example.com")

        # Create customer cart with items
        customer_response = await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p2.id), "quantity": 1},
            headers={"Authorization": f"Bearer {access_token}"}
        )
        customer_cart_id = customer_response.json()["data"]["cart_id"]

        # Merge guest cart into customer cart
        merge_response = await async_client.post(
            "/shopping/cart/merge",
            json={
                "guest_cart_token": guest_token,
                "merge_method": "merge"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert merge_response.status_code == 200
        merge_data = merge_response.json()
        assert merge_data["success"] is True
        assert merge_data["data"]["item_count"] == 2  # 2 unique items (p1 and p2)

    async def test_replace_with_guest_cart(self, async_client: AsyncClient, test_products: tuple, db: AsyncSession):
        """Test replacing customer cart with guest cart"""
        p1, p2 = test_products
        # Create guest cart
        response = await async_client.get("/shopping/cart/my")
        guest_token = response.json()["data"]["cart_token"]

        # Add items to guest cart
        await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p1.id), "quantity": 5},
            params={"cart_token": guest_token}
        )

        # Create authenticated user
        access_token = await create_test_user_token(db, "replacetest@example.com")

        # Create customer cart
        await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p2.id), "quantity": 1},
            headers={"Authorization": f"Bearer {access_token}"}
        )

        # Replace with guest cart
        merge_response = await async_client.post(
            "/shopping/cart/merge",
            json={
                "guest_cart_token": guest_token,
                "merge_method": "replace"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert merge_response.status_code == 200
        merge_data = merge_response.json()
        assert merge_data["data"]["item_count"] == 1  # Only guest items (1 unique item: p1)


@pytest.mark.asyncio
class TestCartErrors:
    """Test cart error handling"""

    async def test_add_item_invalid_product(self, async_client: AsyncClient, test_products: tuple, db: AsyncSession):
        """Test adding item with invalid product ID"""
        response = await async_client.get("/shopping/cart/my")
        cart_token = response.json()["data"]["cart_token"]

        response = await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(uuid.uuid4()), "quantity": 1},
            params={"cart_token": cart_token}
        )
        assert response.status_code == 404 or response.status_code == 400

    async def test_update_invalid_quantity(self, async_client: AsyncClient, test_products: tuple, db: AsyncSession):
        """Test updating with invalid quantity"""
        p1, p2 = test_products
        response = await async_client.get("/shopping/cart/my")
        cart_token = response.json()["data"]["cart_token"]

        response = await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p1.id), "quantity": 1},
            params={"cart_token": cart_token}
        )
        item_id = response.json()["data"]["id"]

        response = await async_client.patch(
            f"/shopping/cart/items/{item_id}",
            json={"quantity": -1},  # Invalid quantity
            params={"cart_token": cart_token}
        )
        assert response.status_code in [400, 422]

    async def test_update_item_ownership_check(self, async_client: AsyncClient, test_products: tuple, db: AsyncSession):
        """Test that updating an item with a wrong cart token returns 403"""
        p1, p2 = test_products
        # Create first cart and add item
        response = await async_client.get("/shopping/cart/my")
        cart_token_1 = response.json()["data"]["cart_token"]

        response = await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p1.id), "quantity": 1},
            params={"cart_token": cart_token_1}
        )
        item_id = response.json()["data"]["id"]

        # Create second cart
        response2 = await async_client.get("/shopping/cart/my")
        cart_token_2 = response2.json()["data"]["cart_token"]
        assert cart_token_1 != cart_token_2

        # Try to update item from cart 1 using cart 2's token
        response = await async_client.patch(
            f"/shopping/cart/items/{item_id}",
            json={"quantity": 5},
            params={"cart_token": cart_token_2}
        )
        assert response.status_code == 403

    async def test_remove_item_ownership_check(self, async_client: AsyncClient, test_products: tuple, db: AsyncSession):
        """Test that removing an item with a wrong cart token returns 403"""
        p1, p2 = test_products
        # Create first cart and add item
        response = await async_client.get("/shopping/cart/my")
        cart_token_1 = response.json()["data"]["cart_token"]

        response = await async_client.post(
            "/shopping/cart/items",
            json={"product_id": str(p1.id), "quantity": 1},
            params={"cart_token": cart_token_1}
        )
        item_id = response.json()["data"]["id"]

        # Create second cart
        response2 = await async_client.get("/shopping/cart/my")
        cart_token_2 = response2.json()["data"]["cart_token"]

        # Try to delete item from cart 1 using cart 2's token
        response = await async_client.delete(
            f"/shopping/cart/items/{item_id}",
            params={"cart_token": cart_token_2}
        )
        assert response.status_code == 403

    async def test_remove_nonexistent_item(self, async_client: AsyncClient, db: AsyncSession):
        """Test removing item that doesn't exist"""
        response = await async_client.delete(f"/shopping/cart/items/{uuid.uuid4()}")
        assert response.status_code == 404

    async def test_merge_with_invalid_token(self, async_client: AsyncClient, db: AsyncSession):
        """Test merging with invalid guest cart token"""
        access_token = await create_test_user_token(db, "mergetest2@example.com")

        response = await async_client.post(
            "/shopping/cart/merge",
            json={
                "guest_cart_token": "invalid-token",
                "merge_method": "merge"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code == 400 or response.status_code == 404
