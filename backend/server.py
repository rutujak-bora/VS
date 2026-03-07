from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, BackgroundTasks, status, Header, Response
from fastapi.staticfiles import StaticFiles
import csv
import io
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import aiofiles
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import mimetypes
import asyncio
import resend
import certifi

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

SECRET_KEY = os.getenv("JWT_SECRET", "vs-fashion-secret-key-2024")
ADMIN_EMAIL = "vsfashiiiion@gmail.com"
ADMIN_PASSWORD = "vs@54321"

# Models
class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    mobile: str
    email: EmailStr
    password_hash: str
    address: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerRegister(BaseModel):
    name: str
    mobile: str
    email: EmailStr
    password: str
    address: str

class CustomerLogin(BaseModel):
    email: EmailStr
    password: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class ResetPassword(BaseModel):
    email: EmailStr
    new_password: str


class Collection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    collection_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductVariant(BaseModel):
    colors: List[str]
    sizes: List[str]
    size_chart: Optional[str] = None

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    # category is deprecated but kept for backward compatibility if needed, 
    # but we will rely on linkIds now.
    category: str 
    collection_id: Optional[str] = None
    category_id: Optional[str] = None
    images: List[str]
    variants: ProductVariant
    quantity: int
    price: float
    is_trending: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    category: str # For legacy/display
    collection_id: str
    category_id: str
    colors: List[str]
    sizes: List[str]
    size_chart: Optional[str] = None
    quantity: int
    price: float
    is_trending: bool = False

class CartItem(BaseModel):
    product_id: str
    product_name: str
    product_image: str
    selected_color: str
    selected_size: str
    quantity: int
    price: float

class Cart(BaseModel):
    customer_id: str
    items: List[CartItem] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    product_image: str
    selected_color: str
    selected_size: str
    quantity: int
    price: float

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    customer_email: str
    customer_mobile: str
    customer_address: str
    items: List[OrderItem]
    total_amount: float
    status: str = "Pending"
    order_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AddToCartRequest(BaseModel):
    product_id: str
    selected_color: str
    selected_size: str
    quantity: int = 1

# Auth helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_customer(authorization: str = "") -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if payload.get("type") != "customer":
        raise HTTPException(status_code=403, detail="Access denied")
    return payload

async def get_current_admin(authorization: str = "") -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if payload.get("type") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return payload

