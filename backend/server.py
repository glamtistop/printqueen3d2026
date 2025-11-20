from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Header, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import requests
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from cloudinary_config import CloudinaryService
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe setup
stripe_api_key = os.environ.get('STRIPE_API_KEY')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: str = ""
    is_admin: bool = False
    hashed_password: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailPasswordLogin(BaseModel):
    email: str
    password: str

class SetPassword(BaseModel):
    password: str

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductVariant(BaseModel):
    name: str
    value: str
    price_adjustment: float = 0.0

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    images: List[str]
    variants: List[ProductVariant] = []
    stock: int
    is_custom: bool = False
    custom_page_url: Optional[str] = None
    published: bool = True
    collection_ids: List[str] = []
    badge: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    images: List[str]
    variants: List[ProductVariant] = []
    stock: int
    published: bool = True
    collection_ids: List[str] = []
    badge: Optional[str] = None

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None

class CollectionRule(BaseModel):
    field: str  # e.g., "category", "price"
    operator: str  # e.g., "equals", "less_than", "greater_than", "contains"
    value: str

class Collection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    type: str = "manual"  # manual or automated
    product_ids: List[str] = []
    rules: List[CollectionRule] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = "manual"
    product_ids: List[str] = []
    rules: List[CollectionRule] = []

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    variant: Optional[Dict[str, str]] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[OrderItem]
    total: float
    status: str = "pending"  # pending, processing, shipped, completed, cancelled
    payment_session_id: Optional[str] = None
    tracking_number: Optional[str] = None
    shipping_carrier: Optional[str] = None
    fulfilled_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[OrderItem]
    total: float

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: Optional[str] = None
    amount: float
    currency: str
    payment_status: str  # pending, paid, failed, expired
    metadata: Optional[Dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionDataRequest(BaseModel):
    pass

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str

# ============ AUTH HELPERS ============

async def get_current_user(request: Request, authorization: Optional[str] = Header(None)) -> Optional[User]:
    """Get current user from session token in cookie or Authorization header"""
    session_token = None
    
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    # Get session from database
    session = await db.user_sessions.find_one({"session_token": session_token})
    if not session:
        return None
    
    # Check if session is expired
    if isinstance(session['expires_at'], str):
        expires_at = datetime.fromisoformat(session['expires_at'])
    else:
        expires_at = session['expires_at']
    
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        return None
    
    # Get user
    user_doc = await db.users.find_one({"id": session["user_id"]})
    if not user_doc:
        return None
    
    # Convert datetime strings to datetime objects
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

async def require_auth(request: Request, authorization: Optional[str] = Header(None)) -> User:
    """Require authentication"""
    user = await get_current_user(request, authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(request: Request, authorization: Optional[str] = Header(None)) -> User:
    """Require admin authentication"""
    user = await require_auth(request, authorization)
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============ AUTH ROUTES ============

@api_router.post("/auth/session")
async def process_session(request: Request, x_session_id: str = Header(..., alias="X-Session-ID")):
    """Process Emergent Auth session ID and create user session"""
    try:
        # Call Emergent Auth API to get session data (use GET not POST!)
        response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": x_session_id}
        )
        response.raise_for_status()
        session_data = response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": session_data["email"]})
        
        if existing_user:
            user_id = existing_user["id"]
        else:
            # Create new user
            user = User(
                email=session_data["email"],
                name=session_data["name"],
                picture=session_data["picture"],
                is_admin=False
            )
            user_dict = user.model_dump()
            user_dict['created_at'] = user_dict['created_at'].isoformat()
            await db.users.insert_one(user_dict)
            user_id = user.id
        
        # Create session
        session_token = session_data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        user_session = UserSession(
            user_id=user_id,
            session_token=session_token,
            expires_at=expires_at
        )
        session_dict = user_session.model_dump()
        session_dict['expires_at'] = session_dict['expires_at'].isoformat()
        session_dict['created_at'] = session_dict['created_at'].isoformat()
        await db.user_sessions.insert_one(session_dict)
        
        # Create response with cookie
        response = JSONResponse(content={
            "id": user_id,
            "email": session_data["email"],
            "name": session_data["name"],
            "picture": session_data["picture"]
        })
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7*24*60*60
        )
        return response
        
    except Exception as e:
        logging.error(f"Session processing error: {e}")
        raise HTTPException(status_code=400, detail="Failed to process session")

