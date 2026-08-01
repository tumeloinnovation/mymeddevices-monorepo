import httpx
import asyncio
import sys

BASE_URL = "http://localhost:8000"

async def publish_products():
    """Publish products from both vendors so they can be purchased"""
    # Get vendor1 and vendor2 tokens
    vendor1_login = await httpx.AsyncClient().post(
        f"{BASE_URL}/api/v1/auth/login",
        json={
            "email": "vendor1@mymeddevices.com",
            "password": "MedSecure@Pass!2024",
            "device_id": "vendor1-publish"
        }
    )
    vendor1_token = vendor1_login.json()["data"]["access_token"]

    vendor2_login = await httpx.AsyncClient().post(
        f"{BASE_URL}/api/v1/auth/login",
        json={
            "email": "vendor2@mymeddevices.com",
            "password": "SecureHealth@2024",
            "device_id": "vendor2-publish"
        }
    )
    vendor2_token = vendor2_login.json()["data"]["access_token"]

    # Get products for vendor1 and vendor2
    async with httpx.AsyncClient() as client:
        # Get vendor1 products
        response = await client.get(
            f"{BASE_URL}/api/v1/catalog/products",
            headers={"Authorization": f"Bearer {vendor1_token}"}
        )
        vendor1_products = response.json().get("products", [])

        # Get vendor2 products
        response = await client.get(
            f"{BASE_URL}/api/v1/catalog/products",
            headers={"Authorization": f"Bearer {vendor2_token}"}
        )
        vendor2_products = response.json().get("products", [])

        print(f"Vendor1 has {len(vendor1_products)} products")
        print(f"Vendor2 has {len(vendor2_products)} products")

        # Publish 2 products from each vendor (4 total for the order)
        products_to_publish = [
            (vendor1_token, vendor1_products[0]["id"], vendor1_products[0]["name"]),  # Digital Blood Pressure Monitor
            (vendor1_token, vendor1_products[1]["id"], vendor1_products[1]["name"]),  # Pulse Oximeter
            (vendor2_token, vendor2_products[0]["id"], vendor2_products[0]["name"]),  # Surgical Steel Scalpel
            (vendor2_token, vendor2_products[1]["id"], vendor2_products[1]["name"]),  # Medical Examination Gloves
        ]

        for token, product_id, product_name in products_to_publish:
            response = await client.patch(
                f"{BASE_URL}/api/v1/catalog/products/{product_id}",
                json={"status": "published"},
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                print(f"  ✓ Published: {product_name}")
            else:
                print(f"  ✗ Failed to publish {product_name}: {response.text}")

        print("\n✓ Products published!")

if __name__ == "__main__":
    asyncio.run(publish_products())
