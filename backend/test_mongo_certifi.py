from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
import certifi
from dotenv import load_dotenv

load_dotenv()

async def test_conn():
    try:
        url = os.environ.get('MONGO_URL')
        print(f"Connecting to {url[:20]}...")
        # Try with certifi certificates
        client = AsyncIOMotorClient(url, tlsCAFile=certifi.where())
        await client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB using certifi!")
    except Exception as e:
        print(f"Connection failed with certifi: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
