import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000/api"

async def test_order_flow():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # 1. Login or Register
        email = "test_order_user@example.com"
        password = "password123"
        
        # Try login
        res = await client.post("/auth/login", json={"email": email, "password": password})
        if res.status_code == 401:
            # Register if not exists
            print("Registering new test user...")
            res = await client.post("/auth/register", json={
                "name": "Test User",
                "mobile": "1234567890",
                "email": email,
                "password": password,
                "address": "123 Test St, Test City"
            })
        
        if res.status_code != 200:
            print(f"Auth failed: {res.text}")
            return
            
        token = res.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Logged in successfully.")

        # 2. Get a product
        res = await client.get("/products")
        products = res.json()
        if not products:
            print("No products found. Run seed first.")
            return
            
        product = products[0]
        product_id = product['id']
        initial_stock = product['quantity']
        print(f"Selected product: {product['name']} (Stock: {initial_stock})")
        
        if initial_stock < 1:
            print("Product out of stock, cannot test.")
            return

        # 3. Add to Cart
        print("Adding to cart...")
        res = await client.post("/cart/add", json={
            "product_id": product_id,
            "selected_color": product['variants']['colors'][0],
            "selected_size": product['variants']['sizes'][0],
            "quantity": 1
        }, headers=headers)
        
        if res.status_code != 200:
            print(f"Add to cart failed: {res.text}")
            return
        print("Item added to cart.")

        # 4. Check Cart
        res = await client.get("/cart", headers=headers)
        cart = res.json()
        if not cart.get('items'):
            print("Cart is empty after adding!")
            return
        print(f"Cart verification: {len(cart['items'])} item(s).")

        # 5. Place Order
        print("Placing order...")
        res = await client.post("/orders", headers=headers)
        
        if res.status_code != 200:
            print(f"Order placement failed: {res.text}")
            return
        
        order_data = res.json()
        print(f"Order placed successfully! ID: {order_data['message']}")

        # 6. Verify Post-Order State
        # a. Cart should be empty
        res = await client.get("/cart", headers=headers)
        cart = res.json()
        if cart.get('items'):
            print("FAIL: Cart not cleared.")
        else:
            print("SUCCESS: Cart cleared.")
            
        # b. Stock should be reduced
        res = await client.get(f"/products/{product_id}")
        new_prod = res.json()
        new_stock = new_prod['quantity']
        if new_stock == initial_stock - 1:
            print(f"SUCCESS: Stock reduced from {initial_stock} to {new_stock}.")
        else:
            print(f"FAIL: Stock not reduced correctly. New stock: {new_stock}")

if __name__ == "__main__":
    asyncio.run(test_order_flow())
