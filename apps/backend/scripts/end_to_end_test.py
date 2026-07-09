import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import requests
import json
import uuid
import csv
import io
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.domains.auth.models.otp import OTP
from app.domains.auth.models.user import User
from app.domains.catalog.models.product import Product
from app.core.config import settings

API_BASE_URL = "http://127.0.0.1:8001/api/v1"

async def get_otp_for_email(email: str):
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        result = await session.execute(
            select(User).where(User.email == email)
        )
        user = result.scalars().first()
        if not user:
            return None
            
        result = await session.execute(
            select(OTP).where(OTP.user_id == str(user.id)).order_by(OTP.created_at.desc())
        )
        otp = result.scalars().first()
        return otp.code if otp else None

async def main():
    print("=== End-to-End Flow Test ===")
    
    # 1. Register Vendor
    vendor_email = f"vendor_{uuid.uuid4().hex[:8]}@example.com"
    print(f"Registering vendor: {vendor_email}")
    res = requests.post(f"{API_BASE_URL}/auth/register/vendor", json={
        "email": vendor_email,
        "password": "SecurePassword123!",
        "company_name": "Test Vendor Co",
        "phone": "0712345678",
        "first_name": "Test",
        "last_name": "Vendor"
    })
    
    if res.status_code != 201:
        print(f"Failed to register vendor: {res.text}")
        return
        
    vendor_data = res.json()["data"]
    vendor_id = vendor_data["id"]
    print(f"Vendor registered: ID {vendor_id}")
    
    # 2. Verify Vendor Email via OTP
    print("Waiting for OTP...")
    await asyncio.sleep(1) # wait for DB write
    otp_code = await get_otp_for_email(vendor_email)
    print(f"OTP Code: {otp_code}")
    
    res = requests.post(f"{API_BASE_URL}/auth/otp/verify", json={
        "email": vendor_email,
        "code": otp_code,
        "purpose": "verification"
    })
    if res.status_code != 200:
        print(f"Failed to verify OTP: {res.text}")
        return
    print("Vendor email verified.")
    
    # 3. Admin Approves Vendor
    print("Admin logging in...")
    res = requests.post(f"{API_BASE_URL}/auth/login", json={
        "email": "admin@mymeddevices.com",
        "password": "Admin123!",
        "device_id": "test-script"
    })
    admin_token = res.json()["data"]["access_token"]
    
    print("Admin approving vendor...")
    res = requests.post(f"{API_BASE_URL}/vendor/vendors/admin/{vendor_id}/approve", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    if res.status_code != 200:
        print(f"Failed to approve vendor: {res.text}")
        return
    print("Vendor approved.")
    
    # 4. Vendor Login
    print("Vendor logging in...")
    res = requests.post(f"{API_BASE_URL}/auth/login", json={
        "email": vendor_email,
        "password": "SecurePassword123!",
        "device_id": "test-script-vendor"
    })
    vendor_token = res.json()["data"]["access_token"]
    print("Vendor logged in.")
    
    # 5. Bulk Upload Products via CSV
    print("Vendor bulk uploading products...")
    csv_data = """name,sku,short_description,description,base_price,stock_quantity,is_active
Product A,SKU-A,Short desc A,Long desc A,100.0,50,true
Product B,SKU-B,Short desc B,Long desc B,200.0,10,true
"""
    files = {'file': ('products.csv', csv_data, 'text/csv')}
    res = requests.post(f"{API_BASE_URL}/catalog/products/bulk-upload", headers={
        "Authorization": f"Bearer {vendor_token}"
    }, files=files)
    
    if res.status_code != 200:
        print(f"Failed to bulk upload products: {res.text}")
        return
    print("Products uploaded successfully:", res.json())
    
    # Verify products are created and get product ID
    res = requests.get(f"{API_BASE_URL}/catalog/products", headers={
        "Authorization": f"Bearer {vendor_token}"
    })
    products = res.json()["data"]["products"]
    print(f"Vendor has {len(products)} products.")
    product_a = next(p for p in products if p["name"] == "Product A")
    product_id = product_a["id"]
    
    # 6. Admin Publishes Product (Wait, does admin need to publish?)
    print("Vendor verifying product...")
    res = requests.post(f"{API_BASE_URL}/catalog/products/{product_id}/verify", headers={
        "Authorization": f"Bearer {vendor_token}"
    })
    print("Vendor verified product:", res.status_code)
    
    print("Vendor publishing product...")
    res = requests.post(f"{API_BASE_URL}/catalog/products/{product_id}/publish", headers={
        "Authorization": f"Bearer {vendor_token}"
    })
    print("Vendor published product:", res.status_code)
    
    # Verify product in storefront
    res = requests.get(f"{API_BASE_URL}/catalog/storefront/products/{product_id}")
    if res.status_code == 200:
        print("Product is live in storefront.")
    else:
        print(f"Failed to find product in storefront: {res.text}")
    
    # 7. Customer Registration
    customer_email = f"customer_{uuid.uuid4().hex[:8]}@example.com"
    print(f"Registering customer: {customer_email}")
    res = requests.post(f"{API_BASE_URL}/auth/register", json={
        "email": customer_email,
        "password": "SecurePassword123!",
        "role": "customer",
        "first_name": "Test",
        "last_name": "Customer"
    })
    if res.status_code != 200:
        print(f"Failed to register customer: {res.text}")
        return
    
    # 8. Customer Login
    print("Customer logging in...")
    res = requests.post(f"{API_BASE_URL}/auth/login", json={
        "email": customer_email,
        "password": "SecurePassword123!",
        "device_id": "test-script-customer"
    })
    customer_token = res.json()["data"]["access_token"]
    print("Customer logged in.")
    
    # 9. Add to Cart & Checkout (COD)
    print("Customer adding product to cart...")
    # Since we need cart_id, let's see how cart works. 
    # The endpoint is probably POST /shopping/cart/items
    res = requests.post(f"{API_BASE_URL}/shopping/cart/items", headers={
        "Authorization": f"Bearer {customer_token}"
    }, json={
        "product_id": product_id,
        "quantity": 1
    })
    if res.status_code != 200:
        print(f"Failed to add to cart: {res.text}")
        return
    
    res = requests.get(f"{API_BASE_URL}/shopping/cart", headers={
        "Authorization": f"Bearer {customer_token}"
    })
    cart_id = res.json()["data"]["id"]
    print(f"Cart ID: {cart_id}")
    
    print("Customer checking out (Cash on Delivery)...")
    res = requests.post(f"{API_BASE_URL}/shopping/checkout", headers={
        "Authorization": f"Bearer {customer_token}"
    }, json={
        "cart_id": cart_id,
        "shipping_address": {
            "street": "123 Main St",
            "city": "Nairobi",
            "country": "Kenya"
        },
        "notes": "Cash on Delivery",
        "idempotency_key": str(uuid.uuid4())
    })
    
    if res.status_code == 201:
        print("Checkout successful! Order created.")
        order_data = res.json()["data"]
        print(f"Order ID: {order_data['id']}, Total: {order_data['total_amount']} {order_data['currency']}")
    else:
        print(f"Checkout failed: {res.text}")
        
if __name__ == "__main__":
    asyncio.run(main())
