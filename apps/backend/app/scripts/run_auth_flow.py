import asyncio
import httpx
import uuid
import sys
import json
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.domains.auth.models.user import User
from app.domains.auth.models.otp import OTP
from app.domains.shared.models.outbox import OutboxEvent
from app.core.security import get_password_hash

BASE_URL = "http://localhost:8000"

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

    # 2. Seed Admin User in the DB
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
            await db.refresh(admin)
            print("Admin user seeded successfully!")
        else:
            print("Admin user already exists in DB.")

    async with httpx.AsyncClient() as client:
        # 3. Customer registration flow
        print("\n--- Step 2: Registering Customer ---")
        cust_email = f"cust_{uuid.uuid4().hex[:6]}@temp.mymeddevices.com"
        
        # Initiate registration
        reg_init_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/register/initiate",
            json={"email": cust_email, "role": "customer"}
        )
        assert reg_init_resp.status_code == 200, f"Failed register initiate: {reg_init_resp.text}"
        print(f"Customer registration initiated for {cust_email}.")

        # Retrieve OTP code from DB
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(OTP).join(User, OTP.user_id == User.id)
                .where(User.email == cust_email, OTP.purpose == "verification", OTP.is_used == False)
            )
            otp_record = result.scalar_one_or_none()
            assert otp_record is not None, "OTP code not found in DB!"
            cust_otp_code = otp_record.code
            print(f"Found verification OTP in DB: {cust_otp_code}")

        # Verify OTP
        otp_verify_resp = await client.post(
            f"{BASE_URL}/api/v1/otp/verify",
            json={"email": cust_email, "code": cust_otp_code, "purpose": "verification"}
        )
        assert otp_verify_resp.status_code == 200, f"OTP verification failed: {otp_verify_resp.text}"
        print("OTP verified successfully.")

        # Complete registration
        reg_complete_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/register/complete",
            json={
                "email": cust_email,
                "password": "CustPassword123!",
                "first_name": "Jane",
                "last_name": "Smith",
                "phone": "+254711111111"
            }
        )
        assert reg_complete_resp.status_code == 200, f"Registration complete failed: {reg_complete_resp.text}"
        print("Customer registration completed.")

        # 4. Vendor registration flow
        print("\n--- Step 3: Registering Vendor ---")
        vend_email = f"vend_{uuid.uuid4().hex[:6]}@temp.mymeddevices.com"

        # Initiate registration
        v_init_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/register/initiate",
            json={"email": vend_email, "role": "vendor"}
        )
        assert v_init_resp.status_code == 200, f"Failed vendor register initiate: {v_init_resp.text}"
        print(f"Vendor registration initiated for {vend_email}.")

        # Retrieve OTP code from DB
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(OTP).join(User, OTP.user_id == User.id)
                .where(User.email == vend_email, OTP.purpose == "verification", OTP.is_used == False)
            )
            otp_record = result.scalar_one_or_none()
            assert otp_record is not None, "Vendor OTP code not found in DB!"
            vend_otp_code = otp_record.code
            print(f"Found vendor verification OTP in DB: {vend_otp_code}")

        # Verify OTP
        v_verify_resp = await client.post(
            f"{BASE_URL}/api/v1/otp/verify",
            json={"email": vend_email, "code": vend_otp_code, "purpose": "verification"}
        )
        assert v_verify_resp.status_code == 200, f"Vendor OTP verification failed: {v_verify_resp.text}"
        print("Vendor OTP verified successfully.")

        # Complete registration
        v_complete_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/register/complete",
            json={
                "email": vend_email,
                "password": "VendPassword123!",
                "first_name": "Bob",
                "last_name": "Vendor",
                "phone": "+254722222222",
                "company_name": "Bob Medical Supplies Ltd",
                "address_street": "Ngong Road, Nairobi",
                "latitude": -1.3000,
                "longitude": 36.8000
            }
        )
        assert v_complete_resp.status_code == 200, f"Vendor registration complete failed: {v_complete_resp.text}"
        vendor_id = v_complete_resp.json()["data"]["id"]
        print(f"Vendor registration completed. User ID: {vendor_id}.")

        # 5. Try logging in as the unapproved vendor
        print("\n--- Step 4: Login as Pending Vendor (Should Fail) ---")
        v_fail_login = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": vend_email,
                "password": "VendPassword123!",
                "device_id": "test-device",
                "device_name": "Test Python Script"
            }
        )
        assert v_fail_login.status_code == 403, f"Expected 403 Forbidden for pending approval, got {v_fail_login.status_code}"
        print("Blocked correctly! Vendor cannot log in until approved.")

        # 6. Log in as Admin to get Token and approve Vendor
        print("\n--- Step 5: Admin Approves Vendor ---")
        admin_login_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "admin@example.com",
                "password": "Test123!",
                "device_id": "admin-test-device",
                "device_name": "Test Python Script"
            }
        )
        assert admin_login_resp.status_code == 200, f"Admin login failed: {admin_login_resp.text}"
        admin_access_token = admin_login_resp.json()["data"]["access_token"]
        print("Admin logged in successfully.")

        # Approve vendor
        approve_headers = {"Authorization": f"Bearer {admin_access_token}"}
        approve_resp = await client.post(
            f"{BASE_URL}/api/v1/vendors/admin/{vendor_id}/approve",
            headers=approve_headers
        )
        assert approve_resp.status_code == 200, f"Vendor approval failed: {approve_resp.text}"
        print("Vendor approved successfully by Admin.")

        # 7. Log in as approved Vendor
        print("\n--- Step 6: Log in as Approved Vendor ---")
        v_login_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": vend_email,
                "password": "VendPassword123!",
                "device_id": "test-device",
                "device_name": "Test Python Script"
            }
        )
        assert v_login_resp.status_code == 200, f"Approved vendor login failed: {v_login_resp.text}"
        vendor_data = v_login_resp.json()["data"]
        vendor_access_token = vendor_data["access_token"]
        vendor_refresh_token = vendor_data["refresh_token"]
        print("Vendor logged in successfully after approval.")

        # 8. Admin Register Driver
        print("\n--- Step 7: Admin Registers Driver ---")
        driver_email = f"driver_{uuid.uuid4().hex[:6]}@temp.mymeddevices.com"
        create_driver_resp = await client.post(
            f"{BASE_URL}/api/v1/admin/users/staff?email={driver_email}&role=driver&first_name=Fast&last_name=Rider",
            headers=approve_headers
        )
        assert create_driver_resp.status_code == 200, f"Admin create driver failed: {create_driver_resp.text}"
        print(f"Driver user {driver_email} created via Admin channel.")

        # Retrieve driver invite code and temporary password from outbox
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(OutboxEvent).where(
                    OutboxEvent.aggregate_type == "User",
                    OutboxEvent.event_type == "StaffInvitationCreated"
                ).order_by(OutboxEvent.created_at.desc())
            )
            outbox_record = result.scalars().first()
            assert outbox_record is not None, "Outbox event not found for staff invitation!"
            payload = outbox_record.payload
            driver_temp_pass = payload["temp_password"]
            print(f"Found driver temporary password in Outbox Event: {driver_temp_pass}")

        # Log in as Driver using temporary password
        driver_login_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": driver_email,
                "password": driver_temp_pass,
                "device_id": "driver-device",
                "device_name": "Rider Mobile App"
            }
        )
        assert driver_login_resp.status_code == 200, f"Driver login failed: {driver_login_resp.text}"
        print("Driver logged in successfully with temporary password.")

        # 9. Admin Register Worker/Staff
        print("\n--- Step 8: Admin Registers Staff ---")
        staff_email = f"staff_{uuid.uuid4().hex[:6]}@temp.mymeddevices.com"
        create_staff_resp = await client.post(
            f"{BASE_URL}/api/v1/admin/users/staff?email={staff_email}&role=worker&first_name=Office&last_name=Worker",
            headers=approve_headers
        )
        assert create_staff_resp.status_code == 200, f"Admin create staff failed: {create_staff_resp.text}"
        print(f"Staff user {staff_email} created via Admin channel.")

        # Retrieve staff temporary password from outbox
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(OutboxEvent).where(
                    OutboxEvent.aggregate_type == "User",
                    OutboxEvent.event_type == "StaffInvitationCreated"
                ).order_by(OutboxEvent.created_at.desc())
            )
            outbox_record = result.scalars().first()
            assert outbox_record is not None
            payload = outbox_record.payload
            staff_temp_pass = payload["temp_password"]
            print(f"Found staff temporary password in Outbox Event: {staff_temp_pass}")

        # Log in as Staff using temporary password
        staff_login_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": staff_email,
                "password": staff_temp_pass,
                "device_id": "staff-device",
                "device_name": "Office Terminal"
            }
        )
        assert staff_login_resp.status_code == 200, f"Staff login failed: {staff_login_resp.text}"
        print("Staff logged in successfully with temporary password.")

        # 10. Refresh token
        print("\n--- Step 9: Token Refresh Flow ---")
        refresh_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/refresh",
            json={"refresh_token": vendor_refresh_token}
        )
        assert refresh_resp.status_code == 200, f"Token refresh failed: {refresh_resp.text}"
        new_access_token = refresh_resp.json()["data"]["access_token"]
        print("Successfully refreshed access token using refresh token.")

        # 11. Customer Forgot / Reset Password
        print("\n--- Step 10: Forgot & Reset Password Flow ---")
        forgot_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/forgot-password",
            json={"email": cust_email}
        )
        assert forgot_resp.status_code == 200, f"Forgot password failed: {forgot_resp.text}"
        print(f"Password reset initiated for {cust_email}.")

        # Retrieve reset OTP code from DB
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(OTP).join(User, OTP.user_id == User.id)
                .where(User.email == cust_email, OTP.purpose == "reset_password", OTP.is_used == False)
            )
            otp_record = result.scalar_one_or_none()
            assert otp_record is not None, "Reset password OTP not found!"
            reset_otp_code = otp_record.code
            print(f"Found password reset OTP in DB: {reset_otp_code}")

        # Reset Password
        reset_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/reset-password",
            json={
                "email": cust_email,
                "code": reset_otp_code,
                "new_password": "NewCustPassword123!"
            }
        )
        assert reset_resp.status_code == 200, f"Reset password failed: {reset_resp.text}"
        print("Password reset successfully.")

        # Login with new password
        cust_login_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": cust_email,
                "password": "NewCustPassword123!",
                "device_id": "cust-device",
                "device_name": "Customer Web App"
            }
        )
        assert cust_login_resp.status_code == 200, f"Login with new password failed: {cust_login_resp.text}"
        cust_data = cust_login_resp.json()["data"]
        cust_access_token = cust_data["access_token"]
        cust_refresh_token = cust_data["refresh_token"]
        print("Customer successfully logged in using new password.")

        # 12. Logout
        print("\n--- Step 11: Logout & Blacklist Flow ---")
        logout_headers = {"Authorization": f"Bearer {cust_access_token}"}
        logout_resp = await client.post(
            f"{BASE_URL}/api/v1/auth/logout",
            json={"refresh_token": cust_refresh_token},
            headers=logout_headers
        )
        assert logout_resp.status_code == 200, f"Logout failed: {logout_resp.text}"
        print("Customer successfully logged out and tokens revoked/blacklisted.")

        print("\n🎉 All authentication flows successfully completed and verified! 🎉")

if __name__ == "__main__":
    asyncio.run(main())
