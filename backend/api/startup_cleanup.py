
import asyncio
from datetime import datetime, timedelta

from backend.api.signup import otp_storage, OTP_EXPIRY_MINUTES

async def startup_cleanup():
    """Cleanup expired OTPs periodically"""
    
    async def cleanup_expired_data():
        while True:
            await asyncio.sleep(300)  # Run every 5 minutes
            current_time = datetime.utcnow()
            
            # Clean expired OTPs
            expired_otps = [
                email for email, data in otp_storage.items()
                if current_time - data["timestamp"] > timedelta(minutes=OTP_EXPIRY_MINUTES)
            ]
            for email in expired_otps:
                del otp_storage[email]
    
    asyncio.create_task(cleanup_expired_data())
