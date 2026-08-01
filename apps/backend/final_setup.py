import asyncio
import httpx
from app.core.database import engine
from sqlalchemy import text

async def final_setup():
    """Final setup: publish products and create complete order"""

    # Step 1: Publish products in database
    print("=== STEP 1: Publishing Products ===")
    async with engine.begin() as conn:
        v1_result = await conn.execute(text("SELECT id FROM vendor_profiles WHERE user_id = '9c488fcd-33e4-4bfa-b7b4-73d80ca38246'"))
        v1_profile_id = v1_result.scalar()

        v2_result = await conn.execute(text("SELECT id FROM vendor_profiles WHERE user_id = 'd16c4711-39f8-468f-9c2c-a9772b955501'"))
        v2_profile_id = v2_result.scalar()

        # Get 2 products from each vendor
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

    # Step 2: Create customer order
    print("\n=== STEP 2: Creating Customer Order ===")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Login as customer
        customer_login = await client.post(
            "http://localhost:8000/api/v1/auth/login",
            json={
                "email": "customer@mymeddevices.com",
                "password": "Secure@Pass!2024",
                "device_id": "customer-final"
            }
        )
        customer_data = customer_login.json()
        if not customer_data.get("success"):
            print(f"Customer login failed: {customer_data}")
            return None

        customer_token = customer_data["data"]["access_token"]
        headers = {"Authorization": f"Bearer {customer_token}"}
        print(f"  ✓ Customer logged in")

        # Get current cart (or create new)
        cart_response = await client.get("http://localhost:8000/api/v1/shopping/cart", headers=headers)
        cart = cart_response.json()

        # Clear existing cart items if any
        if cart.get("items"):
            print(f"  Clearing existing cart ({len(cart['items'])} items)...")
            for item in cart["items"]:
                await client.delete(
                    f"http://localhost:8000/api/v1/shopping/cart/items/{item['id']}",
                    headers=headers
                )

        # Get published products
        products_response = await client.get("http://localhost:8000/api/v1/storefront/products")
        products_data = products_response.json()
        products = products_data.get("products", [])

        print(f"  Available products: {len(products)}")
        if len(products) < 4:
            print("  ✗ Not enough products available!")
            return None

        # Add 4 products to cart (2 from each vendor)
        print("  Adding products to cart:")
        for product in products[:4]:
            response = await client.post(
                "http://localhost:8000/api/v1/shopping/cart/items",
                json={"product_id": product["id"], "quantity": 1},
                headers=headers
            )
            result = response.json()
            if result.get("success"):
                print(f"    ✓ Added: {product['name']}")
            else:
                print(f"    ✗ Failed: {product['name']}")

        # Get updated cart
        cart_response = await client.get("http://localhost:8000/api/v1/shopping/cart", headers=headers)
        cart = cart_response.json()
        cart_id = cart.get("id")
        print(f"  Cart ID: {cart_id}")
        print(f"  Items: {len(cart.get('items', []))}")
        print(f"  Total: KES {cart.get('total_amount', 0)}")

        # Create order via checkout
        print("\n=== STEP 3: Creating Order ===")
        order_data = {
            "cart_id": cart_id,
            "shipping_address": {
                "full_name": "Test Customer",
                "street": "123 Garden Estate Road",
                "city": "Nairobi",
                "state": "Nairobi County",
                "country": "Kenya",
                "phone": "+254712345678",
                "payment_method": "cash_on_delivery",
                "payment_method_title": "Cash on Delivery"
            },
            "notes": "Please deliver between 9am and 5pm. Call upon arrival."
        }

        checkout_response = await client.post(
            "http://localhost:8000/api/v1/shopping/checkout",
            json=order_data,
            headers=headers
        )

        if checkout_response.status_code == 201:
            order_result = checkout_response.json()
            order = order_result.get("data", {})
            print(f"  ✓ Order Created Successfully!")
            print(f"    Order ID: {order.get('id')}")
            print(f"    Order Number: {order.get('order_number')}")
            print(f"    Status: {order.get('status')}")
            print(f"    Total: KES {order.get('total_amount')}")
            print(f"    Payment: Cash on Delivery")

            order_id = order.get("id")

            # Display order items
            print(f"\n  Order Items ({len(order.get('items', []))}):")
            for item in order.get("items", []):
                print(f"    - {item.get('product_name')} x {item.get('quantity')} = KES {item.get('total_price')}")

            # Step 4: Simulate delivery process
            print("\n=== STEP 4: Simulating Delivery Process ===")

            # Login as admin
            admin_login = await client.post(
                "http://localhost:8000/api/v1/auth/login",
                json={
                    "email": "admin@mymeddevices.com",
                    "password": "Admin123!",
                    "device_id": "admin-delivery"
                }
            )
            admin_token = admin_login.json()["data"]["access_token"]
            admin_headers = {"Authorization": f"Bearer {admin_token}"}

            # Update order status through delivery stages
            stages = [
                ("processing", "Order processing started"),
                ("confirmed", "Order confirmed by vendor"),
                ("shipped", "Order shipped to customer location"),
                ("out_for_delivery", "Order out for delivery"),
                ("delivered", "Order delivered to customer location")
            ]

            for stage, description in stages:
                response = await client.patch(
                    f"http://localhost:8000/api/v1/admin/shopping/orders/{order_id}/status",
                    json={"status": stage},
                    headers=admin_headers
                )
                if response.status_code == 200:
                    print(f"  ✓ {description}")
                else:
                    print(f"  ✗ Failed: {description}")
                    print(f"    Error: {response.text[:100]}")

            # Verify final status
            final_order_response = await client.get(
                f"http://localhost:8000/api/v1/shopping/orders/{order_id}",
                headers=headers
            )
            final_order = final_order_response.json().get("data", {})

            print(f"\n=== FINAL RESULT ===")
            print(f"  Order ID: {final_order.get('id')}")
            print(f"  Order Number: {final_order.get('order_number')}")
            print(f"  Final Status: {final_order.get('status')}")
            print(f"  Payment Method: Cash on Delivery")
            print(f"  Shipping Address: {final_order.get('shipping_address', {}).get('street', 'N/A')}")
            print(f"  Total Amount: KES {final_order.get('total_amount')}")

            return order_id
        else:
            print(f"  ✗ Order creation failed:")
            print(f"    {checkout_response.text[:300]}")
            return None

if __name__ == "__main__":
    result = asyncio.run(final_setup())
    print(f"\n✓✓✓ SETUP COMPLETE! ✓✓✓")
    print(f"Final Order ID: {result}")
