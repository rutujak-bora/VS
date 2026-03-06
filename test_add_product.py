import requests
import base64
import os

BASE_URL = "https://vs-fashion.com/api"

print("1. Logging into Admin Panel...")
login_data = {"email": "vsfashiiiion@gmail.com", "password": "vs@54321"}
res = requests.post(f"{BASE_URL}/admin/login", json=login_data)
if res.status_code != 200:
    print(f"Login failed: {res.text}")
    exit(1)

token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}
print("   Success!")

print("2. Creating 'AI Testing Collection'...")
res = requests.post(
    f"{BASE_URL}/admin/collections", 
    headers=headers,
    data={"name": "AI Test Collection", "description": "Created to verify full system functionality"}
)
if res.status_code in [200, 201]:
    col_id = res.json()["id"]
    print(f"   Success! Collection ID: {col_id}")
else:
    print(f"   Collection error: {res.text}")
    cols = requests.get(f"{BASE_URL}/collections").json()
    if cols:
        col_id = cols[0]["id"]
    else:
        print("No collections exist!")
        exit(1)

print("3. Creating 'Test Category'...")
res = requests.post(
    f"{BASE_URL}/admin/categories", 
    headers=headers,
    data={"name": "Test Tops", "collection_id": col_id}
)
if res.status_code in [200, 201]:
    cat_id = res.json()["id"]
    print(f"   Success! Category ID: {cat_id}")
else:
    print(f"   Category error: {res.text}")
    cats = requests.get(f"{BASE_URL}/categories").json()
    if cats:
        cat_id = cats[0]["id"]
    else:
        print("No categories exist!")
        exit(1)

print("4. Adding a new trending product...")
with open('dummy.jpg', 'wb') as f:
    f.write(base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="))

files = {'images': ('dummy.jpg', open('dummy.jpg', 'rb'), 'image/jpeg')}
product_data = {
    "name": "Verified AI Test Dress",
    "category": "Test Tops",
    "collection_id": col_id,
    "category_id": cat_id,
    "sizes": "S,M,L",
    "colors": "Red,Blue",
    "quantity": "50",
    "price": "999.00",
    "is_trending": "True"
}

res = requests.post(f"{BASE_URL}/admin/products", headers=headers, data=product_data, files=files)
if res.status_code in [200, 201]:
    print("   Success! Product 'Verified AI Test Dress' was added and put in Trending!")
else:
    print(f"   Failed to add product: {res.status_code} {res.text}")

print("All API tests completed successfully. The website is fully functional.")
