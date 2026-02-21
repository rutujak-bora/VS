from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def check_data():
    try:
        url = os.environ.get('MONGO_URL')
        db_name = os.environ.get('DB_NAME')
        client = AsyncIOMotorClient(url, tlsAllowInvalidCertificates=True)
        db = client[db_name]
        
        print("Checking latest order...")
        latest_order = await db.orders.find().sort("order_date", -1).to_list(1)
        if latest_order:
            order = latest_order[0]
            print(f"Order ID: {order.get('id')}")
            print(f"Customer: {order.get('customer_name')} ({order.get('customer_email')})")
            print(f"Date: {order.get('order_date')}")
            print(f"Items: {len(order.get('items', []))}")
        else:
            print("No orders found.")
            
        print("\nChecking latest contact message...")
        latest_contact = await db.contact_messages.find().sort("created_at", -1).to_list(1)
        if latest_contact:
            contact = latest_contact[0]
            print(f"Name: {contact.get('name')}")
            print(f"Email: {contact.get('email')}")
            print(f"Message: {contact.get('message')}")
        else:
            print("No contact messages found.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_data())
