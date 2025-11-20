import requests
import sys
import json
from datetime import datetime

class ECommerceAPITester:
    def __init__(self, base_url="https://inspiring-curie.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add auth headers if available
        if use_admin and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
            
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def create_test_session(self):
        """Create test user session using MongoDB"""
        print("\n🔧 Creating test user session...")
        try:
            import subprocess
            
            # Create test user and session
            mongo_script = '''
            use('prints_store');
            var userId = 'test-user-' + Date.now();
            var sessionToken = 'test_session_' + Date.now();
            var adminUserId = 'admin-user-' + Date.now();
            var adminSessionToken = 'admin_session_' + Date.now();
            
            // Create regular test user
            db.users.insertOne({
              id: userId,
              email: 'test.user.' + Date.now() + '@example.com',
              name: 'Test User',
              picture: 'https://via.placeholder.com/150',
              is_admin: false,
              created_at: new Date().toISOString()
            });
            
            db.user_sessions.insertOne({
              id: 'session-' + Date.now(),
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            });
            
            // Create admin user
            db.users.insertOne({
              id: adminUserId,
              email: 'admin@3dprints.com',
              name: 'Admin User',
              picture: 'https://via.placeholder.com/150',
              is_admin: true,
              created_at: new Date().toISOString()
            });
            
            db.user_sessions.insertOne({
              id: 'admin-session-' + Date.now(),
              user_id: adminUserId,
              session_token: adminSessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            });
            
            print('Regular session token: ' + sessionToken);
            print('Admin session token: ' + adminSessionToken);
            '''
            
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                output_lines = result.stdout.strip().split('\n')
                for line in output_lines:
                    if 'Regular session token:' in line:
                        self.session_token = line.split(': ')[1]
                    elif 'Admin session token:' in line:
                        self.admin_token = line.split(': ')[1]
                
                if self.session_token and self.admin_token:
                    print(f"✅ Test sessions created successfully")
                    return True
                else:
                    print("❌ Failed to extract session tokens")
                    return False
            else:
                print(f"❌ MongoDB script failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to create test session: {str(e)}")
            return False

    def seed_test_products(self):
        """Create test products for testing"""
        print("\n🌱 Seeding test products...")
        
        test_products = [
            {
                "name": "Dragon Figurine",
                "description": "Detailed 3D printed dragon figurine",
                "price": 29.99,
                "category": "Figurines",
                "images": ["https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Dragon"],
                "variants": [],
                "stock": 10
            },
            {
                "name": "Phone Stand",
                "description": "Adjustable phone stand for desk",
                "price": 15.99,
                "category": "Accessories",
                "images": ["https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Phone+Stand"],
                "variants": [],
                "stock": 25
            }
        ]
        
        created_products = []
        for product in test_products:
            success, response = self.run_test(
                f"Create Product: {product['name']}",
                "POST",
                "products",
                200,
                data=product,
                use_admin=True
            )
            if success and 'id' in response:
                created_products.append(response['id'])
        
        return created_products

    def test_public_endpoints(self):
        """Test endpoints that don't require authentication"""
        print("\n📋 Testing Public Endpoints...")
        
        # Test products endpoint
        self.run_test("Get All Products", "GET", "products", 200)
        
        # Test categories endpoint
        self.run_test("Get Categories", "GET", "categories", 200)

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test /auth/me with valid token
        self.run_test("Get Current User", "GET", "auth/me", 200)
        
        # Test /auth/me without token (should fail)
        old_token = self.session_token
        self.session_token = None
        self.run_test("Get Current User (No Auth)", "GET", "auth/me", 401)
        self.session_token = old_token

    def test_product_endpoints(self):
        """Test product-related endpoints"""
        print("\n📦 Testing Product Endpoints...")
        
        # Create test products first
        product_ids = self.seed_test_products()
        
        if product_ids:
            # Test get single product
            self.run_test("Get Single Product", "GET", f"products/{product_ids[0]}", 200)
            
            # Test update product (admin only)
            update_data = {
                "name": "Updated Dragon Figurine",
                "description": "Updated description",
                "price": 34.99,
                "category": "Figurines",
                "images": ["https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Updated+Dragon"],
                "variants": [],
                "stock": 8
            }
            self.run_test("Update Product", "PUT", f"products/{product_ids[0]}", 200, 
                         data=update_data, use_admin=True)
            
            # Test delete product (admin only)
            if len(product_ids) > 1:
                self.run_test("Delete Product", "DELETE", f"products/{product_ids[1]}", 200, use_admin=True)
        
        # Test get non-existent product
        self.run_test("Get Non-existent Product", "GET", "products/non-existent-id", 404)

    def test_order_endpoints(self):
        """Test order-related endpoints"""
        print("\n🛒 Testing Order Endpoints...")
        
        # Create a test order
        order_data = {
            "items": [
                {
                    "product_id": "test-product-id",
                    "product_name": "Test Product",
                    "quantity": 2,
                    "price": 29.99,
                    "variant": None
                }
            ],
            "total": 59.98
        }
        
        success, order_response = self.run_test("Create Order", "POST", "orders", 200, data=order_data)
        
        if success and 'id' in order_response:
            order_id = order_response['id']
            
            # Test get user orders
            self.run_test("Get User Orders", "GET", "orders", 200)
            
            # Test get single order
            self.run_test("Get Single Order", "GET", f"orders/{order_id}", 200)
            
            return order_id
        
        return None

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        # Test get all orders (admin only)
        self.run_test("Get All Orders (Admin)", "GET", "admin/orders", 200, use_admin=True)
        
        # Test update order status (admin only)
        # First create an order to update
        order_data = {
            "items": [
                {
                    "product_id": "test-product-id",
                    "product_name": "Test Product",
                    "quantity": 1,
                    "price": 19.99,
                    "variant": None
                }
            ],
            "total": 19.99
        }
        
        success, order_response = self.run_test("Create Order for Status Update", "POST", "orders", 200, data=order_data)
        
        if success and 'id' in order_response:
            order_id = order_response['id']
            self.run_test("Update Order Status", "PUT", f"admin/orders/{order_id}/status?status=processing", 200, use_admin=True)

    def test_checkout_endpoints(self):
        """Test checkout and payment endpoints"""
        print("\n💳 Testing Checkout Endpoints...")
        
        # Create an order first
        order_data = {
            "items": [
                {
                    "product_id": "test-product-id",
                    "product_name": "Test Product",
                    "quantity": 1,
                    "price": 29.99,
                    "variant": None
                }
            ],
            "total": 29.99
        }
        
        success, order_response = self.run_test("Create Order for Checkout", "POST", "orders", 200, data=order_data)
        
        if success and 'id' in order_response:
            order_id = order_response['id']
            
            # Test create checkout session
            checkout_data = {
                "order_id": order_id,
                "origin_url": self.base_url
            }
            
            self.run_test("Create Checkout Session", "POST", "checkout/session", 200, data=checkout_data)

    def cleanup_test_data(self):
        """Clean up test data from database"""
        print("\n🧹 Cleaning up test data...")
        try:
            import subprocess
            
            cleanup_script = '''
            use('prints_store');
            db.users.deleteMany({email: /test\.user\./});
            db.users.deleteMany({email: "admin@3dprints.com"});
            db.user_sessions.deleteMany({session_token: /test_session/});
            db.user_sessions.deleteMany({session_token: /admin_session/});
            db.products.deleteMany({name: /Dragon Figurine|Phone Stand|Updated Dragon/});
            db.orders.deleteMany({user_id: /test-user-|admin-user-/});
            print("Test data cleaned up");
            '''
            
            result = subprocess.run(['mongosh', '--eval', cleanup_script], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                print("✅ Test data cleaned up successfully")
            else:
                print(f"⚠️  Cleanup warning: {result.stderr}")
                
        except Exception as e:
            print(f"⚠️  Cleanup failed: {str(e)}")

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['name']}")
                if 'expected' in test:
                    print(f"    Expected: {test['expected']}, Got: {test['actual']}")
                if 'error' in test:
                    print(f"    Error: {test['error']}")

def main():
    print("🚀 Starting E-commerce API Testing...")
    
    tester = ECommerceAPITester()
    
    # Create test sessions
    if not tester.create_test_session():
        print("❌ Failed to create test sessions. Exiting.")
        return 1
    
    try:
        # Run all tests
        tester.test_public_endpoints()
        tester.test_auth_endpoints()
        tester.test_product_endpoints()
        tester.test_order_endpoints()
        tester.test_admin_endpoints()
        tester.test_checkout_endpoints()
        
    finally:
        # Always cleanup
        tester.cleanup_test_data()
        
    # Print summary
    tester.print_summary()
    
    # Return appropriate exit code
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())