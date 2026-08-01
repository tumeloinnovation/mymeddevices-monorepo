import httpx
import asyncio

BASE_URL = "http://localhost:8000"

async def setup_and_create_order():
    """Complete setup: publish products and create customer order"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get admin token to approve products
        admin_login = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "admin@mymeddevices.com",
                "password": "Admin123!",
                "device_id": "admin-approve-products"
            }
        )
        admin_token = admin_login.json()["data"]["access_token"]

        # Get all vendor products and update them with details
        vendor1_login = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "vendor1@mymeddevices.com",
                "password": "MedSecure@Pass!2024",
                "device_id": "v1"
            }
        )
        vendor1_token = vendor1_login.json()["data"]["access_token"]

        vendor2_login = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "vendor2@mymeddevices.com",
                "password": "SecureHealth@2024",
                "device_id": "v2"
            }
        )
        vendor2_token = vendor2_login.json()["data"]["access_token"]

        # Update products with full details to meet 80% completeness
        products_to_update = {
            vendor1_token: [
                {"id": "4089d456-7778-47c9-b899-48a4fca04047", "name": "Digital Blood Pressure Monitor", "short_description": "Professional digital BP monitor", "weight_kg": 0.5, "specifications": '{"accuracy": "+/-3mmHg", "memory": "60 readings"}'},
                {"id": "9e54b829-4bee-4e86-884c-f101a5f575ca", "name": "Pulse Oximeter", "short_description": "Fingertip oximeter", "weight_kg": 0.1, "specifications": '{"range": "35-100%", "accuracy": "+/-2%"}'}
            ],
            vendor2_token: [
                {"id": "7171d959-c88e-4f05-9ea3-eb89e4039371", "name": "Surgical Steel Scalpel", "short_description": "Premium surgical scalpel", "weight_kg": 0.05, "specifications": '{"material": "Stainless Steel", "sterile": true}'},
                {"id": "3e0cfd7f-ca7a-4cd3-90e6-e5f31efd7e90", "name": "Medical Examination Gloves", "short_description": "Box of 100 gloves", "weight_kg": 0.3, "specifications": '{"material": "Latex-free", "quantity": 100}'}
            ]
        }

        print("Updating products with full details...")
        for token, products in products_to_update.items():
            for product in products:
                response = await client.patch(
                    f"{BASE_URL}/api/v1/catalog/products/{product['id']}",
                    json={
                        "short_description": product["short_description"],
                        "weight_kg": product["weight_kg"],
                        "specifications": product["specifications"],
                        "meta_description": f"High-quality {product['name']} for medical professionals"
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                if response.status_code == 200:
                    print(f"  ✓ Updated: {product['name']}")
                else:
                    print(f"  ✗ Failed: {product['name']} - {response.text[:100]}")

        # Now verify and publish
        print("\nVerifying and publishing products...")
        for token, products in products_to_update.items():
            for product in products:
                # Verify
                response = await client.post(
                    f"{BASE_URL}/api/v1/catalog/products/{product['id']}/verify",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if response.status_code == 200:
                    print(f"  ✓ Verified: {product['name']}")

                    # Publish
                    response = await client.post(
                        f"{BASE_URL}/api/v1/catalog/products/{product['id']}/publish",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    if response.status_code == 200:
                        print(f"    ✓ Published: {product['name']}")
                    else:
                        print(f"    ✗ Publish failed: {response.text[:100]}")
                else:
                    print(f"  ✗ Verify failed for {product['name']}: {response.text[:100]}")

        # Now create customer order
        print("\nCreating customer order...")
        customer_login = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "customer@mymeddevices.com",
                "password": "Secure@Pass!2024",
                "device_id": "customer-order"
            }
        )
        customer_token = customer_login.json()["data"]["access_token"]

        # Get published products from storefront
        response = await client.get(f"{BASE_URL}/api/v1/storefront/products")
        storefront_data = response.json()
        products = storefront_data.get("products", [])

        if len(products) < 4:
            print(f"  Only {len(products)} products available, need 4")
            return

        # Select 4 products
        selected = products[:4]
        print(f"  Selected {len(selected)} products for cart")

        # Add to cart
        for product in selected:
            response = await client.post(
                f"{BASE_URL}/api/v1/shopping/cart/items",
                json={"product_id": product["id"], "quantity": 1},
                headers={"Authorization": f"Bearer {customer_token}"}
            )
            if response.status_code == 201:
                print(f"    ✓ Added: {product['name']}")
            else:
                print(f"    ✗ Failed: {product['name']}")

        # Add customer address
        response = await client.post(
            f"{BASE_URL}/api/v1/customers/me/addresses",
            json={
                "address_line1": "123 Garden Estate Road",
                "city": "Nairobi",
                "region": "Nairobi",
                "postal_code": "00100",
                "country": "KE"
            },
            headers={"Authorization": f"Bearer {customer_token}"}
        )

        address_id = None
        if response.status_code == 201:
            address_id = response.json().get("data", {}).get("id")
            print(f"  ✓ Address added")
        else:
            print(f"  Address failed: {response.text[:100]}")

        # Create order
        print("\nPlacing order...")
        order_response = await client.post(
            f"{BASE_URL}/api/v1/shopping/orders",
            json={
                "shipping_address_id": address_id,
                "payment_method": "cash_on_delivery",
                "customer_notes": "Please deliver between 9am-5pm"
            },
            headers={"Authorization": f"Bearer {customer_token}"}
        )

        if order_response.status_code == 201:
            order = order_response.json().get("data", {})
            print(f"  ✓ Order Created!")
            print(f"    Order ID: {order.get('order_number')}")
            print(f"    Total: KES {order.get('total_amount')}")
            print(f"    Status: {order.get('status')}")
            print(f"    Payment: Cash on Delivery")

            # Simulate delivery
            order_id = order.get("id")
            print(f"\nSimulating order delivery...")

            # Login as admin to update order status
            admin_headers = {"Authorization": f"Bearer {admin_token}"}

            # Process through stages
            stages = ["processing", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"]
            for stage in stages:
                response = await client.patch(
                    f"{BASE_URL}/api/v1/admin/shopping/orders/{order_id}/status",
                    json={"status": stage},
                    headers=admin_headers
                )
                if response.status_code == 200:
                    print(f"  ✓ Order status: {stage}")
                else:
                    print(f"  ✗ Failed to set status {stage}: {response.text[:100]}")

            return order_id
        else:
            print(f"  ✗ Order failed: {order_response.text[:200]}")
            return None

if __name__ == "__main__":
    result = asyncio.run(setup_and_create_order())
    print(f"\nFinal result: Order ID = {result}")
