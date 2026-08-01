import httpx
import asyncio
import json

BASE_URL = "http://localhost:8000"

async def create_products():
    # Login as vendor1
    login_response = await httpx.AsyncClient().post(
        f"{BASE_URL}/api/v1/auth/login",
        json={
            "email": "vendor1@mymeddevices.com",
            "password": "MedSecure@Pass!2024",
            "device_id": "vendor1-create-products"
        }
    )
    login_data = login_response.json()
    if not login_data.get("success"):
        print(f"Login failed: {login_data}")
        return

    access_token = login_data["data"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # Create 5 products
    products = [
        {
            "name": "Digital Blood Pressure Monitor",
            "description": "Professional digital blood pressure monitor with automatic cuff inflation",
            "category_id": "a61f4e92-3d02-49c7-a6dd-d1d5b0e2859f",
            "price": 4500,
            "stock_quantity": 50,
            "sku": "VENDOR1-BP-001",
            "brand": "MedTech Pro"
        },
        {
            "name": "Pulse Oximeter",
            "description": "Fingertip pulse oximeter for measuring oxygen saturation levels",
            "category_id": "a61f4e92-3d02-49c7-a6dd-d1d5b0e2859f",
            "price": 2500,
            "stock_quantity": 100,
            "sku": "VENDOR1-OX-001",
            "brand": "MedTech Pro"
        },
        {
            "name": "Digital Thermometer",
            "description": "Professional-grade digital thermometer with quick readings",
            "category_id": "a61f4e92-3d02-49c7-a6dd-d1d5b0e2859f",
            "price": 800,
            "stock_quantity": 200,
            "sku": "VENDOR1-TH-001",
            "brand": "MedTech Pro"
        },
        {
            "name": "Stethoscope Professional",
            "description": "High-quality stethoscope for medical professionals",
            "category_id": "a61f4e92-3d02-49c7-a6dd-d1d5b0e2859f",
            "price": 3500,
            "stock_quantity": 30,
            "sku": "VENDOR1-ST-001",
            "brand": "MedTech Pro"
        },
        {
            "name": "Medical LED Pen Light",
            "description": "LED pen light for medical examinations",
            "category_id": "c4115f18-1284-4721-bf10-5ddef3bf4a19",
            "price": 500,
            "stock_quantity": 150,
            "sku": "VENDOR1-PL-001",
            "brand": "MedTech Pro"
        }
    ]

    async with httpx.AsyncClient() as client:
        for product in products:
            response = await client.post(
                f"{BASE_URL}/api/v1/catalog/products",
                json=product,
                headers=headers
            )
            print(f"Created product: {product['name']} - Status: {response.status_code}")
            try:
                result = response.json()
                if result.get("success"):
                    product_id = result["data"].get("id")
                    print(f"  Product ID: {product_id}")
                else:
                    print(f"  Error: {result}")
            except:
                print(f"  Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(create_products())
