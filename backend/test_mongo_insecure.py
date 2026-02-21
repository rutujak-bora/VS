from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_conn():
    try:
        url = os.environ.get('MONGO_URL')
        print(f"Connecting to {url[:20]}...")
        # Try with allowing invalid certs
        client = AsyncIOMotorClient(url, tlsAllowInvalidCertificates=True)
        await client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB using tlsAllowInvalidCertificates!")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
