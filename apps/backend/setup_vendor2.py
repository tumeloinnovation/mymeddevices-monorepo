import httpx
import asyncio
import sys

BASE_URL = "http://localhost:8000"

async def setup_vendor2():
    """Register vendor2, verify email, approve, and create products"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: Register vendor2
        print("1. Registering vendor2...")
        response = await client.post(
            f"{BASE_URL}/api/v1/auth/register/vendor",
            json={
                "email": "vendor2@mymeddevices.com",
                "password": "SecureHealth@2024",
                "company_name": "HealthCare Solutions Ltd",
                "phone": "+254722222222",
                "first_name": "Jane",
                "last_name": "Smith",
                "address_street": "456 Medical Plaza, Nairobi",
                "latitude": -1.3025,
                "longitude": 36.8105
            }
        )

        if response.status_code == 429:
            print("Rate limit hit, waiting...")
            await asyncio.sleep(2)
            # Reset rate limits
            await client.post(f"{BASE_URL}/debug/reset-rate-limits")
            response = await client.post(
                f"{BASE_URL}/api/v1/auth/register/vendor",
                json={
                    "email": "vendor2@mymeddevices.com",
                    "password": "SecureHealth@2024",
                    "company_name": "HealthCare Solutions Ltd",
                    "phone": "+254722222222",
                    "first_name": "Jane",
                    "last_name": "Smith",
                    "address_street": "456 Medical Plaza, Nairobi",
                    "latitude": -1.3025,
                    "longitude": 36.8105
                }
            )

        result = response.json()
        if not result.get("success"):
            print(f"Registration failed: {result}")
            return

        vendor2_id = result["data"]["id"]
        print(f"  ✓ Vendor2 registered: {vendor2_id}")

        # Step 2: Get OTP and verify email
        print("2. Getting OTP for vendor2...")
        await asyncio.sleep(1)

        # Get OTP from database (using SQL query)
        from app.core.database import engine
        from sqlalchemy import text

        async with engine.connect() as conn:
            result = await conn.execute(
                text(f"SELECT code FROM otps WHERE user_id = '{vendor2_id}' AND is_used = false ORDER BY created_at DESC LIMIT 1")
            )
            otp_row = result.first()
            if otp_row:
                otp_code = otp_row[0]
                print(f"  ✓ OTP: {otp_code}")

                # Verify OTP
                response = await client.post(
                    f"{BASE_URL}/api/v1/otp/verify",
                    json={
                        "email": "vendor2@mymeddevices.com",
                        "code": otp_code,
                        "purpose": "verification"
                    }
                )
                if response.json().get("success"):
                    print("  ✓ Email verified")
                else:
                    print("  ✗ Verification failed")
                    return

        # Step 3: Login as admin and approve vendor2
        print("3. Approving vendor2 as admin...")
        admin_login = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "admin@mymeddevices.com",
                "password": "Admin123!",
                "device_id": "admin-approve-vendor2"
            }
        )
        admin_token = admin_login.json()["data"]["access_token"]

        # First get vendor2 profile ID
        response = await client.get(
            f"{BASE_URL}/api/v1/admin/users/vendors/overview",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        vendors_data = response.json()
        vendor2_profile_id = None
        for vendor in vendors_data.get("vendors", []):
            if vendor.get("email") == "vendor2@mymeddevices.com":
                # Get profile ID from a separate call
                profile_response = await client.get(
                    f"{BASE_URL}/api/v1/vendor/profile",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                # This won't work, need to get profile ID differently
                pass

        # Use the vendor approval endpoint with the vendor profile ID
        # Since we need the profile ID, let's query it directly
        async with engine.connect() as conn:
            result = await conn.execute(
                text(f"SELECT id FROM vendor_profiles WHERE user_id = '{vendor2_id}'")
            )
            profile_row = result.first()
            if profile_row:
                vendor2_profile_id = str(profile_row[0])
                print(f"  ✓ Profile ID: {vendor2_profile_id}")

                # Approve vendor
                response = await client.post(
                    f"{BASE_URL}/api/v1/vendors/admin/{vendor2_profile_id}/approve",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                if response.json().get("success"):
                    print("  ✓ Vendor2 approved")
                else:
                    print(f"  ✗ Approval failed: {response.text}")
                    return

        # Step 4: Login as vendor2 and create products
        print("4. Creating products for vendor2...")
        vendor2_login = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "vendor2@mymeddevices.com",
                "password": "SecureHealth@2024",
                "device_id": "vendor2-create-products"
            }
        )
        vendor2_token = vendor2_login.json()["data"]["access_token"]

        products = [
            {
                "name": "Surgical Steel Scalpel",
                "description": "Premium stainless steel surgical scalpel",
                "category_id": "de25e1be-edf6-46a7-98e7-b107bc49dd84",
                "price": 1500,
                "stock_quantity": 100,
                "sku": "VENDOR2-SC-001",
                "brand": "HealthCare Pro"
            },
            {
                "name": "Medical Examination Gloves",
                "description": "Box of 100 medical examination gloves",
                "category_id": "de25e1be-edf6-46a7-98e7-b107bc49dd84",
                "price": 800,
                "stock_quantity": 500,
                "sku": "VENDOR2-GL-001",
                "brand": "HealthCare Pro"
            },
            {
                "name": "Medical Mask Box",
                "description": "Box of 50 medical face masks",
                "category_id": "c4115f18-1284-4721-bf10-5ddef3bf4a19",
                "price": 500,
                "stock_quantity": 300,
                "sku": "VENDOR2-MK-001",
                "brand": "HealthCare Pro"
            },
            {
                "name": "Hospital Bed Sheet",
                "description": "Premium hospital bed sheet, durable and comfortable",
                "category_id": "4b8787b9-cb3b-481d-8c02-3bfb69f5c474",
                "price": 2000,
                "stock_quantity": 150,
                "sku": "VENDOR2-BS-001",
                "brand": "HealthCare Pro"
            },
            {
                "name": "Medical Syringe Set",
                "description": "Set of 10 sterile medical syringes",
                "category_id": "5477d5fc-d14c-4d4c-96fa-0e18ab530fac",
                "price": 600,
                "stock_quantity": 200,
                "sku": "VENDOR2-SY-001",
                "brand": "HealthCare Pro"
            }
        ]

        headers = {"Authorization": f"Bearer {vendor2_token}"}
        for product in products:
            response = await client.post(
                f"{BASE_URL}/api/v1/catalog/products",
                json=product,
                headers=headers
            )
            if response.status_code == 201:
                print(f"  ✓ Created: {product['name']}")
            else:
                print(f"  ✗ Failed: {product['name']} - {response.text}")

        print("\n✓ Vendor2 setup complete!")

if __name__ == "__main__":
    asyncio.run(setup_vendor2())
