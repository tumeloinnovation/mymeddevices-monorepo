import httpx
import asyncio
import sys

BASE_URL = "http://localhost:8000"

async def create_customer_order():
    """Create an order as customer with 4 products (2 from each vendor) using cash on delivery"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Login as customer
        print("1. Logging in as customer...")
        response = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "customer@mymeddevices.com",
                "password": "Secure@Pass!2024",
                "device_id": "customer-order"
            }
        )
        result = response.json()
        if not result.get("success"):
            print(f"Login failed: {result}")
            return

        customer_token = result["data"]["access_token"]
        print("  ✓ Customer logged in")
        headers = {"Authorization": f"Bearer {customer_token}"}

        # First get the published products from the storefront
        print("2. Getting available products from storefront...")
        response = await client.get(f"{BASE_URL}/api/v1/storefront/products")
        products_data = response.json()
        products = products_data.get("products", [])

        # Filter to get 4 products (2 from each vendor)
        vendor1_products = [p for p in products if p.get("vendor_id") == "9e08bca9-d4fc-44a7-abf7-e7e28d33037c"][:2]
        vendor2_products = [p for p in products if p.get("vendor_id") != "9e08bca9-d4fc-44a7-abf7-e7e28d33037c"][:2]

        selected_products = vendor1_products + vendor2_products
        print(f"  Selected {len(selected_products)} products:")
        for p in selected_products:
            print(f"    - {p['name']} (KES {p['price']})")

        # Add products to cart
        print("3. Adding products to cart...")
        for product in selected_products:
            response = await client.post(
                f"{BASE_URL}/api/v1/shopping/cart/items",
                json={
                    "product_id": product["id"],
                    "quantity": 1
                },
                headers=headers
            )
            if response.status_code == 201:
                print(f"  ✓ Added: {product['name']}")
            else:
                print(f"  ✗ Failed: {product['name']} - {response.text}")

        # Get cart to verify
        response = await client.get(f"{BASE_URL}/api/v1/shopping/cart", headers=headers)
        cart = response.json()
        print(f"\n4. Cart: {cart.get('item_count', 0)} items, Total: KES {cart.get('total_amount', 0)}")

        # Add customer address for delivery
        print("5. Adding customer address...")
        response = await client.post(
            f"{BASE_URL}/api/v1/customers/me/addresses",
            json={
                "address_line1": "123 Garden Estate Road",
                "address_line2": "Apartment 4B",
                "city": "Nairobi",
                "region": "Nairobi County",
                "postal_code": "00100",
                "country": "KE",
                "is_default": True,
                "address_type": "shipping"
            },
            headers=headers
        )
        if response.status_code == 201:
            print("  ✓ Address added")
            address_data = response.json()
            address_id = address_data.get("data", {}).get("id")
        else:
            print(f"  ✗ Failed to add address: {response.text}")
            address_id = None

        # Place order with cash on delivery
        print("6. Placing order with Cash on Delivery...")
        order_data = {
            "shipping_address_id": address_id,
            "payment_method": "cash_on_delivery",
            "customer_notes": "Please deliver between 9am and 5pm. Call upon arrival."
        }

        response = await client.post(
            f"{BASE_URL}/api/v1/shopping/orders",
            json=order_data,
            headers=headers
        )

        if response.status_code == 201:
            order = response.json().get("data", {})
            print(f"  ✓ Order created successfully!")
            print(f"    Order ID: {order.get('order_number')}")
            print(f"    Total: KES {order.get('total_amount')}")
            print(f"    Payment: Cash on Delivery")
            print(f"    Status: {order.get('status')}")

            # Get order details to verify
            order_id = order.get("id")
            response = await client.get(
                f"{BASE_URL}/api/v1/shopping/orders/{order_id}",
                headers=headers
            )
            order_details = response.json().get("data", {})

            print(f"\n7. Order Details:")
            print(f"    Items: {len(order_details.get('items', []))}")
            for item in order_details.get("items", []):
                print(f"      - {item.get('product_name')} x {item.get('quantity')}")

            return order_id
        else:
            print(f"  ✗ Order failed: {response.text}")
            return None

if __name__ == "__main__":
    order_id = asyncio.run(create_customer_order())
    if order_id:
        print(f"\n✓ Order created successfully with ID: {order_id}")
