#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/home/ubuntu/VS/backend/.env')

async def test():
    try:
        c = AsyncIOMotorClient(os.environ['MONGO_URL'], tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
        info = await c.server_info()
        print(f"MongoDB OK - version: {info.get('version')}")
        dbs = await c.list_database_names()
        print(f"Databases: {dbs}")
    except Exception as e:
        print(f"MongoDB FAILED: {e}")

asyncio.run(test())
