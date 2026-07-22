#!/usr/bin/env python3
"""
Comprehensive Integration Test Script for MyMedDevices
Tests the full workflow:
1. Reset database.
2. Login default admin.
3. Register and approve 2 vendors.
4. Let each vendor create 5 products with attributes & images.
5. Let admin approve (publish) these products.
6. Verify products are visible on storefront.
7. Register customer, browse, add to cart, checkout, place COD order.
8. Vendor ships order items, Admin completes delivery.
"""

import asyncio
import sys
import uuid
import httpx
import subprocess
from pathlib import Path
from sqlalchemy import select

# Add parent directory to sys.path so we can import database session & models
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import AsyncSessionLocal
from app.domains.auth.models.user import User
from app.domains.auth.models.otp import OTP
from app.domains.vendor.models.vendor_profile import VendorProfile

BASE_URL = "http://localhost:8000"

# Minimal PNG pixel for image uploads
PIXEL_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06"
    b"\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x01\x00\x00\xff\xff"
    b"\x03\x00\x00\x06\x00\x05\x57\xbf\xab\xcc\x00\x00\x00\x00IEND\xaeB`\x82"
)


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def log_step(step_name: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}=== {step_name} ==={Colors.END}")


def log_success(msg: str):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")


def log_error(msg: str):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")


def log_info(msg: str):
    print(f"{Colors.YELLOW}→ {msg}{Colors.END}")


