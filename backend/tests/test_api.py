"""
VS Fashion E-commerce API Tests
Tests for: Products, Auth, Cart, Orders, Admin functionality
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "vsfastion@gmail.com"
ADMIN_PASSWORD = "vs@54321"
TEST_CUSTOMER_EMAIL = f"test_{uuid.uuid4().hex[:8]}@example.com"
TEST_CUSTOMER_PASSWORD = "testpass123"
TEST_CUSTOMER_NAME = "Test Customer"
TEST_CUSTOMER_MOBILE = "9876543210"
TEST_CUSTOMER_ADDRESS = "123 Test Street, Test City"


class TestHealthAndProducts:
    """Test product endpoints - public access"""
    
    def test_get_all_products(self):
        """Test GET /api/products returns list of products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} products")
        
    def test_get_trending_products(self):
        """Test GET /api/products/trending returns trending products"""
        response = requests.get(f"{BASE_URL}/api/products/trending")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify all returned products are trending
        for product in data:
            assert product.get('is_trending') == True
        print(f"✓ Found {len(data)} trending products")
        
    def test_get_products_by_category(self):
        """Test GET /api/products?category=Men filters correctly"""
        response = requests.get(f"{BASE_URL}/api/products?category=Men")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for product in data:
            assert product.get('category') == 'Men'
        print(f"✓ Found {len(data)} Men's products")
        
    def test_get_single_product(self):
        """Test GET /api/products/{id} returns product details"""
        # First get a product ID
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        if len(products) > 0:
            product_id = products[0]['id']
            response = requests.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200
            data = response.json()
            assert data['id'] == product_id
            assert 'name' in data
            assert 'price' in data
            assert 'variants' in data
            assert 'images' in data
            print(f"✓ Product detail: {data['name']}")
        else:
            pytest.skip("No products available")
            
    def test_get_nonexistent_product(self):
        """Test GET /api/products/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/products/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ 404 returned for nonexistent product")
        
    def test_get_categories(self):
        """Test GET /api/categories returns list of categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} categories: {data}")


class TestCustomerAuth:
    """Test customer authentication endpoints"""
    
    def test_customer_registration(self):
        """Test POST /api/auth/register creates new customer"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": TEST_CUSTOMER_NAME,
            "mobile": TEST_CUSTOMER_MOBILE,
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD,
            "address": TEST_CUSTOMER_ADDRESS
        })
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        assert 'customer' in data
        assert data['customer']['email'] == TEST_CUSTOMER_EMAIL
        print(f"✓ Customer registered: {TEST_CUSTOMER_EMAIL}")
        
    def test_customer_registration_duplicate_email(self):
        """Test POST /api/auth/register with duplicate email fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Duplicate User",
            "mobile": "1234567890",
            "email": TEST_CUSTOMER_EMAIL,
            "password": "password123",
            "address": "Some Address"
        })
        assert response.status_code == 400
        print("✓ Duplicate email registration rejected")
        
    def test_customer_login_success(self):
        """Test POST /api/auth/login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        assert 'customer' in data
        print("✓ Customer login successful")
        
    def test_customer_login_invalid_credentials(self):
        """Test POST /api/auth/login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected")


class TestAdminAuth:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Test POST /api/admin/login with valid admin credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        assert 'admin' in data
        assert data['admin']['email'] == ADMIN_EMAIL
        print("✓ Admin login successful")
        
    def test_admin_login_invalid_credentials(self):
        """Test POST /api/admin/login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@admin.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid admin credentials rejected")


class TestCartOperations:
    """Test cart functionality - requires authentication"""
    
    @pytest.fixture
    def customer_token(self):
        """Get customer auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()['token']
        pytest.skip("Customer login failed")
        
    @pytest.fixture
    def product_id(self):
        """Get a valid product ID"""
        response = requests.get(f"{BASE_URL}/api/products")
        products = response.json()
        if len(products) > 0:
            return products[0]['id'], products[0]['variants']['colors'][0], products[0]['variants']['sizes'][0]
        pytest.skip("No products available")
        
    def test_get_empty_cart(self, customer_token):
        """Test GET /api/cart returns empty cart for new customer"""
        response = requests.get(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert 'items' in data
        print(f"✓ Cart retrieved with {len(data['items'])} items")
        
    def test_add_to_cart(self, customer_token, product_id):
        """Test POST /api/cart/add adds item to cart"""
        pid, color, size = product_id
        response = requests.post(
            f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={
                "product_id": pid,
                "selected_color": color,
                "selected_size": size,
                "quantity": 1
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data['message'] == "Item added to cart"
        print("✓ Item added to cart")
        
    def test_cart_unauthorized(self):
        """Test cart endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 401
        print("✓ Unauthorized cart access rejected")
        
    def test_remove_from_cart(self, customer_token):
        """Test DELETE /api/cart/{index} removes item"""
        # First check if cart has items
        cart_response = requests.get(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        cart = cart_response.json()
        if len(cart.get('items', [])) > 0:
            response = requests.delete(
                f"{BASE_URL}/api/cart/0",
                headers={"Authorization": f"Bearer {customer_token}"}
            )
            assert response.status_code == 200
            print("✓ Item removed from cart")
        else:
            print("✓ Cart is empty, skipping remove test")


class TestAdminOperations:
    """Test admin product management"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()['token']
        pytest.skip("Admin login failed")
        
    def test_get_all_customers(self, admin_token):
        """Test GET /api/admin/customers returns customer list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/customers",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} customers")
        
    def test_get_all_orders(self, admin_token):
        """Test GET /api/admin/orders returns order list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} orders")
        
    def test_admin_endpoints_unauthorized(self):
        """Test admin endpoints require admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/customers")
        assert response.status_code == 401
        print("✓ Unauthorized admin access rejected")
        
    def test_update_inventory(self, admin_token):
        """Test PUT /api/admin/inventory/{product_id} updates stock"""
        # Get a product first
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        if len(products) > 0:
            product_id = products[0]['id']
            original_qty = products[0]['quantity']
            
            # Update inventory
            response = requests.put(
                f"{BASE_URL}/api/admin/inventory/{product_id}?quantity=5",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            
            # Verify update
            product_response = requests.get(f"{BASE_URL}/api/products/{product_id}")
            updated_product = product_response.json()
            assert updated_product['quantity'] == original_qty + 5
            
            # Revert change
            requests.put(
                f"{BASE_URL}/api/admin/inventory/{product_id}?quantity=-5",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            print("✓ Inventory updated and reverted")
        else:
            pytest.skip("No products available")


class TestOrderFlow:
    """Test complete order placement flow"""
    
    @pytest.fixture
    def customer_token(self):
        """Get customer auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CUSTOMER_EMAIL,
            "password": TEST_CUSTOMER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()['token']
        pytest.skip("Customer login failed")
        
    def test_place_order_empty_cart(self, customer_token):
        """Test POST /api/orders with empty cart fails"""
        # Clear cart first
        requests.delete(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 400
        print("✓ Empty cart order rejected")
        
    def test_get_customer_orders(self, customer_token):
        """Test GET /api/orders/customer returns customer's orders"""
        response = requests.get(
            f"{BASE_URL}/api/orders/customer",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} customer orders")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