@api_router.get("/auth/me")
async def get_me(user: User = Depends(require_auth)):
    """Get current user info"""
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(key="session_token", path="/")
    return response

# ============ EMAIL/PASSWORD AUTH (BACKUP METHOD) ============

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

@api_router.post("/auth/set-password")
async def set_password(password_data: SetPassword, user: User = Depends(require_auth)):
    """Set password for existing user (authenticated users only)"""
    if len(password_data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    hashed_password = hash_password(password_data.password)
    
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"hashed_password": hashed_password}}
    )
    
    return {"message": "Password set successfully"}

@api_router.post("/auth/login")
async def email_password_login(login_data: EmailPasswordLogin):
    """Login with email and password (backup authentication method)"""
    # Find user by email
    user_doc = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user has a password set
    if not user_doc.get("hashed_password"):
        raise HTTPException(status_code=401, detail="Password not set. Please use Google login.")
    
    # Verify password
    if not verify_password(login_data.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create session
    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    user_session = UserSession(
        user_id=user_doc["id"],
        session_token=session_token,
        expires_at=expires_at
    )
    session_dict = user_session.model_dump()
    session_dict['expires_at'] = session_dict['expires_at'].isoformat()
    session_dict['created_at'] = session_dict['created_at'].isoformat()
    await db.user_sessions.insert_one(session_dict)
    
    # Create response with cookie
    response = JSONResponse(content={
        "message": "Login successful",
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "is_admin": user_doc.get("is_admin", False)
        }
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return response

# ============ PRODUCT ROUTES ============

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    """Get all products"""
    query = {}
    if category:
        query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.get("/products/featured/list", response_model=List[Product])
async def get_featured_products(limit: int = 6):
    """Get featured products (up to 6 for homepage)"""
    # Find the Featured collection
    featured_collection = await db.product_collections.find_one(
        {"name": {"$regex": "^featured$", "$options": "i"}},
        {"_id": 0}
    )
    
    if not featured_collection:
        # If no featured collection, return latest published products
        products = await db.products.find(
            {"published": True},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
    else:
        # Get products in the featured collection that are published
        products = await db.products.find(
            {
                "collection_ids": featured_collection["id"],
                "published": True
            },
            {"_id": 0}
        ).limit(limit).to_list(limit)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get single product"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return product

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, user: User = Depends(require_admin)):
    """Create new product (admin only)"""
    product = Product(**product_data.model_dump())
    product_dict = product.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    await db.products.insert_one(product_dict)
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, user: User = Depends(require_admin)):
    """Update product (admin only)"""
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_dict = product_data.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update_dict})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: User = Depends(require_admin)):
    """Delete product (admin only)"""
    # Get product to find images
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Delete images from Cloudinary
    if product.get("images"):
        for image_url in product["images"]:
            if "cloudinary" in image_url:
                try:
                    public_id = image_url.split("/")[-1].split(".")[0]
                    CloudinaryService.delete_image(f"products/{public_id}")
                except:
                    pass
    
    result = await db.products.delete_one({"id": product_id})
    return {"message": "Product deleted successfully"}