async def get_otp_code(email: str, purpose: str = "verification") -> str:
    """Retrieve the latest unused OTP code from the database."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(OTP).join(User, OTP.user_id == User.id)
            .where(User.email == email, OTP.purpose == purpose, OTP.is_used == False)
            .order_by(OTP.created_at.desc())
        )
        otp_record = result.scalar_one_or_none()
        assert otp_record is not None, f"OTP code not found in DB for {email}!"
        return otp_record.code


async def main():
    log_step("CLEAN DATABASE")
    # Clean and re-initialize the developer database
    log_info("Running database reset script...")
    backend_dir = Path(__file__).resolve().parent.parent
    result = subprocess.run(
        [sys.executable, "scripts/initialize_dev_db.py"],
        cwd=backend_dir,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        log_error("Failed to initialize database!")
        print(result.stdout)
        print(result.stderr)
        sys.exit(1)
    log_success("Database cleaned and default categories & admin seeded.")

    async with httpx.AsyncClient() as client:
        # Step 1: Login Admin
        log_step("STEP 1: Create / Login Admin")
        admin_login_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "admin@mymeddevices.com",
                "password": "Admin123!",
                "device_id": "test-admin-device",
                "device_name": "Test Integration Runner"
            }
        )
        assert admin_login_resp.status_code == 200, f"Admin login failed: {admin_login_resp.text}"
        admin_token = admin_login_resp.json()["data"]["access_token"]
        log_success("Logged in as Admin.")

        # Get seeded categories
        cat_resp = await client.get(f"{BASE_URL}/api/v1/catalog/categories")
        assert cat_resp.status_code == 200
        categories = cat_resp.json()
        category_id = categories[0]["id"]
        log_info(f"Using category: {categories[0]['name']} (ID: {category_id})")

        # Step 2: Register & Approve 2 Vendors
        log_step("STEP 2: Register & Approve 2 Vendors")
        vendors = []
        for i in range(1, 3):
            name_prefix = f"Vendor{i}"
            email = f"vend_{name_prefix.lower()}_{uuid.uuid4().hex[:4]}@temp.mymeddevices.com"
            password = "VendorPass123!"

            log_info(f"Registering {name_prefix} ({email})...")
            # Initiate
            init_resp = await client.post(
                f"{BASE_URL}/api/v1/auth/register/initiate",
                json={"email": email, "role": "vendor"}
            )
            assert init_resp.status_code == 200, f"Initiate failed: {init_resp.text}"

            # Verify email / OTP
            otp_code = await get_otp_code(email)
            log_info(f"Retrieved OTP code: {otp_code}. Verifying...")
            verify_resp = await client.post(
                f"{BASE_URL}/api/v1/otp/verify",
                json={"email": email, "code": otp_code, "purpose": "verification"}
            )
            assert verify_resp.status_code == 200, f"OTP Verification failed: {verify_resp.text}"

            # Complete registration
            complete_resp = await client.post(
                f"{BASE_URL}/api/v1/auth/register/complete",
                json={
                    "email": email,
                    "password": password,
                    "first_name": name_prefix,
                    "last_name": "Supplier",
                    "phone": f"+25471111111{i}",
                    "company_name": f"{name_prefix} Medical Devices Ltd",
                    "address_street": f"Medical Road {i}, Nairobi",
                    "latitude": -1.3000 + (i * 0.01),
                    "longitude": 36.8000 + (i * 0.01)
                }
            )
            assert complete_resp.status_code == 200, f"Complete failed: {complete_resp.text}"
            vendor_user_id = complete_resp.json()["data"]["id"]

            # Admin approves vendor
            log_info(f"Admin approving {name_prefix} user ID: {vendor_user_id}...")
            approve_resp = await client.post(
                f"{BASE_URL}/api/v1/vendors/admin/{vendor_user_id}/approve",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert approve_resp.status_code == 200, f"Vendor approval failed: {approve_resp.text}"

            # Log in as vendor
            login_resp = await client.post(
                f"{BASE_URL}/api/v1/auth/login",
                json={
                    "email": email,
                    "password": password,
                    "device_id": f"device-vend-{i}",
                    "device_name": "Vendor Portal App"
                }
            )
            assert login_resp.status_code == 200, f"Vendor login failed: {login_resp.text}"
            vendor_token = login_resp.json()["data"]["access_token"]
            
            # Fetch vendor profile ID
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(VendorProfile).where(VendorProfile.user_id == uuid.UUID(vendor_user_id))
                )
                profile = result.scalar_one()
                vendor_profile_id = str(profile.id)

            vendors.append({
                "name": name_prefix,
                "token": vendor_token,
                "profile_id": vendor_profile_id,
                "email": email
            })
            log_success(f"{name_prefix} registered, verified, approved, and logged in.")

        # Step 3: Vendors Create Products (5 products each)
        log_step("STEP 3: Vendors Create Products (5 each)")
        all_created_products = []
        for vendor in vendors:
            log_info(f"Vendor {vendor['name']} creating 5 products...")
            for idx in range(1, 6):
                prod_name = f"{vendor['name']} Device {idx}"
                sku = f"SKU-{vendor['name'].upper()}-{idx}-{uuid.uuid4().hex[:4].upper()}"
                price = 1000.0 * idx + (100.0 if vendor['name'] == "Vendor2" else 0.0)
                
                # 1. Create product (draft)
                prod_data = {
                    "name": prod_name,
                    "category_id": category_id,
                    "description": f"This is a detailed medical product description for {prod_name} that must be at least fifty characters long to pass completeness checks.",
                    "short_description": f"Short description for {prod_name}",
                    "sku": sku,
                    "price": price,
                    "base_price": price * 0.8,
                    "stock_quantity": 50,
                    "stock_status": "instock",
                    "track_inventory": True,
                    "brand": f"{vendor['name']} Brand",
                    "specifications": {"warranty": f"{idx} Year", "origin": "Kenya", "sterility": "Sterile"}
                }
                
                create_resp = await client.post(
                    f"{BASE_URL}/api/v1/catalog/products",
                    headers={"Authorization": f"Bearer {vendor['token']}"},
                    json=prod_data
                )
                assert create_resp.status_code == 201, f"Product creation failed: {create_resp.text}"
                product_id = create_resp.json()["id"]

                # 2. Upload image
                files = {"file": (f"img-{idx}.png", PIXEL_PNG, "image/png")}
                img_resp = await client.post(
                    f"{BASE_URL}/api/v1/catalog/products/{product_id}/images",
                    headers={"Authorization": f"Bearer {vendor['token']}"},
                    files=files
                )
                assert img_resp.status_code == 201, f"Image upload failed: {img_resp.text}"

                # 3. Vendor verifies product completeness (moves to pending_review)
                verify_resp = await client.post(
                    f"{BASE_URL}/api/v1/catalog/products/{product_id}/verify",
                    headers={"Authorization": f"Bearer {vendor['token']}"}
                )
                assert verify_resp.status_code == 200, f"Verification failed: {verify_resp.text}"

                # 4. Admin approves (publishes) product
                publish_resp = await client.post(
                    f"{BASE_URL}/api/v1/catalog/products/{product_id}/publish",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                assert publish_resp.status_code == 200, f"Admin approval/publish failed: {publish_resp.text}"

                all_created_products.append({
                    "id": product_id,
                    "name": prod_name,
                    "price": price,
                    "vendor": vendor['name']
                })
                log_info(f"  - Created & Approved: {prod_name} (Price: KES {price})")

        log_success("Total of 10 products successfully created, verified, and approved by admin.")

        # Step 4: Ensure storefront visibility
        log_step("STEP 4: Verify Storefront Visibility")
        store_resp = await client.get(f"{BASE_URL}/api/v1/storefront/products")
        assert store_resp.status_code == 200, f"Storefront query failed: {store_resp.text}"
        storefront_products = store_resp.json()["products"]
        log_info(f"Number of storefront products returned: {len(storefront_products)}")
        
        # Verify all products are visible
        storefront_ids = {p["id"] for p in storefront_products}
        for cp in all_created_products:
            assert cp["id"] in storefront_ids, f"Product {cp['name']} (ID: {cp['id']}) not visible in storefront!"
        log_success("All 10 products are visible to storefront users.")

        # Step 5: Register & Login Customer
        log_step("STEP 5: Register & Login Customer")
        cust_email = f"customer_{uuid.uuid4().hex[:4]}@temp.mymeddevices.com"
        cust_password = "CustomerPass123!"

        log_info(f"Registering customer {cust_email}...")
        init_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/register/initiate",
            json={"email": cust_email, "role": "customer"}
        )
        assert init_resp.status_code == 200

        otp_code = await get_otp_code(cust_email)
        log_info(f"Retrieved customer OTP: {otp_code}. Verifying...")
        verify_resp = await client.post(
            f"{BASE_URL}/api/v1/otp/verify",
            json={"email": cust_email, "code": otp_code, "purpose": "verification"}
        )
        assert verify_resp.status_code == 200

        complete_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/register/complete",
            json={
                "email": cust_email,
                "password": cust_password,
                "first_name": "Alice",
                "last_name": "Smith",
                "phone": "+254733333333"
            }
        )
        assert complete_resp.status_code == 200

        cust_login_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": cust_email,
                "password": cust_password,
                "device_id": "cust-device-01",
                "device_name": "Mobile Web browser"
            }
        )
        assert cust_login_resp.status_code == 200
        cust_token = cust_login_resp.json()["data"]["access_token"]
        log_success("Customer successfully registered, verified, and logged in.")

        # Step 6: Shopping (Add one item from Vendor 1 and make an order)
        log_step("STEP 6: Buy One Item from Vendor 1")
        vendor_1_product = [p for p in all_created_products if p["vendor"] == "Vendor1"][0]
        log_info(f"Selected product: {vendor_1_product['name']} (ID: {vendor_1_product['id']})")

        cust_headers = {"Authorization": f"Bearer {cust_token}"}
        
        # Add to cart
        add_cart_resp = await client.post(
            f"{BASE_URL}/api/v1/shopping/cart/items",
            headers=cust_headers,
            json={"product_id": vendor_1_product["id"], "quantity": 1}
        )
        assert add_cart_resp.status_code == 200, f"Cart add failed: {add_cart_resp.text}"
        cart_id = add_cart_resp.json()["data"]["cart_id"]
        log_info(f"Added item to cart. Cart ID: {cart_id}")

        # View Cart (simulating UI view cart before checkout)
        view_cart_resp = await client.get(f"{BASE_URL}/api/v1/shopping/cart/my", headers=cust_headers)
        assert view_cart_resp.status_code == 200, f"View cart failed: {view_cart_resp.status_code} - {view_cart_resp.text}"
        log_info("Viewed cart successfully.")

        # Checkout
        checkout_payload = {
            "cart_id": cart_id,
            "shipping_address": {
                "full_name": "Alice Smith",
                "street": "100 Ngong Road",
                "city": "Nairobi",
                "country": "Kenya",
                "phone": "+254733333333"
            }
        }
        checkout_resp = await client.post(
            f"{BASE_URL}/api/v1/shopping/checkout",
            headers=cust_headers,
            json=checkout_payload
        )
        assert checkout_resp.status_code == 201, f"Checkout failed: {checkout_resp.text}"
        order_id = checkout_resp.json()["data"]["id"]
        log_success(f"Order created. Order ID: {order_id}")

        # Pay via Cash On Delivery
        pay_resp = await client.post(
            f"{BASE_URL}/api/v1/shopping/payments/process-mock",
            headers=cust_headers,
            json={"order_id": order_id, "payment_method": "cash_on_delivery"}
        )
        assert pay_resp.status_code == 200
        log_success("Mock payment processed.")

        # Step 7: Vendor & Admin complete the delivery process
        log_step("STEP 7: Complete Delivery Process")
        
        # 1. Admin transitions order to 'processing'
        log_info("Admin updating order status to 'processing'...")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        proc_resp = await client.patch(
            f"{BASE_URL}/api/v1/admin/shopping/orders/{order_id}/status",
            headers=admin_headers,
            json={"status": "processing"}
        )
        assert proc_resp.status_code == 200, f"Processing update failed: {proc_resp.text}"
        log_success("Admin marked order status as 'processing'.")

        # 2. Vendor 1 views order items
        vendor_1 = vendors[0]
        v1_headers = {"Authorization": f"Bearer {vendor_1['token']}"}
        v1_orders_resp = await client.get(f"{BASE_URL}/api/v1/vendor/orders", headers=v1_headers)
        assert v1_orders_resp.status_code == 200
        v1_orders = v1_orders_resp.json()["data"]["items"]
        
        # Find our order and item ID
        target_order = [o for o in v1_orders if o["id"] == order_id][0]
        item_id = target_order["items"][0]["id"]
        log_info(f"Vendor 1 found order item ID: {item_id}")

        # 3. Vendor 1 updates order item status to shipped
        ship_resp = await client.patch(
            f"{BASE_URL}/api/v1/vendor/orders/{order_id}/items/{item_id}/status",
            headers=v1_headers,
            json={"status": "shipped"}
        )
        assert ship_resp.status_code == 200, f"Ship update failed: {ship_resp.text}"
        log_success("Vendor 1 marked item status as 'shipped'.")

        # 4. Admin transitions order to 'shipped'
        log_info("Admin updating order status to 'shipped'...")
        shipped_resp = await client.patch(
            f"{BASE_URL}/api/v1/admin/shopping/orders/{order_id}/status",
            headers=admin_headers,
            json={"status": "shipped"}
        )
        assert shipped_resp.status_code == 200, f"Shipped update failed: {shipped_resp.text}"
        log_success("Admin marked order status as 'shipped'.")

        # 5. Admin completes order delivery
        log_info("Admin updating order status to 'delivered'...")
        delivery_resp = await client.patch(
            f"{BASE_URL}/api/v1/admin/shopping/orders/{order_id}/status",
            headers=admin_headers,
            json={"status": "delivered"}
        )
        assert delivery_resp.status_code == 200, f"Delivery update failed: {delivery_resp.text}"
        log_success("Admin marked entire order status as 'delivered'.")

        # Verify order is delivered
        order_status_resp = await client.get(
            f"{BASE_URL}/api/v1/shopping/orders/{order_id}/status",
            headers=cust_headers
        )
        assert order_status_resp.status_code == 200
        final_status = order_status_resp.json()["data"]["status"]
        assert final_status == "delivered", f"Expected 'delivered', got '{final_status}'"
        log_success(f"Confirmed: Final order status is: '{final_status}'")

        print(f"\n{Colors.BOLD}{Colors.GREEN}🎉 End-to-end integration test successfully complete and verified! 🎉{Colors.END}\n")

if __name__ == "__main__":
    asyncio.run(main())
