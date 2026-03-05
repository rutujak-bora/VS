import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

mongo_url = 'mongodb+srv://vsfashiiiion:Vs12345@vs1.gtpkake.mongodb.net/'

async def test():
    try:
        print("Testing with certifi.where()...")
        c = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
        info = await c.server_info()
        print(f"MongoDB OK - version: {info.get('version')}")
    except Exception as e:
        print(f"MongoDB FAILED: {e}")

asyncio.run(test())