@api_router.patch("/products/{product_id}/publish")
async def toggle_product_publish(product_id: str, published: bool, user: User = Depends(require_admin)):
    """Toggle product publish status"""
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {"published": published, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": f"Product {'published' if published else 'unpublished'} successfully"}

@api_router.post("/products/{product_id}/duplicate", response_model=Product)
async def duplicate_product(product_id: str, user: User = Depends(require_admin)):
    """Duplicate an existing product"""
    # Get the original product
    original = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create a new product with copied data
    new_product = Product(
        id=str(uuid.uuid4()),
        name=f"{original['name']} (Copy)",
        description=original.get('description', ''),
        price=original.get('price', 0),
        category=original.get('category', ''),
        images=original.get('images', []),
        variants=original.get('variants', []),
        stock=original.get('stock', 0),
        is_custom=original.get('is_custom', False),
        custom_page_url=original.get('custom_page_url'),
        published=False,  # Start as draft
        collection_ids=original.get('collection_ids', []),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    # Save to database
    product_dict = new_product.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    product_dict['updated_at'] = product_dict['updated_at'].isoformat()
    await db.products.insert_one(product_dict)
    
    return new_product

@api_router.post("/products/bulk-delete")
async def bulk_delete_products(product_ids: List[str], user: User = Depends(require_admin)):
    """Bulk delete products"""
    deleted_count = 0
    for product_id in product_ids:
        try:
            product = await db.products.find_one({"id": product_id})
            if product:
                # Delete images from Cloudinary
                if product.get("images"):
                    for image_url in product["images"]:
                        if "cloudinary" in image_url:
                            try:
                                public_id = image_url.split("/")[-1].split(".")[0]
                                CloudinaryService.delete_image(f"products/{public_id}")
                            except:
                                pass
                
                await db.products.delete_one({"id": product_id})
                deleted_count += 1
        except:
            continue
    
    return {"message": f"Deleted {deleted_count} products successfully"}

@api_router.post("/upload/image")
async def upload_product_image(file: UploadFile = File(...), user: User = Depends(require_admin)):
    """Upload product image to Cloudinary"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        content = await file.read()
        logging.info(f"Uploading image: {file.filename}, size: {len(content)} bytes")
        result = CloudinaryService.upload_image(content, folder="products")
        logging.info(f"Upload successful: {result.get('public_id')}")
        return result
    except Exception as e:
        logging.error(f"Upload failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/upload/image/{public_id}")
async def delete_product_image(public_id: str, user: User = Depends(require_admin)):
    """Delete product image from Cloudinary"""
    try:
        result = CloudinaryService.delete_image(public_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ CATEGORY ROUTES ============

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    """Get all categories"""
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    for category in categories:
        if isinstance(category.get('created_at'), str):
            category['created_at'] = datetime.fromisoformat(category['created_at'])
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate, user: User = Depends(require_admin)):
    """Create new category"""
    category = Category(**category_data.model_dump())
    category_dict = category.model_dump()
    category_dict['created_at'] = category_dict['created_at'].isoformat()
    await db.categories.insert_one(category_dict)
    return category

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_data: CategoryCreate, user: User = Depends(require_admin)):
    """Update category"""
    existing = await db.categories.find_one({"id": category_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_dict = category_data.model_dump()
    await db.categories.update_one({"id": category_id}, {"$set": update_dict})
    
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user: User = Depends(require_admin)):
    """Delete category"""
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

@api_router.get("/category-names")
async def get_category_names():
    """Get category names for filtering (backward compatible)"""
    # Get unique category names from products for filtering
    categories = await db.products.distinct("category")
    return categories

# ============ COLLECTION ROUTES ============

@api_router.get("/collections", response_model=List[Collection])
async def get_collections():
    """Get all collections"""
    collections = await db.collections.find({}, {"_id": 0}).to_list(1000)
    for collection in collections:
        if isinstance(collection.get('created_at'), str):
            collection['created_at'] = datetime.fromisoformat(collection['created_at'])
    return collections

@api_router.post("/collections", response_model=Collection)
async def create_collection(collection_data: CollectionCreate, user: User = Depends(require_admin)):
    """Create new collection"""
    collection = Collection(**collection_data.model_dump())
    collection_dict = collection.model_dump()
    collection_dict['created_at'] = collection_dict['created_at'].isoformat()
    await db.collections.insert_one(collection_dict)
    return collection

@api_router.put("/collections/{collection_id}", response_model=Collection)
async def update_collection(collection_id: str, collection_data: CollectionCreate, user: User = Depends(require_admin)):
    """Update collection"""
    existing = await db.collections.find_one({"id": collection_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    update_dict = collection_data.model_dump()
    await db.collections.update_one({"id": collection_id}, {"$set": update_dict})
    
    updated = await db.collections.find_one({"id": collection_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str, user: User = Depends(require_admin)):
    """Delete collection"""
    result = await db.collections.delete_one({"id": collection_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")
    return {"message": "Collection deleted successfully"}

# ============ ORDER ROUTES ============

@api_router.get("/orders", response_model=List[Order])
async def get_orders(user: User = Depends(require_auth)):
    """Get user orders"""
    orders = await db.orders.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, user: User = Depends(require_auth)):
    """Create new order"""
    order = Order(
        user_id=user.id,
        items=order_data.items,
        total=order_data.total,
        status="pending"
    )
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    await db.orders.insert_one(order_dict)
    return order

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, user: User = Depends(require_auth)):
    """Get single order"""
    order = await db.orders.find_one({"id": order_id, "user_id": user.id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    return order

# ============ PAYMENT ROUTES ============

@api_router.post("/checkout/session")
async def create_checkout_session(checkout_req: CheckoutRequest, user: User = Depends(require_auth)):
    """Create Stripe checkout session"""
    # Get order
    order = await db.orders.find_one({"id": checkout_req.order_id, "user_id": user.id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Initialize Stripe
    webhook_url = f"{checkout_req.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Create success and cancel URLs
    success_url = f"{checkout_req.origin_url}/order-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{checkout_req.origin_url}/checkout"
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=float(order["total"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order["id"],
            "user_id": user.id,
            "user_email": user.email
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        session_id=session.session_id,
        user_id=user.id,
        amount=float(order["total"]),
        currency="usd",
        payment_status="pending",
        metadata={
            "order_id": order["id"]
        }
    )
    transaction_dict = transaction.model_dump()
    transaction_dict['created_at'] = transaction_dict['created_at'].isoformat()
    await db.payment_transactions.insert_one(transaction_dict)
    
    # Update order with payment session ID
    await db.orders.update_one(
        {"id": order["id"]},
        {"$set": {"payment_session_id": session.session_id}}
    )
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, user: User = Depends(require_auth)):
    """Get checkout session status"""
    # Check if already processed
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment transaction not found")
    
    # If already paid, return existing status
    if transaction["payment_status"] == "paid":
        return {
            "status": "complete",
            "payment_status": "paid",
            "session_id": session_id
        }
    
    # Check with Stripe
    webhook_url = f"{os.environ.get('REACT_APP_BACKEND_URL', '')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    checkout_status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction status
    if checkout_status.payment_status == "paid" and transaction["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid"}}
        )
        
        # Update order status
        if transaction.get("metadata") and transaction["metadata"].get("order_id"):
            await db.orders.update_one(
                {"id": transaction["metadata"]["order_id"]},
                {"$set": {"status": "processing"}}
            )
    
    return {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "session_id": session_id
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    webhook_url = f"{os.environ.get('REACT_APP_BACKEND_URL', '')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": webhook_response.payment_status}}
            )
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

# ============ ADMIN ROUTES ============

@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(user: User = Depends(require_admin)):
    """Get all orders (admin only)"""
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user: User = Depends(require_admin)):
    """Update order status (admin only)"""
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}

class OrderFulfillment(BaseModel):
    tracking_number: Optional[str] = None
    shipping_carrier: Optional[str] = None
    notes: Optional[str] = None

@api_router.put("/admin/orders/{order_id}/fulfill")
async def fulfill_order(order_id: str, fulfillment: OrderFulfillment, user: User = Depends(require_admin)):
    """Fulfill order with tracking info"""
    update_data = {
        "status": "shipped",
        "fulfilled_at": datetime.now(timezone.utc).isoformat()
    }
    if fulfillment.tracking_number:
        update_data["tracking_number"] = fulfillment.tracking_number
    if fulfillment.shipping_carrier:
        update_data["shipping_carrier"] = fulfillment.shipping_carrier
    if fulfillment.notes:
        update_data["notes"] = fulfillment.notes
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order fulfilled successfully"}

@api_router.get("/admin/customers")
async def get_all_customers(user: User = Depends(require_admin)):
    """Get all customers with order stats"""
    users = await db.users.find({"is_admin": False}, {"_id": 0}).to_list(1000)
    
    customers = []
    for usr in users:
        # Get order count and total spent
        orders = await db.orders.find({"user_id": usr["id"]}).to_list(1000)
        total_orders = len(orders)
        total_spent = sum(order.get("total", 0) for order in orders)
        
        customers.append({
            "id": usr["id"],
            "email": usr["email"],
            "name": usr["name"],
            "created_at": usr.get("created_at"),
            "total_orders": total_orders,
            "total_spent": total_spent
        })
    
    return customers

# ============ NFC STAND ROUTES ============

from fastapi import File, UploadFile, Form
import base64

@api_router.post("/nfc-stand/order")
async def create_nfc_stand_order(
    logo: UploadFile = File(...),
    baseOption: str = Form(...),
    baseOptionName: str = Form(...),
    primaryColor: str = Form(...),
    secondaryColor: str = Form(...),
    nfcLinks: str = Form(...),
    totalPrice: float = Form(...),
    userEmail: str = Form(...),
    userName: str = Form(...)
):
    """Create custom NFC stand order and send email notification"""
    try:
        # Read logo file
        logo_contents = await logo.read()
        logo_base64 = base64.b64encode(logo_contents).decode('utf-8')
        
        # Parse NFC links
        import json
        nfc_links_list = json.loads(nfcLinks)
        
        # Create order record
        order_data = {
            "id": str(uuid.uuid4()),
            "type": "nfc_stand",
            "user_email": userEmail,
            "user_name": userName,
            "base_option": baseOption,
            "base_option_name": baseOptionName,
            "primary_color": primaryColor,
            "secondary_color": secondaryColor,
            "nfc_links": nfc_links_list,
            "logo_filename": logo.filename,
            "logo_data": logo_base64,
            "total_price": totalPrice,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.nfc_stand_orders.insert_one(order_data)
        
        # Send email notification (mock implementation - you'll need to configure actual email service)
        email_body = f"""
        New Custom NFC Stand Order Received!
        
        Order ID: {order_data['id']}
        Customer: {userName} ({userEmail})
        
        Configuration:
        - Base: {baseOptionName}
        - Primary Color: {primaryColor}
        - Secondary Color: {secondaryColor}
        - NFC Links: {', '.join(nfc_links_list)}
        - Total Price: ${totalPrice:.2f}
        
        Logo attached (base64 encoded)
        
        Please check the admin dashboard for full details.
        """
        
        logger.info(f"NFC Stand Order Created: {order_data['id']}")
        logger.info(f"Email notification would be sent to admin with order details: {email_body[:100]}...")
        
        # In production, integrate with SendGrid, AWS SES, or similar email service
        # Example with SendGrid:
        # from sendgrid import SendGridAPIClient
        # from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
        # 
        # message = Mail(
        #     from_email='noreply@printqueen3d.com',
        #     to_emails='admin@printqueen3d.com',
        #     subject=f'New NFC Stand Order - {order_data["id"]}',
        #     html_content=email_body
        # )
        # 
        # attached_file = Attachment(
        #     FileContent(logo_base64),
        #     FileName(logo.filename),
        #     FileType('image/png'),
        #     Disposition('attachment')
        # )
        # message.attachment = attached_file
        # 
        # sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        # response = sg.send(message)
        
        return {
            "success": True,
            "order_id": order_data['id'],
            "message": "Order submitted successfully! You will receive a confirmation email shortly."
        }
        
    except Exception as e:
        logger.error(f"NFC Stand Order Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process order")

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()