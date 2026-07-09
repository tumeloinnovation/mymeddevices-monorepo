import asyncio
import httpx
import uuid
import sys
import json
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.domains.auth.models.user import User
from app.domains.auth.models.otp import OTP
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.catalog.models.category import Category
from app.core.security import get_password_hash

BASE_URL = "http://localhost:8000"

# Minimal PNG pixel for image uploads
PIXEL_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06"
    b"\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x01\x00\x00\xff\xff"
    b"\x03\x00\x00\x06\x00\x05\x57\xbf\xab\xcc\x00\x00\x00\x00IEND\xaeB`\x82"
)

async def get_otp_code(email: str, purpose: str = "verification") -> str:
    """Retrieve the latest unused OTP code from the database."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(OTP).join(User, OTP.user_id == User.id)
            .where(User.email == email, OTP.purpose == purpose, OTP.is_used == False)
            .order_by(OTP.created_at.desc())
        )
        otp_record = result.scalar_one_or_none()
        assert otp_record is not None, f"OTP code not found in DB for {email} ({purpose})!"
        return otp_record.code

async def reset_rate_limits(client: httpx.AsyncClient):
    """Call the development rate limit reset endpoint to prevent rate limit exceptions."""
    try:
        await client.post(f"{BASE_URL}/debug/reset-rate-limits")
    except Exception as e:
        print(f"Warning: Failed to reset rate limits: {e}")

async def register_customer(client: httpx.AsyncClient, name_prefix: str) -> str:
    """Register a new customer and return their access token."""
    await reset_rate_limits(client)
    email = f"cust_{name_prefix}_{uuid.uuid4().hex[:4]}@temp.mymeddevices.com"
    password = "CustomerPass123!"
    
    # 1. Initiate
    reg_init_resp = await client.post(
        f"{BASE_URL}/api/v1/auth/register/initiate",
        json={"email": email, "role": "customer"}
    )
    assert reg_init_resp.status_code == 200, f"Customer initiate failed: {reg_init_resp.text}"

    # 2. Get OTP
    otp_code = await get_otp_code(email)

    # 3. Verify OTP
    otp_verify_resp = await client.post(
        f"{BASE_URL}/api/v1/otp/verify",
        json={"email": email, "code": otp_code, "purpose": "verification"}
    )
    assert otp_verify_resp.status_code == 200, f"Customer OTP verification failed: {otp_verify_resp.text}"

    # 4. Complete
    reg_complete_resp = await client.post(
        f"{BASE_URL}/api/v1/auth/register/complete",
        json={
            "email": email,
            "password": password,
            "first_name": name_prefix,
            "last_name": "User",
            "phone": "+254711111111"
        }
    )
    assert reg_complete_resp.status_code == 200, f"Customer registration complete failed: {reg_complete_resp.text}"

    # 5. Login
    login_resp = await client.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={
            "email": email,
            "password": password,
            "device_id": f"device-{uuid.uuid4().hex[:6]}",
            "device_name": "E2E Test Client"
        }
    )
    assert login_resp.status_code == 200, f"Customer login failed: {login_resp.text}"
    return login_resp.json()["data"]["access_token"]

async def register_and_approve_vendor(
    client: httpx.AsyncClient, 
    admin_token: str, 
    name_prefix: str
) -> dict:
    """Register a vendor, approve them via admin, and return their access token & profile ID."""
    await reset_rate_limits(client)
    email = f"vend_{name_prefix}_{uuid.uuid4().hex[:4]}@temp.mymeddevices.com"
    password = "VendorPass123!"

    # 1. Initiate
    v_init_resp = await client.post(
        f"{BASE_URL}/api/v1/auth/register/initiate",
        json={"email": email, "role": "vendor"}
    )
    assert v_init_resp.status_code == 200, f"Vendor initiate failed: {v_init_resp.text}"

    # 2. Get OTP
    otp_code = await get_otp_code(email)

    # 3. Verify OTP
    v_verify_resp = await client.post(
        f"{BASE_URL}/api/v1/otp/verify",
        json={"email": email, "code": otp_code, "purpose": "verification"}
    )
    assert v_verify_resp.status_code == 200, f"Vendor OTP verification failed: {v_verify_resp.text}"

    # 4. Complete
    v_complete_resp = await client.post(
        f"{BASE_URL}/api/v1/auth/register/complete",
        json={
            "email": email,
            "password": password,
            "first_name": name_prefix,
            "last_name": "Supplies",
            "phone": "+254722222222",
            "company_name": f"{name_prefix} Medical Ltd",
            "address_street": "Ngong Road, Nairobi",
            "latitude": -1.3000,
            "longitude": 36.8000
        }
    )
    assert v_complete_resp.status_code == 200, f"Vendor registration complete failed: {v_complete_resp.text}"
    user_id = v_complete_resp.json()["data"]["id"]

    # 5. Admin Approve Vendor
    approve_headers = {"Authorization": f"Bearer {admin_token}"}
    approve_resp = await client.post(
        f"{BASE_URL}/api/v1/vendors/admin/{user_id}/approve",
        headers=approve_headers
    )
    assert approve_resp.status_code == 200, f"Vendor approval failed: {approve_resp.text}"

    # 6. Login
    login_resp = await client.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={
            "email": email,
            "password": password,
            "device_id": f"device-{uuid.uuid4().hex[:6]}",
            "device_name": "E2E Test Client"
        }
    )
    assert login_resp.status_code == 200, f"Vendor login failed: {login_resp.text}"
    access_token = login_resp.json()["data"]["access_token"]

    # Retrieve Vendor Profile ID from DB
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(VendorProfile).where(VendorProfile.user_id == uuid.UUID(user_id))
        )
        profile = result.scalar_one()
        vendor_profile_id = str(profile.id)

    return {
        "email": email,
        "vendor_profile_id": vendor_profile_id,
        "access_token": access_token
    }

async def upload_and_publish_product(
    client: httpx.AsyncClient,
    vendor_token: str,
    category_id: str,
    name: str,
    sku: str,
    price: float
) -> str:
    """Create, verify, and publish a product for a vendor."""
    headers = {"Authorization": f"Bearer {vendor_token}"}

    # 1. Create product (draft)
    prod_data = {
        "name": name,
        "category_id": category_id,
        "description": "This is a detailed product description that must be at least fifty characters long to pass the verification completeness score check.",
        "short_description": f"Short description for {name}",
        "sku": sku,
        "price": price,
        "base_price": round((price * 0.8) / 100) * 100.0,
        "stock_quantity": 100,
        "stock_status": "instock",
        "track_inventory": True,
        "specifications": {"warranty": "1 Year", "origin": "Kenya"},
        "brand": "MedBrand"
    }
    create_resp = await client.post(
        f"{BASE_URL}/api/v1/catalog/products",
        headers=headers,
        json=prod_data
    )
    assert create_resp.status_code == 201, f"Product creation failed: {create_resp.text}"
    product_id = create_resp.json()["id"]

    # 2. Upload image to pass completeness check
    files = {
        "file": ("pixel.png", PIXEL_PNG, "image/png")
    }
    img_resp = await client.post(
        f"{BASE_URL}/api/v1/catalog/products/{product_id}/images",
        headers=headers,
        files=files
    )
    assert img_resp.status_code == 201, f"Product image upload failed: {img_resp.text}"

    # 3. Verify product
    verify_resp = await client.post(
        f"{BASE_URL}/api/v1/catalog/products/{product_id}/verify",
        headers=headers
    )
    assert verify_resp.status_code == 200, f"Product verification failed: {verify_resp.text}"

    # 4. Publish product
    publish_resp = await client.post(
        f"{BASE_URL}/api/v1/catalog/products/{product_id}/publish",
        headers=headers
    )
    assert publish_resp.status_code == 200, f"Product publishing failed: {publish_resp.text}"

    return product_id

async def main():
    # 1. Check if backend is running
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{BASE_URL}/")
        except Exception:
            print("Error: FastAPI backend server is not running on http://localhost:8000.")
            print("Please run 'pnpm dev:backend' first to start the FastAPI server.")
            sys.exit(1)

    print("🚀 Connected to MyMedDevices FastAPI Backend.")

    # 2. Ensure Admin User Exists
    print("\n--- Step 1: Ensure Admin User Exists ---")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "admin@example.com"))
        admin = result.scalar_one_or_none()
        if not admin:
            print("Seeding admin@example.com into database...")
            admin = User(
                email="admin@example.com",
                password_hash=get_password_hash("Test123!"),
                role="admin",
                first_name="Admin",
                last_name="User",
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            await db.commit()
            print("Admin user seeded successfully!")
        else:
            print("Admin user already exists in DB.")

    async with httpx.AsyncClient() as client:
        # Get Admin token
        admin_login = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "admin@example.com",
                "password": "Test123!",
                "device_id": "admin-device",
                "device_name": "E2E Test Client"
            }
        )
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        admin_token = admin_login.json()["data"]["access_token"]
        print("Admin token obtained.")

        # Ensure a category exists
        print("\n--- Step 2: Ensure a Category Exists ---")
        categories_resp = await client.get(f"{BASE_URL}/api/v1/catalog/categories")
        assert categories_resp.status_code == 200, f"Failed to list categories: {categories_resp.text}"
        categories = categories_resp.json()
        
        if not categories:
            print("No categories found. Seeding a new category...")
            cat_data = {
                "name": "General Diagnostics",
                "slug": "general-diagnostics",
                "description": "Standard medical diagnostics equipment"
            }
            create_cat_resp = await client.post(
                f"{BASE_URL}/api/v1/catalog/categories",
                headers={"Authorization": f"Bearer {admin_token}"},
                json=cat_data
            )
            assert create_cat_resp.status_code == 201, f"Category creation failed: {create_cat_resp.text}"
            category_id = create_cat_resp.json()["id"]
            print(f"Category 'General Diagnostics' created (ID: {category_id}).")
        else:
            category_id = categories[0]["id"]
            print(f"Using existing category: {categories[0]['name']} (ID: {category_id})")

        # 3. Register and Approve Vendor A
        print("\n--- Step 3: Register and Approve Vendor A ---")
        vendor_a = await register_and_approve_vendor(client, admin_token, "VendorA")
        print(f"Vendor A registered & approved successfully. Profile ID: {vendor_a['vendor_profile_id']}.")

        # 4. Vendor A uploads, verifies, and publishes Product A
        print("\n--- Step 4: Vendor A Uploads and Publishes Product A ---")
        sku_a = f"SKU-A-{uuid.uuid4().hex[:6].upper()}"
        product_a_id = await upload_and_publish_product(
            client=client,
            vendor_token=vendor_a["access_token"],
            category_id=category_id,
            name="Stethoscope Professional Model A",
            sku=sku_a,
            price=15000.0
        )
        print(f"Product A successfully uploaded, verified, and published. Product ID: {product_a_id}")

        # 5. Register Customer 1
        print("\n--- Step 5: Register Customer 1 ---")
        customer_1_token = await register_customer(client, "Customer1")
        print("Customer 1 registered successfully.")

        # 6. Customer 1 adds Product A to cart and abandons
        print("\n--- Step 6: Customer 1 Adds Product A to Cart and Abandons Cart ---")
        cart_1_headers = {"Authorization": f"Bearer {customer_1_token}"}
        add_item_1_resp = await client.post(
            f"{BASE_URL}/api/v1/shopping/cart/items",
            headers=cart_1_headers,
            json={"product_id": product_a_id, "quantity": 1}
        )
        assert add_item_1_resp.status_code == 200, f"Add item to cart failed: {add_item_1_resp.text}"
        cart_1_id = add_item_1_resp.json()["data"]["cart_id"]
        print(f"Customer 1 added Product A to cart (Cart ID: {cart_1_id}). Cart is now abandoned.")

        # 7. Register Customer 2
        print("\n--- Step 7: Register Customer 2 ---")
        customer_2_token = await register_customer(client, "Customer2")
        print("Customer 2 registered successfully.")

        # 8. Customer 2 adds Product A to cart and completes checkout via COD
        print("\n--- Step 8: Customer 2 Buys Product A and Completes Order via Cash On Delivery ---")
        cart_2_headers = {"Authorization": f"Bearer {customer_2_token}"}
        add_item_2_resp = await client.post(
            f"{BASE_URL}/api/v1/shopping/cart/items",
            headers=cart_2_headers,
            json={"product_id": product_a_id, "quantity": 1}
        )
        assert add_item_2_resp.status_code == 200, f"Customer 2 Add item to cart failed: {add_item_2_resp.text}"
        cart_2_id = add_item_2_resp.json()["data"]["cart_id"]
        
        # Checkout
        checkout_data_2 = {
            "cart_id": cart_2_id,
            "shipping_address": {
                "full_name": "Jane Smith",
                "street": "Ngong Road",
                "city": "Nairobi",
                "country": "Kenya",
                "phone": "+254711111111"
            }
        }
        checkout_2_resp = await client.post(
            f"{BASE_URL}/api/v1/shopping/checkout",
            headers=cart_2_headers,
            json=checkout_data_2
        )
        assert checkout_2_resp.status_code == 201, f"Customer 2 checkout failed: {checkout_2_resp.text}"
        order_2_id = checkout_2_resp.json()["data"]["id"]
        print(f"Customer 2 checked out. Order Created: {order_2_id}")

        # Pay via COD (process mock payment with cash_on_delivery)
        pay_data_2 = {
            "order_id": order_2_id,
            "payment_method": "cash_on_delivery"
        }
        pay_2_resp = await client.post(
            f"{BASE_URL}/api/v1/shopping/payments/process-mock",
            headers=cart_2_headers,
            json=pay_data_2
        )
        assert pay_2_resp.status_code == 200, f"Customer 2 payment failed: {pay_2_resp.text}"
        print(f"Mock payment processed via cash_on_delivery for Order {order_2_id}.")

        # Verify Order 2 status is paid
        order_2_status_resp = await client.get(
            f"{BASE_URL}/api/v1/shopping/orders/{order_2_id}/status",
            headers=cart_2_headers
        )
        assert order_2_status_resp.status_code == 200, f"Fetch Order 2 status failed: {order_2_status_resp.text}"
        order_2_status = order_2_status_resp.json()["data"]["status"]
        assert order_2_status == "paid", f"Expected order status 'paid', got '{order_2_status}'"
        print(f"✓ Confirmed: Customer 2's Order status is '{order_2_status}'.")

        # 9. Register and Approve Vendor B & Vendor C
        print("\n--- Step 9: Register and Approve Vendor B & Vendor C ---")
        vendor_b = await register_and_approve_vendor(client, admin_token, "VendorB")
        print(f"Vendor B registered & approved. Profile ID: {vendor_b['vendor_profile_id']}")
        vendor_c = await register_and_approve_vendor(client, admin_token, "VendorC")
        print(f"Vendor C registered & approved. Profile ID: {vendor_c['vendor_profile_id']}")

        # 10. Vendor B & C upload/verify/publish products
        print("\n--- Step 10: Vendor B & Vendor C Upload and Publish Products ---")
        sku_b = f"SKU-B-{uuid.uuid4().hex[:6].upper()}"
        product_b_id = await upload_and_publish_product(
            client=client,
            vendor_token=vendor_b["access_token"],
            category_id=category_id,
            name="BP Monitor Vendor B",
            sku=sku_b,
            price=7500.0
        )
        print(f"Vendor B published Product B (ID: {product_b_id}).")

        sku_c = f"SKU-C-{uuid.uuid4().hex[:6].upper()}"
        product_c_id = await upload_and_publish_product(
            client=client,
            vendor_token=vendor_c["access_token"],
            category_id=category_id,
            name="Thermometer Vendor C",
            sku=sku_c,
            price=3200.0
        )
        print(f"Vendor C published Product C (ID: {product_c_id}).")

        # 11. Register Customer 3
        print("\n--- Step 11: Register Customer 3 ---")
        customer_3_token = await register_customer(client, "Customer3")
        print("Customer 3 registered successfully.")

        # 12. Customer 3 adds products from both Vendor B and Vendor C to cart and checks out via COD
        print("\n--- Step 12: Customer 3 Purchases Products from Both Vendors & Completes Checkout via Cash On Delivery ---")
        cart_3_headers = {"Authorization": f"Bearer {customer_3_token}"}
        
        # Add Product B
        add_b_resp = await client.post(
            f"{BASE_URL}/api/v1/shopping/cart/items",
            headers=cart_3_headers,
            json={"product_id": product_b_id, "quantity": 1}
        )
        assert add_b_resp.status_code == 200, f"Customer 3 failed to add Product B: {add_b_resp.text}"
        cart_3_id = add_b_resp.json()["data"]["cart_id"]

        # Add Product C
        add_c_resp = await client.post(
            f"{BASE_URL}/api/v1/shopping/cart/items",
            headers=cart_3_headers,
            json={"product_id": product_c_id, "quantity": 1}
        )
        assert add_c_resp.status_code == 200, f"Customer 3 failed to add Product C: {add_c_resp.text}"

        # Checkout
        checkout_data_3 = {
            "cart_id": cart_3_id,
            "shipping_address": {
                "full_name": "Bob Harrison",
                "street": "Ngong Road",
                "city": "Nairobi",
                "country": "Kenya",
                "phone": "+254733333333"
            }
        }
        checkout_3_resp = await client.post(
            f"{BASE_URL}/api/v1/shopping/checkout",
            headers=cart_3_headers,
            json=checkout_data_3
        )
        assert checkout_3_resp.status_code == 201, f"Customer 3 checkout failed: {checkout_3_resp.text}"
        order_3_id = checkout_3_resp.json()["data"]["id"]
        print(f"Customer 3 created Order: {order_3_id} (contains items from Vendor B & C).")

        # Pay via COD
        pay_data_3 = {
            "order_id": order_3_id,
            "payment_method": "cash_on_delivery"
        }
        pay_3_resp = await client.post(
            f"{BASE_URL}/api/v1/shopping/payments/process-mock",
            headers=cart_3_headers,
            json=pay_data_3
        )
        assert pay_3_resp.status_code == 200, f"Customer 3 payment failed: {pay_3_resp.text}"
        print(f"Mock payment processed via cash_on_delivery for Order {order_3_id}.")

        # Verify Order 3 status is paid
        order_3_status_resp = await client.get(
            f"{BASE_URL}/api/v1/shopping/orders/{order_3_id}/status",
            headers=cart_3_headers
        )
        assert order_3_status_resp.status_code == 200, f"Fetch Order 3 status failed: {order_3_status_resp.text}"
        order_3_status = order_3_status_resp.json()["data"]["status"]
        assert order_3_status == "paid", f"Expected order status 'paid', got '{order_3_status}'"
        print(f"✓ Confirmed: Customer 3's Order status is '{order_3_status}'.")

        # 13. Verify order visibility for Vendor B and Vendor C
        print("\n--- Step 13: Verify Order Visibility for Vendor B & Vendor C ---")
        
        # Vendor B order list check
        v_b_headers = {"Authorization": f"Bearer {vendor_b['access_token']}"}
        v_b_orders_resp = await client.get(
            f"{BASE_URL}/api/v1/vendor/orders",
            headers=v_b_headers
        )
        assert v_b_orders_resp.status_code == 200, f"Vendor B failed to list orders: {v_b_orders_resp.text}"
        v_b_orders = v_b_orders_resp.json()["data"]["items"]
        
        # Find order_3 in Vendor B's orders
        v_b_order_ids = [o["id"] for o in v_b_orders]
        assert order_3_id in v_b_order_ids, f"Order {order_3_id} not visible to Vendor B!"
        print(f"✓ Confirmed: Order {order_3_id} is visible in Vendor B's dashboard.")

        # Vendor C order list check
        v_c_headers = {"Authorization": f"Bearer {vendor_c['access_token']}"}
        v_c_orders_resp = await client.get(
            f"{BASE_URL}/api/v1/vendor/orders",
            headers=v_c_headers
        )
        assert v_c_orders_resp.status_code == 200, f"Vendor C failed to list orders: {v_c_orders_resp.text}"
        v_c_orders = v_c_orders_resp.json()["data"]["items"]

        # Find order_3 in Vendor C's orders
        v_c_order_ids = [o["id"] for o in v_c_orders]
        assert order_3_id in v_c_order_ids, f"Order {order_3_id} not visible to Vendor C!"
        print(f"✓ Confirmed: Order {order_3_id} is visible in Vendor C's dashboard.")

        print("\n🎉 All E2E scenarios successfully completed, validated, and verified! 🎉")

if __name__ == "__main__":
    asyncio.run(main())
