import asyncio
from app.core.database import engine
from sqlalchemy import text

async def get_vendor_otp():
    async with engine.connect() as conn:
        # Get the user ID
        result = await conn.execute(text("SELECT id FROM users WHERE email = 'vendor1@mymeddevices.com'"))
        row = result.first()
        if row:
            user_id = row[0]
            # Get the latest OTP
            result = await conn.execute(text(f"SELECT code FROM otps WHERE user_id = '{user_id}' AND is_used = false ORDER BY created_at DESC LIMIT 1"))
            otp_row = result.first()
            if otp_row:
                print(f'OTP: {otp_row[0]}')
            else:
                print('No OTP found')

asyncio.run(get_vendor_otp())
