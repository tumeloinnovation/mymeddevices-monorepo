import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.catalog.models.product import Product
from tests.test_shopping import customer_token, published_product, vendor_user, sample_category, customer_user

@pytest.mark.asyncio
async def test_checkout_fails_on_insufficient_stock(
    client: AsyncClient, 
    customer_token: str, 
    published_product: Product,
    db: AsyncSession
):
    # Set stock to 5
    published_product.stock_quantity = 5
    await db.commit()
    
    headers = {"Authorization": f"Bearer {customer_token}"}
    
    # 1. Get or create cart
    response = await client.get("/api/v1/shopping/cart/my", headers=headers)
    assert response.status_code == 200
    cart_id = response.json()["data"]["id"]
    
    # 2. Add 10 items (more than 5 in stock)
    add_payload = {
        "product_id": str(published_product.id),
        "quantity": 10
    }
    add_resp = await client.post("/api/v1/shopping/cart/items", json=add_payload, headers=headers)
    assert add_resp.status_code == 200
    
    # 3. Attempt Checkout
    checkout_payload = {
        "cart_id": cart_id,
        "shipping_address": {
            "full_name": "Test Customer",
            "address_line1": "123 Medical Way",
            "city": "Nairobi",
            "country": "Kenya"
        }
    }
    checkout_resp = await client.post("/api/v1/shopping/checkout", json=checkout_payload, headers=headers)
    
    # Expected: 400 Bad Request
    assert checkout_resp.status_code == 400
    assert "Insufficient stock" in checkout_resp.json()["detail"]
