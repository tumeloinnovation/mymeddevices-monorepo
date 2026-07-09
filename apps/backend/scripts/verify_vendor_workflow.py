#!/usr/bin/env python3
"""
Vendor Workflow Verification Script

This script verifies the complete vendor workflow using API calls only:
1. Vendor registration
2. Admin approval
3. Product creation
4. Multi-vendor checkout
5. Vendor data isolation
6. Vendor order fulfillment

Run with: uv run python scripts/verify_vendor_workflow.py
"""
import asyncio
import sys
import uuid
import httpx


# Configuration
BASE_URL = "http://localhost:8000"


class Colors:
    """Terminal colors for output."""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_success(msg):
    """Print success message."""
    print(f"{Colors.GREEN}{Colors.BOLD}✓{Colors.END} {msg}")


def print_error(msg):
    """Print error message."""
    print(f"{Colors.RED}{Colors.BOLD}✗{Colors.END} {msg}")


def print_info(msg):
    """Print info message."""
    print(f"{Colors.BLUE}{Colors.BOLD}→{Colors.END} {msg}")


def print_section(msg):
    """Print section header."""
    print(f"\n{Colors.BOLD}{Colors.BLUE}═══ {msg} ═══{Colors.END}\n")


async def test_vendor_workflow():
    """Test the complete vendor workflow using API calls only."""

    print_section("VENDOR WORKFLOW VERIFICATION")

    tokens = {}

    try:
        # ========================================================================
        # STEP 1: CREATE ADMIN USER
        # ========================================================================
        print_section("STEP 1: Create Admin User")

        async with httpx.AsyncClient() as client:
            admin_email = f"admin-test-{uuid.uuid4().hex[:6]}@example.com"

            # Register admin
            response = await client.post(
                f"{BASE_URL}/api/v1/auth/register",
                json={
                    "email": admin_email,
                    "password": "Admin123!",
                    "first_name": "Admin",
                    "last_name": "User"
                }
            )

            if response.status_code not in [200, 201]:
                print_error(f"Admin registration failed: {response.text}")
                return False

            # Login as admin
            response = await client.post(
                f"{BASE_URL}/api/v1/auth/login",
                json={
                    "email": admin_email,
                    "password": "Admin123!",
                    "device_id": "test_device",
                    "device_name": "Test Runner"
                }
            )

            if response.status_code != 200:
                print_error(f"Admin login failed: {response.text}")
                return False

            tokens["admin"] = response.json()["data"]["access_token"]
            # We'll need the user ID later, so store it
            tokens["admin_id"] = response.json()["data"]["user"]["id"]

        print_success(f"Admin user created and logged in: {admin_email}")

        # ========================================================================
        # STEP 2: REGISTER VENDOR A
        # ========================================================================
        print_section("STEP 2: Register Vendor A")

        async with httpx.AsyncClient() as client:
            vendor_a_email = f"vendor-test-a-{uuid.uuid4().hex[:6]}@example.com"
            vendor_a_data = {
                "email": vendor_a_email,
                "password": "Vendor123!",
                "company_name": "Vendor A Medical Supplies",
                "phone": "+254711111111"
            }

            response = await client.post(
                f"{BASE_URL}/api/v1/auth/register/vendor",
                json=vendor_a_data
            )

            if response.status_code == 201:
                print_success(f"Vendor A registered: {vendor_a_email}")
                tokens["vendor_a_user_id"] = response.json()["data"]["id"]
            else:
                print_error(f"Vendor A registration failed: {response.text}")
                return False

        # ========================================================================
        # STEP 3: APPROVE VENDOR A
        # ========================================================================
        print_section("STEP 3: Approve Vendor A")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/v1/vendors/admin/{tokens['vendor_a_user_id']}/approve",
                headers={"Authorization": f"Bearer {tokens['admin']}"},
                json={}
            )

            if response.status_code == 200:
                print_success("Vendor A approved by admin")
            else:
                print_error(f"Vendor A approval failed: {response.text}")
                return False

        # ========================================================================
        # STEP 4: VENDOR A CREATES PRODUCT
        # ========================================================================
        print_section("STEP 4: Vendor A Creates Product")

        async with httpx.AsyncClient() as client:
            # Login as vendor to get token
            login_response = await client.post(
                f"{BASE_URL}/api/v1/auth/login",
                json={
                    "email": vendor_a_email,
                    "password": "Vendor123!",
                    "device_id": "test_device",
                    "device_name": "Test Runner"
                }
            )

            if login_response.status_code == 200:
                tokens["vendor_a"] = login_response.json()["data"]["access_token"]
            else:
                print_error(f"Vendor A login failed: {login_response.text}")
                return False

            # Get a category first
            response = await client.get(
                f"{BASE_URL}/api/v1/catalog/categories"
            )

            if response.status_code != 200:
                print_error("Failed to get categories")
                return False

            categories = response.json().get("data", response.json())
            if isinstance(categories, dict) and "categories" in categories:
                categories = categories["categories"]

            if not categories or len(categories) == 0:
                print_error("No categories available")
                return False

            category_id = categories[0]["id"]

            # Create product
            product_a_data = {
                "category_id": category_id,
                "name": "Vendor A Product",
                "sku": f"VA-{uuid.uuid4().hex[:6]}",
                "base_price": 1000.0,
                "short_description": "Product from Vendor A",
                "description": "This is a test product from Vendor A",
                "stock_quantity": 100
            }

            response = await client.post(
                f"{BASE_URL}/api/v1/catalog/products",
                json=product_a_data,
                headers={"Authorization": f"Bearer {tokens['vendor_a']}"}
            )

            if response.status_code in [200, 201]:
                product_response = response.json()
                # Handle both response formats
                tokens["product_a_id"] = product_response.get("id") or product_response.get("data", {}).get("id")
                print_success(f"Vendor A created product: {tokens['product_a_id']}")
            else:
                print_error(f"Product creation failed: {response.text}")
                return False

        # ========================================================================
        # STEP 5: CREATE AND APPROVE VENDOR B
        # ========================================================================
        print_section("STEP 5: Create and Approve Vendor B")

        async with httpx.AsyncClient() as client:
            vendor_b_email = f"vendor-test-b-{uuid.uuid4().hex[:6]}@example.com"
            vendor_b_data = {
                "email": vendor_b_email,
                "password": "Vendor123!",
                "company_name": "Vendor B Medical Supplies",
                "phone": "+254722222222"
            }

            # Register Vendor B
            response = await client.post(
                f"{BASE_URL}/api/v1/auth/register/vendor",
                json=vendor_b_data
            )

            if response.status_code != 201:
                print_error(f"Vendor B registration failed: {response.text}")
                return False

            vendor_b_user_id = response.json()["data"]["id"]

            # Approve Vendor B
            response = await client.post(
                f"{BASE_URL}/api/v1/vendors/admin/{vendor_b_user_id}/approve",
                headers={"Authorization": f"Bearer {tokens['admin']}"},
                json={}
            )

            if response.status_code != 200:
                print_error(f"Vendor B approval failed: {response.text}")
                return False

            print_success(f"Vendor B created and approved: {vendor_b_email}")

        # ========================================================================
        # STEP 6: VENDOR B CREATES PRODUCT
        # ========================================================================
        print_section("STEP 6: Vendor B Creates Product")

        async with httpx.AsyncClient() as client:
            # Login as Vendor B
            login_response = await client.post(
                f"{BASE_URL}/api/v1/auth/login",
                json={
                    "email": vendor_b_email,
                    "password": "Vendor123!",
                    "device_id": "test_device",
                    "device_name": "Test Runner"
                }
            )

            if login_response.status_code != 200:
                print_error(f"Vendor B login failed: {login_response.text}")
                return False

            tokens["vendor_b"] = login_response.json()["data"]["access_token"]

            # Create product
            product_b_data = {
                "category_id": category_id,
                "name": "Vendor B Product",
                "sku": f"VB-{uuid.uuid4().hex[:6]}",
                "base_price": 2000.0,
                "short_description": "Product from Vendor B",
                "description": "This is a test product from Vendor B",
                "stock_quantity": 100
            }

            response = await client.post(
                f"{BASE_URL}/api/v1/catalog/products",
                json=product_b_data,
                headers={"Authorization": f"Bearer {tokens['vendor_b']}"}
            )

            if response.status_code in [200, 201]:
                product_response = response.json()
                tokens["product_b_id"] = product_response.get("id") or product_response.get("data", {}).get("id")
                print_success(f"Vendor B created product: {tokens['product_b_id']}")
            else:
                print_error(f"Product creation failed: {response.text}")
                return False

        # ========================================================================
        # STEP 7: CUSTOMER CREATES ORDER WITH BOTH PRODUCTS
        # ========================================================================
        print_section("STEP 7: Customer Creates Multi-Vendor Order")

        async with httpx.AsyncClient() as client:
            # Create customer
            customer_email = f"customer-test-{uuid.uuid4().hex[:6]}@example.com"

            register_response = await client.post(
                f"{BASE_URL}/api/v1/auth/register",
                json={
                    "email": customer_email,
                    "password": "Customer123!",
                    "first_name": "Test",
                    "last_name": "Customer"
                }
            )

            if register_response.status_code not in [200, 201]:
                print_error(f"Customer registration failed: {register_response.text}")
                return False

            # Login as customer
            login_response = await client.post(
                f"{BASE_URL}/api/v1/auth/login",
                json={
                    "email": customer_email,
                    "password": "Customer123!",
                    "device_id": "test_device",
                    "device_name": "Test Runner"
                }
            )

            if login_response.status_code != 200:
                print_error(f"Customer login failed: {login_response.text}")
                return False

            tokens["customer"] = login_response.json()["data"]["access_token"]
            customer_user_id = login_response.json()["data"]["user"]["id"]

            # Create cart with both products
            cart_response = await client.post(
                f"{BASE_URL}/api/v1/shopping/cart",
                headers={"Authorization": f"Bearer {tokens['customer']}"}
            )

            if cart_response.status_code not in [200, 201]:
                print_error(f"Cart creation failed: {cart_response.text}")
                return False

            cart_data = cart_response.json().get("data", cart_response.json())
            cart_id = cart_data.get("id") if isinstance(cart_data, dict) else None

            if not cart_id:
                # Try to get cart ID from response
                cart_id = cart_response.json().get("cart_id")

            # Add products to cart
            for product_id in [tokens["product_a_id"], tokens["product_b_id"]]:
                item_response = await client.post(
                    f"{BASE_URL}/api/v1/shopping/cart/items",
                    json={
                        "cart_id": cart_id,
                        "product_id": product_id,
                        "quantity": 1
                    },
                    headers={"Authorization": f"Bearer {tokens['customer']}"}
                )

                if item_response.status_code not in [200, 201]:
                    print_error(f"Failed to add product {product_id} to cart: {item_response.text}")
                    # Continue anyway, might be a different endpoint structure

            # Checkout
            checkout_data = {
                "cart_id": cart_id,
                "shipping_address": {
                    "address_line1": "123 Test Street",
                    "city": "Nairobi",
                    "country": "KE"
                }
            }

            response = await client.post(
                f"{BASE_URL}/api/v1/shopping/checkout",
                json=checkout_data,
                headers={"Authorization": f"Bearer {tokens['customer']}"}
            )

            if response.status_code in [200, 201]:
                order_response = response.json().get("data", response.json())
                tokens["order_id"] = order_response.get("id") if isinstance(order_response, dict) else None
                print_success(f"Customer created order with both vendor products: {tokens['order_id']}")
            else:
                print_error(f"Checkout failed: {response.text}")
                return False

        # ========================================================================
        # STEP 8: VERIFY VENDOR A DATA ISOLATION
        # ========================================================================
        print_section("STEP 8: Verify Vendor A Data Isolation")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BASE_URL}/api/v1/vendor/orders",
                headers={"Authorization": f"Bearer {tokens['vendor_a']}"}
            )

            if response.status_code == 200:
                orders_data = response.json()["data"]
                orders = orders_data.get("orders", orders_data)

                if len(orders) == 1:
                    order = orders[0]
                    items = order.get("items", [])

                    # Vendor A should see only their product
                    if len(items) == 1 and items[0]["product_id"] == tokens["product_a_id"]:
                        print_success("Vendor A sees only their product")
                        print_info(f"  - Items visible to Vendor A: {len(items)}")
                        print_info(f"  - Total for Vendor A: {order.get('total_amount', 'N/A')}")
                    else:
                        print_error("Vendor A data isolation failed - can see other vendor's items")
                        print_info(f"  - Expected 1 item, got {len(items)}")
                        if items:
                            print_info(f"  - Item product IDs: {[i.get('product_id') for i in items]}")
                        return False
                else:
                    print_error(f"Vendor A should see 1 order, saw {len(orders)}")
                    return False
            else:
                print_error(f"Vendor A order fetch failed: {response.text}")
                return False

        # ========================================================================
        # STEP 9: VERIFY VENDOR B DATA ISOLATION
        # ========================================================================
        print_section("STEP 9: Verify Vendor B Data Isolation")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BASE_URL}/api/v1/vendor/orders",
                headers={"Authorization": f"Bearer {tokens['vendor_b']}"}
            )

            if response.status_code == 200:
                orders_data = response.json()["data"]
                orders = orders_data.get("orders", orders_data)

                if len(orders) == 1:
                    order = orders[0]
                    items = order.get("items", [])

                    # Vendor B should see only their product
                    if len(items) == 1 and items[0]["product_id"] == tokens["product_b_id"]:
                        print_success("Vendor B sees only their product")
                        print_info(f"  - Items visible to Vendor B: {len(items)}")
                        print_info(f"  - Total for Vendor B: {order.get('total_amount', 'N/A')}")
                    else:
                        print_error("Vendor B data isolation failed - can see other vendor's items")
                        print_info(f"  - Expected 1 item, got {len(items)}")
                        if items:
                            print_info(f"  - Item product IDs: {[i.get('product_id') for i in items]}")
                        return False
                else:
                    print_error(f"Vendor B should see 1 order, saw {len(orders)}")
                    return False
            else:
                print_error(f"Vendor B order fetch failed: {response.text}")
                return False

        # ========================================================================
        # STEP 10: VENDOR A UPDATES ITEM STATUS
        # ========================================================================
        print_section("STEP 10: Vendor A Updates Item Status")

        async with httpx.AsyncClient() as client:
            # First get the order to find Vendor A's item ID
            response = await client.get(
                f"{BASE_URL}/api/v1/vendor/orders",
                headers={"Authorization": f"Bearer {tokens['vendor_a']}"}
            )

            if response.status_code == 200:
                orders_data = response.json()["data"]
                orders = orders_data.get("orders", orders_data)

                if len(orders) > 0 and len(orders[0].get("items", [])) > 0:
                    vendor_a_item_id = orders[0]["items"][0]["id"]

                    # Update status to shipped
                    response = await client.patch(
                        f"{BASE_URL}/api/v1/vendor/orders/{tokens['order_id']}/items/{vendor_a_item_id}/status",
                        json={"status": "shipped"},
                        headers={"Authorization": f"Bearer {tokens['vendor_a']}"}
                    )

                    if response.status_code == 200:
                        print_success("Vendor A updated item status to 'shipped'")
                    else:
                        print_error(f"Status update failed: {response.text}")
                        return False
                else:
                    print_error("No order items found for Vendor A")
                    return False
            else:
                print_error(f"Failed to get Vendor A orders: {response.text}")
                return False

        # ========================================================================
        # STEP 11: VERIFY STATUS UPDATE DIDN'T AFFECT VENDOR B
        # ========================================================================
        print_section("STEP 11: Verify Vendor B's Item Unchanged")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BASE_URL}/api/v1/vendor/orders",
                headers={"Authorization": f"Bearer {tokens['vendor_b']}"}
            )

            if response.status_code == 200:
                orders_data = response.json()["data"]
                orders = orders_data.get("orders", orders_data)
                order = orders[0]
                items = order.get("items", [])

                # Vendor B's item should still be pending
                if len(items) == 1 and items[0].get("fulfillment_status") == "pending":
                    print_success("Vendor B's item status unchanged (still pending)")
                else:
                    print_error("Vendor B's item status was affected by Vendor A's update")
                    return False
            else:
                print_error(f"Vendor B order fetch failed: {response.text}")
                return False

        # ========================================================================
        # SUMMARY
        # ========================================================================
        print_section("VERIFICATION COMPLETE")

        print_success("All vendor workflow tests passed!")
        print_info("\nVerified functionality:")
        print_info("  ✓ Vendor registration")
        print_info("  ✓ Admin approval workflow")
        print_info("  ✓ Product creation by vendors")
        print_info("  ✓ Multi-vendor checkout")
        print_info("  ✓ Vendor data isolation")
        print_info("  ✓ Vendor-specific order management")
        print_info("  ✓ Per-item fulfillment status updates")

        return True

    except Exception as e:
        print_error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_vendor_workflow())
    sys.exit(0 if success else 1)