# Email helper
async def send_order_email(order: Order):
    try:
        sender_email = os.getenv("GMAIL_USER", "")
        sender_password = os.getenv("GMAIL_APP_PASSWORD", "")
        
        if not sender_email or not sender_password:
            logging.warning("Gmail credentials not configured. Email not sent.")
            return
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'New order placed from "{order.customer_name}" on {order.order_date.strftime("%Y-%m-%d")}'
        msg['From'] = f"VS Fashion <{sender_email}>"
        msg['To'] = "vsfashiiiion@gmail.com"
        msg['Reply-To'] = order.customer_email  # CRITICAL: Admin can reply directly to customer
        
        items_html = ""
        for item in order.items:
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <img src="{os.getenv('BACKEND_URL', 'https://stylehub-554.preview.emergentagent.com')}{item.product_image}" 
                         alt="{item.product_name}" 
                         style="width: 60px; height: 75px; object-fit: cover; border: 1px solid #ddd;">
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.product_name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.selected_color}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.selected_size}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹{item.price * item.quantity:,.2f}</td>
            </tr>
            """
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border: 1px solid #ddd;">
              <div style="background-color: #000; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px;">VS Fashion</h1>
                <p style="margin: 5px 0 0 0; font-size: 12px; letter-spacing: 2px;">NEW ORDER NOTIFICATION</p>
              </div>
              
              <div style="padding: 30px;">
                <h2 style="color: #000; margin-top: 0; border-bottom: 2px solid #000; padding-bottom: 10px;">Order Details</h2>
                <p style="margin: 5px 0;"><strong>Order ID:</strong> {order.id}</p>
                <p style="margin: 5px 0;"><strong>Order Date:</strong> {order.order_date.strftime("%B %d, %Y at %I:%M %p")}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="background-color: #fef3cd; padding: 3px 10px; border-radius: 3px;">{order.status}</span></p>
                
                <h3 style="color: #000; margin-top: 30px; margin-bottom: 15px;">Customer Information</h3>
                <table style="width: 100%; background-color: #f9f9f9; padding: 15px; border: 1px solid #eee;">
                  <tr><td style="padding: 5px 0;"><strong>Name:</strong></td><td style="padding: 5px 0;">{order.customer_name}</td></tr>
                  <tr><td style="padding: 5px 0;"><strong>Email:</strong></td><td style="padding: 5px 0;">{order.customer_email}</td></tr>
                  <tr><td style="padding: 5px 0;"><strong>Mobile:</strong></td><td style="padding: 5px 0;">{order.customer_mobile}</td></tr>
                  <tr><td style="padding: 5px 0; vertical-align: top;"><strong>Address:</strong></td><td style="padding: 5px 0;">{order.customer_address}</td></tr>
                </table>
                
                <h3 style="color: #000; margin-top: 30px; margin-bottom: 15px;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                  <thead>
                    <tr style="background-color: #000; color: white;">
                      <th style="padding: 12px; text-align: left; font-size: 11px; letter-spacing: 1px;">IMAGE</th>
                      <th style="padding: 12px; text-align: left; font-size: 11px; letter-spacing: 1px;">PRODUCT</th>
                      <th style="padding: 12px; text-align: left; font-size: 11px; letter-spacing: 1px;">COLOR</th>
                      <th style="padding: 12px; text-align: left; font-size: 11px; letter-spacing: 1px;">SIZE</th>
                      <th style="padding: 12px; text-align: center; font-size: 11px; letter-spacing: 1px;">QTY</th>
                      <th style="padding: 12px; text-align: right; font-size: 11px; letter-spacing: 1px;">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items_html}
                  </tbody>
                </table>
                
                <div style="margin-top: 30px; padding: 20px; background-color: #000; color: white; text-align: right;">
                  <p style="margin: 0; font-size: 14px; letter-spacing: 1px;">TOTAL AMOUNT</p>
                  <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">₹{order.total_amount:,.2f}</p>
                </div>
                
                <div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #000;">
                  <p style="margin: 0; font-size: 13px; color: #666;">
                    💡 <strong>Tip:</strong> Click "Reply" to respond directly to the customer at <strong>{order.customer_email}</strong>
                  </p>
                </div>
              </div>
              
              <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
                <p style="margin: 0; font-size: 12px; color: #666;">VS Fashion - Luxury Fashion Store</p>
                <p style="margin: 5px 0 0 0; font-size: 11px; color: #999;">vsfastion@gmail.com</p>
              </div>
            </div>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        # Create a secure SSL context
        context = ssl.create_default_context()
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
        
        logging.info(f"Order email sent successfully for order {order.id}")
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")

# Customer endpoints
@api_router.post("/auth/register")
async def register_customer(data: CustomerRegister):
    existing = await db.customers.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    customer = Customer(
        name=data.name,
        mobile=data.mobile,
        email=data.email,
        password_hash=hash_password(data.password),
        address=data.address
    )
    
    doc = customer.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.customers.insert_one(doc)
    
    token = create_token({"id": customer.id, "email": customer.email, "type": "customer"})
    return {"token": token, "customer": {"id": customer.id, "name": customer.name, "email": customer.email}}

@api_router.post("/auth/login")
async def login_customer(data: CustomerLogin):
    customer = await db.customers.find_one({"email": data.email}, {"_id": 0})
    if not customer or not verify_password(data.password, customer['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"id": customer['id'], "email": customer['email'], "type": "customer"})
    return {"token": token, "customer": {"id": customer['id'], "name": customer['name'], "email": customer['email']}}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPassword):
    customer = await db.customers.find_one({"email": data.email})
    if not customer:
        raise HTTPException(status_code=404, detail="Email is not registered")
    
    new_password_hash = hash_password(data.new_password)
    await db.customers.update_one(
        {"email": data.email},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    return {"message": "Password updated successfully"}

# Admin endpoints
@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    if data.email != ADMIN_EMAIL or data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    token = create_token({"email": ADMIN_EMAIL, "type": "admin"})
    return {"token": token, "admin": {"email": ADMIN_EMAIL}}

# Product endpoints
@api_router.get("/products")
async def get_products(
    category: Optional[str] = None, 
    collection_id: Optional[str] = None,
    category_id: Optional[str] = None
):
    query = {}
    if collection_id:
        query["collection_id"] = collection_id
    if category_id:
        query["category_id"] = category_id
    elif category:
        # Fallback for old way
        query["category"] = category
        
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/products/trending")
async def get_trending_products():
    products = await db.products.find({"is_trending": True}, {"_id": 0}).to_list(100)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# Cart endpoints
@api_router.post("/cart/add")
async def add_to_cart(data: AddToCartRequest, authorization: str = Header(None)):
    customer = await get_current_customer(authorization or "")
    
    product = await db.products.find_one({"id": data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if data.quantity > product['quantity']:
        raise HTTPException(status_code=400, detail="Not enough stock")
    
    cart_item = CartItem(
        product_id=product['id'],
        product_name=product['name'],
        product_image=product['images'][0] if product['images'] else "",
        selected_color=data.selected_color,
        selected_size=data.selected_size,
        quantity=data.quantity,
        price=product['price']
    )
    
    cart = await db.carts.find_one({"customer_id": customer['id']}, {"_id": 0})
    
    if cart:
        items = cart.get('items', [])
        items.append(cart_item.model_dump())
        await db.carts.update_one(
            {"customer_id": customer['id']},
            {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        new_cart = Cart(customer_id=customer['id'], items=[cart_item])
        doc = new_cart.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.carts.insert_one(doc)
    
    return {"message": "Item added to cart"}

@api_router.get("/cart")
async def get_cart(authorization: str = Header(None)):
    customer = await get_current_customer(authorization or "")
    cart = await db.carts.find_one({"customer_id": customer['id']}, {"_id": 0})
    return cart if cart else {"customer_id": customer['id'], "items": []}

@api_router.delete("/cart/{item_index}")
async def remove_from_cart(item_index: int, authorization: str = Header(None)):
    customer = await get_current_customer(authorization or "")
    cart = await db.carts.find_one({"customer_id": customer['id']}, {"_id": 0})
    
    if cart and 0 <= item_index < len(cart['items']):
        items = cart['items']
        items.pop(item_index)
        await db.carts.update_one(
            {"customer_id": customer['id']},
            {"$set": {"items": items}}
        )
        return {"message": "Item removed"}
    
    raise HTTPException(status_code=404, detail="Item not found")

@api_router.delete("/cart")
async def clear_cart(authorization: str = Header(None)):
    customer = await get_current_customer(authorization or "")
    await db.carts.delete_one({"customer_id": customer['id']})
    return {"message": "Cart cleared"}

# Order endpoints
@api_router.post("/orders")
async def place_order(background_tasks: BackgroundTasks, authorization: str = Header(None)):
    customer = await get_current_customer(authorization or "")
    customer_data = await db.customers.find_one({"id": customer['id']}, {"_id": 0})
    cart = await db.carts.find_one({"customer_id": customer['id']}, {"_id": 0})
    
    if not cart or not cart.get('items'):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    order_items = []
    total = 0
    
    for item in cart['items']:
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if not product or product['quantity'] < item['quantity']:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {item['product_name']}")
        
        await db.products.update_one(
            {"id": item['product_id']},
            {"$inc": {"quantity": -item['quantity']}}
        )
        
        order_items.append(OrderItem(**item))
        total += item['price'] * item['quantity']
    
    order = Order(
        customer_id=customer['id'],
        customer_name=customer_data['name'],
        customer_email=customer_data['email'],
        customer_mobile=customer_data['mobile'],
        customer_address=customer_data['address'],
        items=order_items,
        total_amount=total
    )
    
    doc = order.model_dump()
    doc['order_date'] = doc['order_date'].isoformat()
    doc['items'] = [item.model_dump() for item in order_items]
    await db.orders.insert_one(doc)
    
    await db.carts.delete_one({"customer_id": customer['id']})
    
    background_tasks.add_task(send_order_email, order)
    
    return {"message": "Order placed successfully", "order_id": order.id}

@api_router.get("/orders/customer")
async def get_customer_orders(authorization: str = Header(None)):
    customer = await get_current_customer(authorization or "")
    orders = await db.orders.find({"customer_id": customer['id']}, {"_id": 0}).to_list(1000)
    return orders

# Admin product management
@api_router.post("/admin/products")
async def create_product(
    name: str = Form(...),
    category: str = Form(...), # Keep as string for display name or just logic
    collection_id: str = Form(...),
    category_id: str = Form(...),
    colors: str = Form(...),
    sizes: str = Form(...),
    size_chart: Optional[str] = Form(None),
    quantity: int = Form(...),
    price: float = Form(...),
    is_trending: bool = Form(False),
    images: List[UploadFile] = File(...),
    authorization: str = Header(None)
):
    await get_current_admin(authorization or "")
    
    if len(images) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 images allowed")
    
    saved_images = []
    for img in images:
        ext = img.filename.split('.')[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = UPLOAD_DIR / filename
        
        async with aiofiles.open(filepath, 'wb') as f:
            content = await img.read()
            await f.write(content)
        
        saved_images.append(f"/uploads/{filename}")
    
    product = Product(
        name=name,
        category=category,
        collection_id=collection_id,
        category_id=category_id,
        images=saved_images,
        variants=ProductVariant(
            colors=colors.split(','),
            sizes=sizes.split(','),
            size_chart=size_chart
        ),
        quantity=quantity,
        price=price,
        is_trending=is_trending
    )
    
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    
    return {"message": "Product created", "product_id": product.id}

@api_router.put("/admin/products/{product_id}")
async def update_product(
    product_id: str,
    name: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    collection_id: Optional[str] = Form(None),
    category_id: Optional[str] = Form(None),
    colors: Optional[str] = Form(None),
    sizes: Optional[str] = Form(None),
    size_chart: Optional[str] = Form(None),
    quantity: Optional[int] = Form(None),
    price: Optional[float] = Form(None),
    is_trending: Optional[bool] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    authorization: str = Header(None)
):
    await get_current_admin(authorization or "")
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {}
    if name: update_data['name'] = name
    if category: update_data['category'] = category
    if collection_id: update_data['collection_id'] = collection_id
    if category_id: update_data['category_id'] = category_id
    if quantity is not None: update_data['quantity'] = quantity
    if price: update_data['price'] = price
    if is_trending is not None: update_data['is_trending'] = is_trending
    
    if colors or sizes or size_chart:
        variants = product.get('variants', {})
        if colors: variants['colors'] = colors.split(',')
        if sizes: variants['sizes'] = sizes.split(',')
        if size_chart: variants['size_chart'] = size_chart
        update_data['variants'] = variants
    
    if images:
        saved_images = []
        for img in images[:4]:
            ext = img.filename.split('.')[-1]
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = UPLOAD_DIR / filename
            
            async with aiofiles.open(filepath, 'wb') as f:
                content = await img.read()
                await f.write(content)
            
            saved_images.append(f"/uploads/{filename}")
        
        update_data['images'] = saved_images
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    return {"message": "Product updated"}

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, authorization: str = Header(None)):
    await get_current_admin(authorization or "")
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

@api_router.get("/admin/products/csv-template")
async def download_csv_template():
    content = "Name,Collection,Category,Colors,Sizes,Quantity,Price,Trending,Size_Chart,Image_URLs\n"
    content += "Premium Silk Dress,Women,Shirts,Red|Blue,S|M|L|XL,50,2499.00,Yes,Standard,https://example.com/img1.jpg|https://example.com/img2.jpg\n"
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bulk_products_template.csv"}
    )

@api_router.post("/admin/products/bulk")
async def bulk_upload_products(file: UploadFile = File(...), authorization: str = Header(None)):
    await get_current_admin(authorization or "")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")
        
    try:
        content = await file.read()
        text = content.decode('utf-8-sig') # handle BOM if saved from Excel
        reader = csv.DictReader(io.StringIO(text))
        
        collections = await db.collections.find({}).to_list(100)
        categories = await db.categories.find({}).to_list(100)
        
        col_map = {c['name'].lower(): c['id'] for c in collections}
        cat_map = {c['name'].lower(): (c['id'], c['collection_id']) for c in categories}
        cat_name_map = {c['name'].lower(): c['name'] for c in categories}
        
        added_count = 0
        error_rows = []
        
        for idx, row in enumerate(reader, start=2):
            name = row.get('Name', '').strip()
            if not name: continue
            
            col_name = row.get('Collection', '').strip().lower()
            cat_name = row.get('Category', '').strip().lower()
            
            col_id = col_map.get(col_name)
            cat_id = None
            if cat_name in cat_map:
                cat_id, _ = cat_map[cat_name]
                
            if not col_id or not cat_id:
                error_rows.append(f"Row {idx}: Collection '{col_name}' or Category '{cat_name}' not found. Please create them first.")
                continue
                
            try:
                qty = int(row.get('Quantity', 10))
                price = float(row.get('Price', 999.0))
            except:
                qty = 10
                price = 999.0
                
            colors_str = row.get('Colors', 'Default').replace(',', '|')
            sizes_str = row.get('Sizes', 'Free Size').replace(',', '|')
            
            colors = [x.strip() for x in colors_str.split('|') if x.strip()]
            sizes = [x.strip() for x in sizes_str.split('|') if x.strip()]
            
            is_trending = str(row.get('Trending', 'False')).lower() in ['true', 'yes', '1', 'y']
            
            img_str = row.get('Image_URLs', '').replace(',', '|')
            images = [img.strip() for img in img_str.split('|') if img.strip()]
            
            product = Product(
                name=name,
                category=cat_name_map.get(cat_name, row.get('Category', '')),
                collection_id=col_id,
                category_id=cat_id,
                images=images,
                variants=ProductVariant(
                    colors=colors,
                    sizes=sizes,
                    size_chart=row.get('Size_Chart', '')
                ),
                quantity=qty,
                price=price,
                is_trending=is_trending
            )
            
            doc = product.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.products.insert_one(doc)
            added_count += 1
            
        if added_count == 0 and error_rows:
            raise HTTPException(status_code=400, detail="; ".join(error_rows[:3]))
            
        return {
            "message": f"Successfully imported {added_count} products.",
            "errors": error_rows
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")

@api_router.get("/admin/customers")
async def get_all_customers(authorization: str = Header(None)):
    await get_current_admin(authorization or "")
    customers = await db.customers.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return customers

@api_router.get("/admin/orders")
async def get_all_orders(authorization: str = Header(None)):
    await get_current_admin(authorization or "")
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    return orders

@api_router.put("/admin/inventory/{product_id}")
async def update_inventory(product_id: str, quantity: int, authorization: str = Header(None)):
    await get_current_admin(authorization or "")
    result = await db.products.update_one(
        {"id": product_id},
        {"$inc": {"quantity": quantity}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Inventory updated"}

@api_router.get("/categories")
async def get_all_categories(collection_id: Optional[str] = None):
    query = {}
    if collection_id:
        query["collection_id"] = collection_id
    categories = await db.categories.find(query, {"_id": 0}).to_list(1000)
    return categories

# Collection & Category Management
@api_router.get("/collections")
async def get_collections():
    collections = await db.collections.find({}, {"_id": 0}).to_list(100)
    return collections

@api_router.post("/admin/collections")
async def create_collection(
    name: str = Form(...),
    description: str = Form(None),
    authorization: str = Header(None)
):
    await get_current_admin(authorization or "")
    slug = name.lower().replace(" ", "-")
    
    # check exists
    existing = await db.collections.find_one({"slug": slug})
    if existing:
         raise HTTPException(status_code=400, detail="Collection already exists")

    collection = Collection(name=name, slug=slug, description=description)
    await db.collections.insert_one(collection.model_dump())
    return collection

@api_router.delete("/admin/collections/{collection_id}")
async def delete_collection(collection_id: str, authorization: str = Header(None)):
    await get_current_admin(authorization or "")
    # Optionally check if products/categories exist
    await db.collections.delete_one({"id": collection_id})
    return {"message": "Collection deleted"}

@api_router.post("/admin/categories")
async def create_category(
    name: str = Form(...),
    collection_id: str = Form(...),
    authorization: str = Header(None)
):
    await get_current_admin(authorization or "")
    slug = name.lower().replace(" ", "-")
    
    # Verify collection
    coll = await db.collections.find_one({"id": collection_id})
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    category = Category(name=name, slug=slug, collection_id=collection_id)
    await db.categories.insert_one(category.model_dump())
    return category

@api_router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, authorization: str = Header(None)):
    await get_current_admin(authorization or "")
    await db.categories.delete_one({"id": category_id})
    return {"message": "Category deleted"}

@api_router.post("/admin/seed-categories")
async def seed_categories(authorization: str = Header(None)):
    await get_current_admin(authorization or "")
    
    # 1. Create 'Women' Collection if not exists
    women_slug = "women"
    women_collection = await db.collections.find_one({"slug": women_slug})
    if not women_collection:
        women_coll_obj = Collection(name="Women", slug=women_slug, description="Women's Collection")
        women_collection = women_coll_obj.model_dump()
        await db.collections.insert_one(women_collection)
    
    women_id = women_collection['id']
    
    # 2. Key Categories
    valid_cats = [
        "Sleeved - Bell sleeved", "Sleeved - Straight full", "Sleeved - 3/4 sleeved", "Sleeved - Elbow sleeved",
        "Kurti - All", "Kurti - Long", "Kurti - Short",
        "Tops", "Bottoms", "Shirts", "Halter Necks", "Spaghetti Tops", "Sarees"
    ]
    
    count = 0
    for vc in valid_cats:
        cat_slug = vc.lower().replace(" ", "-").replace("/", "-")
        exists = await db.categories.find_one({"slug": cat_slug, "collection_id": women_id})
        if not exists:
            cat_obj = Category(name=vc, slug=cat_slug, collection_id=women_id)
            await db.categories.insert_one(cat_obj.model_dump())
            count += 1
            
    return {"message": f"Seeded {count} categories to Women collection"}

# Contact Form Model
class ContactForm(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    message: str

# Contact Form Endpoint
@api_router.post("/contact")
async def send_contact_message(data: ContactForm):
    """Send contact form message to store owner"""
    try:
        resend_api_key = os.getenv("RESEND_API_KEY", "")
        
        if not resend_api_key:
            # Fallback to SMTP if Resend not configured
            logging.warning("Resend API key not configured. Using SMTP fallback.")
            await send_contact_email_smtp(data)
        else:
            resend.api_key = resend_api_key
            
            html_content = f"""
            <html>
              <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border: 1px solid #ddd;">
                  <div style="background-color: #8B1B4A; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px;">VS Fashion</h1>
                    <p style="margin: 5px 0 0 0; font-size: 12px; letter-spacing: 2px;">NEW INQUIRY</p>
                  </div>
                  
                  <div style="padding: 30px;">
                    <h2 style="color: #8B1B4A; margin-top: 0; border-bottom: 2px solid #8B1B4A; padding-bottom: 10px;">Contact Form Submission</h2>
                    
                    <table style="width: 100%; background-color: #f9f9f9; padding: 15px; border: 1px solid #eee;">
                      <tr><td style="padding: 8px 0;"><strong>Name:</strong></td><td style="padding: 8px 0;">{data.name}</td></tr>
                      <tr><td style="padding: 8px 0;"><strong>Email:</strong></td><td style="padding: 8px 0;">{data.email}</td></tr>
                      <tr><td style="padding: 8px 0;"><strong>Mobile:</strong></td><td style="padding: 8px 0;">{data.mobile}</td></tr>
                    </table>
                    
                    <h3 style="color: #8B1B4A; margin-top: 20px;">Message:</h3>
                    <div style="background-color: #f9f9f9; padding: 15px; border: 1px solid #eee; white-space: pre-wrap;">
                      {data.message}
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background-color: #fff5f8; border-left: 4px solid #8B1B4A;">
                      <p style="margin: 0; font-size: 13px; color: #666;">
                        Click "Reply" to respond directly to the customer at <strong>{data.email}</strong>
                      </p>
                    </div>
                  </div>
                  
                  <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
                    <p style="margin: 0; font-size: 12px; color: #666;">VS Fashion - Contact Form Submission</p>
                  </div>
                </div>
              </body>
            </html>
            """
            
            params = {
                "from": os.getenv("SENDER_EMAIL", "onboarding@resend.dev"),
                "to": ["vsfashiiiion@gmail.com"],
                "subject": f"New Inquiry from {data.name} - VS Fashion Contact Form",
                "html": html_content,
                "reply_to": data.email
            }
            
            await asyncio.to_thread(resend.Emails.send, params)
        
        # Save to database for record keeping
        contact_doc = {
            "id": str(uuid.uuid4()),
            "name": data.name,
            "email": data.email,
            "mobile": data.mobile,
            "message": data.message,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.contact_messages.insert_one(contact_doc)
        
        return {"message": "Contact message sent successfully"}
    except Exception as e:
        logging.error(f"Failed to send contact message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message. Please try again.")

async def send_contact_email_smtp(data: ContactForm):
    """Fallback SMTP method for contact form"""
    try:
        sender_email = os.getenv("GMAIL_USER", "")
        sender_password = os.getenv("GMAIL_APP_PASSWORD", "")
        
        if not sender_email or not sender_password:
            logging.warning("Gmail credentials not configured.")
            return
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'New Inquiry from {data.name} - VS Fashion Contact Form'
        msg['From'] = f"VS Fashion <{sender_email}>"
        msg['To'] = "vsfashiiiion@gmail.com"
        msg['Reply-To'] = data.email
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #8B1B4A;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> {data.name}</p>
            <p><strong>Email:</strong> {data.email}</p>
            <p><strong>Mobile:</strong> {data.mobile}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; white-space: pre-wrap;">{data.message}</div>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        # Create a secure SSL context
        context = ssl.create_default_context()
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
        
        logging.info("Contact email sent via SMTP")
    except Exception as e:
        logging.error(f"SMTP send failed: {str(e)}")

app.include_router(api_router)

# Mount uploads so they're accessible at /uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()