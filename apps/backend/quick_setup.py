import asyncio
import httpx
from app.core.database import engine
from sqlalchemy import text

async def quick_setup():
    """Quick setup: publish products in database and create order"""
    # First, publish products directly in database for testing
    print("Publishing products in database...")
    async with engine.begin() as conn:
        # Get vendor profile IDs
        v1_result = await conn.execute(text("SELECT id FROM vendor_profiles WHERE user_id = '9c488fcd-33e4-4bfa-b7b4-73d80ca38246'"))
        v1_profile_id = v1_result.scalar()

        v2_result = await conn.execute(text("SELECT id FROM vendor_profiles WHERE user_id = 'd16c4711-39f8-468f-9c2c-a9772b955501'"))
        v2_profile_id = v2_result.scalar()

        # Update 2 products from each vendor to published and verified
        # Get product IDs first
        v1_products = await conn.execute(text(f"SELECT id FROM products WHERE vendor_id = '{v1_profile_id}' ORDER BY created_at LIMIT 2"))
        v1_ids = [row[0] for row in v1_products]

        v2_products = await conn.execute(text(f"SELECT id FROM products WHERE vendor_id = '{v2_profile_id}' ORDER BY created_at LIMIT 2"))
        v2_ids = [row[0] for row in v2_products]

        all_ids = v1_ids + v2_ids

        if all_ids:
            ids_list = ', '.join(f"'{id}'" for id in all_ids)
            result = await conn.execute(text(f'''
                UPDATE products
                SET status = 'published', is_verified = true, updated_at = NOW()
                WHERE id IN ({ids_list})
                RETURNING name
            '''))
            print("Published products:")
            for row in result:
                print(f"  ✓ {row[0]}")

    # Now create the customer order
    print("\nCreating customer order...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Login as customer
        customer_login = await client.post(
            "http://localhost:8000/api/v1/auth/login",
            json={
                "email": "customer@mymeddevices.com",
                "password": "Secure@Pass!2024",
                "device_id": "customer-final-order"
            }
        )
        customer_token = customer_login.json()["data"]["access_token"]

        # Get published products
        response = await client.get("http://localhost:8000/api/v1/storefront/products")
        products_data = response.json()
        products = products_data.get("products", [])

        print(f"Available products: {len(products)}")
        for p in products[:4]:
            print(f"  - {p['name']} (KES {p['price']})")

        if len(products) < 4:
            print("Not enough products available!")
            return None

        # Add 4 products to cart
        print("\nAdding products to cart...")
        for product in products[:4]:
            response = await client.post(
                "http://localhost:8000/api/v1/shopping/cart/items",
                json={"product_id": product["id"], "quantity": 1},
                headers={"Authorization": f"Bearer {customer_token}"}
            )
            if response.status_code == 201:
                print(f"  ✓ Added: {product['name']}")
            else:
                print(f"  ✗ Failed: {product['name']} - {response.text[:100]}")

        # Get cart
        response = await client.get(
            "http://localhost:8000/api/v1/shopping/cart",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        cart = response.json()
        print(f"\nCart: {cart.get('item_count')} items, Total: KES {cart.get('total_amount')}")

        # Add customer address
        print("\nAdding shipping address...")
        response = await client.post(
            "http://localhost:8000/api/v1/customers/me/addresses",
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
            print(f"  ✓ Address added: {address_id}")
        else:
            print(f"  Address failed: {response.text[:100]}")
            # Try without address_id if endpoint doesn't exist
            address_id = None

        # Create order with cash on delivery
        print("\nPlacing order with Cash on Delivery...")
        order_data = {
            "payment_method": "cash_on_delivery",
            "customer_notes": "Please deliver between 9am and 5pm. Call upon arrival."
        }

        if address_id:
            order_data["shipping_address_id"] = address_id

        order_response = await client.post(
            "http://localhost:8000/api/v1/shopping/orders",
            json=order_data,
            headers={"Authorization": f"Bearer {customer_token}"}
        )

        if order_response.status_code == 201:
            order = order_response.json().get("data", {})
            print(f"  ✓ Order Created!")
            print(f"    Order Number: {order.get('order_number')}")
            print(f"    Order ID: {order.get('id')}")
            print(f"    Total: KES {order.get('total_amount')}")
            print(f"    Status: {order.get('status')}")
            print(f"    Payment: Cash on Delivery")

            order_id = order.get("id")

            # Get order details
            response = await client.get(
                f"http://localhost:8000/api/v1/shopping/orders/{order_id}",
                headers={"Authorization": f"Bearer {customer_token}"}
            )
            order_details = response.json().get("data", {})

            print(f"\n  Order Items ({len(order_details.get('items', []))}):")
            for item in order_details.get("items", []):
                vendor_name = item.get("vendor_name", "Unknown")
                print(f"    - {item.get('product_name')} x {item.get('quantity')} (Vendor: {vendor_name})")

            # Simulate delivery process
            print(f"\nSimulating delivery process...")
            admin_login = await client.post(
                "http://localhost:8000/api/v1/auth/login",
                json={
                    "email": "admin@mymeddevices.com",
                    "password": "Admin123!",
                    "device_id": "admin-delivery"
                }
            )
            admin_token = admin_login.json()["data"]["access_token"]

            # Update order status through delivery stages
            stages = [
                ("processing", "Order processing started"),
                ("confirmed", "Order confirmed"),
                ("shipped", "Order shipped to customer"),
                ("out_for_delivery", "Order out for delivery"),
                ("delivered", "Order delivered to customer location")
            ]

            for stage, description in stages:
                response = await client.patch(
                    f"http://localhost:8000/api/v1/admin/shopping/orders/{order_id}/status",
                    json={"status": stage},
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                if response.status_code == 200:
                    print(f"  ✓ {description}")
                else:
                    print(f"  ✗ Failed: {description} - {response.text[:100]}")

            # Verify final status
            response = await client.get(
                f"http://localhost:8000/api/v1/shopping/orders/{order_id}",
                headers={"Authorization": f"Bearer {customer_token}"}
            )
            final_order = response.json().get("data", {})
            print(f"\n  Final Order Status: {final_order.get('status')}")
            print(f"  Delivered to: {final_order.get('shipping_address', {}).get('address_line1', 'N/A')}")

            return order_id
        else:
            print(f"  ✗ Order failed: {order_response.text[:200]}")
            return None

if __name__ == "__main__":
    result = asyncio.run(quick_setup())
    print(f"\n✓ Setup complete! Order ID: {result}")
