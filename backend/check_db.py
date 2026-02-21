from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def check_data():
    try:
        url = os.environ.get('MONGO_URL')
        db_name = os.environ.get('DB_NAME')
        client = AsyncIOMotorClient(url)
        db = client[db_name]
        
        products_count = await db.products.count_documents({})
        collections_count = await db.collections.count_documents({})
        categories_count = await db.categories.count_documents({})
        
        print(f"Products: {products_count}")
        print(f"Collections: {collections_count}")
        print(f"Categories: {categories_count}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_data())
