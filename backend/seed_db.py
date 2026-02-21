import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'vsfastion')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

async def seed():
    print("Starting seed...")
    
    # helper
    async def create_coll(name, desc):
        slug = name.lower().replace(" ", "-")
        existing = await db.collections.find_one({"slug": slug})
        if existing:
            print(f"Collection {name} exists.")
            return existing
        data = {
            "id": str(uuid.uuid4()),
            "name": name,
            "slug": slug,
            "description": desc,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.collections.insert_one(data)
        print(f"Created Collection {name}")
        return data

    async def create_cat(name, coll_id):
        slug = name.lower().replace(" ", "-")
        existing = await db.categories.find_one({"slug": slug, "collection_id": coll_id})
        if existing:
            # print(f"Category {name} exists.")
            return existing
        data = {
            "id": str(uuid.uuid4()),
            "name": name,
            "slug": slug,
            "collection_id": coll_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.categories.insert_one(data)
        print(f"Created Category {name}")
        return data
        
    async def create_prod(name, coll_id, cat_id, cat_name, price, img, qty=50):
        # Check if approx exists
        existing = await db.products.find_one({"name": name})
        if existing:
            print(f"Product {name} exists.")
            return
        
        data = {
            "id": str(uuid.uuid4()),
            "name": name,
            "category": cat_name,
            "collection_id": coll_id,
            "category_id": cat_id,
            "images": [f"/uploads/{img}"],
            "variants": {
                "colors": ["Red", "Blue", "Black"],
                "sizes": ["S", "M", "L", "XL"],
                "size_chart": "Standard"
            },
            "quantity": qty,
            "price": float(price),
            "is_trending": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.products.insert_one(data)
        print(f"Created Product {name}")

    # 1. Men
    men = await create_coll("Men", "Men's Fashion")
    shirt = await create_cat("Shirts", men["id"])
    jeans = await create_cat("Jeans", men["id"])
    
    await create_prod("Classic White Shirt", men["id"], shirt["id"], "Shirts", 1299, "sample3.jpg")
    await create_prod("Blue Denim Jeans", men["id"], jeans["id"], "Jeans", 1999, "sample4.jpg")
    
    # 2. Women
    women = await create_coll("Women", "Women's Fashion")
    # Add some specific standard ones
    saree = await create_cat("Sarees", women["id"])
    kurti = await create_cat("Kurtis", women["id"])
    
    await create_prod("Elegant Silk Saree", women["id"], saree["id"], "Sarees", 4500, "sample1.jpg")
    await create_prod("Embroidered Kurti", women["id"], kurti["id"], "Kurtis", 899, "sample2.jpg")
    
    # 3. Kids
    kids = await create_coll("Kids", "Kids Collection")
    dresses = await create_cat("Dresses", kids["id"])
    
    await create_prod("Floral Summer Frock", kids["id"], dresses["id"], "Dresses", 699, "sample5.jpg")

    print("Seed complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
