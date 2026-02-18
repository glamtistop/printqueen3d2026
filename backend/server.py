from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Header, UploadFile, File, BackgroundTasks
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
import resend

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
    stock: int = 0
    is_custom: bool = False
    custom_page_url: Optional[str] = None
    published: bool = True
    collection_ids: List[str] = []
    badge: Optional[str] = None
    available_colors: List[str] = []
    material_details: Optional[str] = None
    custom_builder: Optional[str] = None
    # Pickup settings
    available_for_pickup: bool = True  # Whether this product can be picked up
    pickup_only: bool = False  # If true, shipping is not available
    pickup_location_ids: List[str] = []  # Specific locations that can fulfill this product (empty = all)
    estimated_prep_time: Optional[int] = None  # Estimated prep time in hours for pickup orders
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    images: List[str]
    variants: List[ProductVariant] = []
    stock: int = 0
    published: bool = True
    collection_ids: List[str] = []
    badge: Optional[str] = None
    available_colors: List[str] = []
    material_details: Optional[str] = None
    custom_builder: Optional[str] = None
    # Pickup settings
    available_for_pickup: bool = True
    pickup_only: bool = False
    pickup_location_ids: List[str] = []
    estimated_prep_time: Optional[int] = None

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
    customization: Optional[Dict] = None  # For custom products (colors, images, etc.)
    product_image: Optional[str] = None  # Product thumbnail

class CustomerInfo(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None

class ShippingAddress(BaseModel):
    street: str
    city: str
    state: str
    zip_code: str
    country: str = "US"

class PickupDetails(BaseModel):
    location_id: str
    location_name: str
    location_address: str
    pickup_date: str  # YYYY-MM-DD
    pickup_time: str  # HH:MM

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[OrderItem]
    total: float
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    shipping_amount: Optional[float] = None
    # Status: pending, processing, fulfilled, shipped, picked_up, completed, cancelled
    status: str = "pending"
    # Fulfillment type: shipping or pickup
    fulfillment_type: str = "shipping"  # "shipping" or "pickup"
    # Customer info
    customer_info: Optional[CustomerInfo] = None
    # Shipping details (for shipping orders)
    shipping_address: Optional[ShippingAddress] = None
    tracking_number: Optional[str] = None
    shipping_carrier: Optional[str] = None
    # Pickup details (for pickup orders)
    pickup_details: Optional[PickupDetails] = None
    # Timestamps
    payment_session_id: Optional[str] = None
    fulfilled_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    # Notes
    notes: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[OrderItem]
    total: float
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    shipping_amount: Optional[float] = None
    fulfillment_type: str = "shipping"
    customer_info: Optional[CustomerInfo] = None
    shipping_address: Optional[ShippingAddress] = None
    pickup_details: Optional[PickupDetails] = None

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

# ============ SITE EDITOR MODELS ============

class SocialLinks(BaseModel):
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    tiktok: Optional[str] = None
    youtube: Optional[str] = None

class BrandColors(BaseModel):
    primary: str = "#3B82F6"  # Blue
    secondary: str = "#10B981"  # Emerald
    accent: str = "#F59E0B"  # Amber

class ContactInfo(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class AppIcons(BaseModel):
    favicon_32: Optional[str] = None  # 32x32 browser tab
    apple_touch_180: Optional[str] = None  # 180x180 iPhone
    android_192: Optional[str] = None  # 192x192 Android
    pwa_512: Optional[str] = None  # 512x512 PWA splash

class HeroImages(BaseModel):
    desktop_images: List[str] = []  # Up to 6 images for carousel
    mobile_image: Optional[str] = None  # Single mobile hero image

class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "site_settings"  # Singleton document
    logo_url: Optional[str] = None
    site_name: str = "Print Queen 3D"
    tagline: str = "Custom 3D Printed Creations"
    brand_colors: BrandColors = Field(default_factory=BrandColors)
    contact_info: ContactInfo = Field(default_factory=ContactInfo)
    social_links: SocialLinks = Field(default_factory=SocialLinks)
    app_icons: AppIcons = Field(default_factory=AppIcons)
    hero_images: HeroImages = Field(default_factory=HeroImages)
    footer_text: str = "All rights reserved."
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteSettingsUpdate(BaseModel):
    logo_url: Optional[str] = None
    site_name: Optional[str] = None
    tagline: Optional[str] = None
    brand_colors: Optional[BrandColors] = None
    contact_info: Optional[ContactInfo] = None
    social_links: Optional[SocialLinks] = None
    app_icons: Optional[AppIcons] = None
    hero_images: Optional[HeroImages] = None
    footer_text: Optional[str] = None

class SectionContent(BaseModel):
    headline: Optional[str] = None
    subheadline: Optional[str] = None
    description: Optional[str] = None
    button_text: Optional[str] = None
    button_link: Optional[str] = None
    image_url: Optional[str] = None
    background_image_url: Optional[str] = None

class HomepageSection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    enabled: bool = True
    order: int = 0
    content: SectionContent = Field(default_factory=SectionContent)

class HomepageSectionsConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "homepage_sections"
    sections: List[HomepageSection] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HomepageSectionsUpdate(BaseModel):
    sections: List[HomepageSection]

# ============ STRIPE SETTINGS MODELS ============

class StripeSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "stripe_settings"
    publishable_key: Optional[str] = None  # pk_test_xxx or pk_live_xxx
    test_mode: bool = True  # True = test keys, False = live keys
    currency: str = "usd"
    enable_apple_pay: bool = True
    enable_google_pay: bool = True
    enable_link: bool = True  # Stripe Link one-click checkout
    tax_rate: float = 0.0  # Tax percentage (e.g., 8.25 for 8.25%)
    free_shipping_threshold: float = 50.0  # Free shipping above this amount
    flat_shipping_rate: float = 5.99  # Shipping cost below threshold
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StripeSettingsUpdate(BaseModel):
    publishable_key: Optional[str] = None
    test_mode: Optional[bool] = None
    currency: Optional[str] = None
    enable_apple_pay: Optional[bool] = None
    enable_google_pay: Optional[bool] = None
    enable_link: Optional[bool] = None
    tax_rate: Optional[float] = None
    free_shipping_threshold: Optional[float] = None
    flat_shipping_rate: Optional[float] = None

# ============ EMAIL SETTINGS MODELS ============

class EmailSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "email_settings"
    provider: str = "resend"  # Email provider (resend, sendgrid, etc.)
    api_key: Optional[str] = None  # Resend API key
    sender_email: str = "noreply@example.com"  # From address
    sender_name: str = "Print Queen 3D"  # From name
    enabled: bool = False  # Enable/disable email notifications
    # Notification toggles
    send_order_confirmation: bool = True
    send_status_updates: bool = True
    send_welcome_emails: bool = True
    # Admin notification email
    admin_email: Optional[str] = None  # Where to send admin notifications
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailSettingsUpdate(BaseModel):
    provider: Optional[str] = None
    api_key: Optional[str] = None
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None
    enabled: Optional[bool] = None
    send_order_confirmation: Optional[bool] = None
    send_status_updates: Optional[bool] = None
    send_welcome_emails: Optional[bool] = None
    admin_email: Optional[str] = None

class TestEmailRequest(BaseModel):
    recipient_email: str

# ============ CUSTOM BUILDER MODELS ============

class BuilderFieldOption(BaseModel):
    """Option for select/radio/checkbox fields"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    value: str
    price_adjustment: float = 0.0  # Add/subtract from base price
    image_url: Optional[str] = None  # Optional image for the option
    description: Optional[str] = None

class BuilderField(BaseModel):
    """Individual field in a custom builder"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # text, textarea, select, color, color_dual, image, checkbox, number, radio, icon_select
    label: str
    name: str  # Field name for form data
    placeholder: Optional[str] = None
    description: Optional[str] = None
    required: bool = False
    order: int = 0
    # Field-specific settings
    options: List[BuilderFieldOption] = []  # For select, radio, checkbox, icon_select
    min_value: Optional[float] = None  # For number fields
    max_value: Optional[float] = None  # For number fields
    default_value: Optional[str] = None
    # Color picker specific
    color_options: List[str] = []  # Predefined color options (hex codes)
    allow_custom_color: bool = True
    # Conditional display
    show_if_field: Optional[str] = None  # Field name to check
    show_if_value: Optional[str] = None  # Value that triggers display

class CustomBuilder(BaseModel):
    """Custom product builder configuration"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "NFC Stand Builder"
    slug: str  # e.g., "nfc-stand-builder" - URL friendly
    description: Optional[str] = None
    # Builder configuration
    fields: List[BuilderField] = []
    # Base product options (like the stand variants)
    base_options: List[BuilderFieldOption] = []
    base_option_label: str = "Select Your Base"  # Label for base selection
    show_base_options: bool = True
    # Styling
    accent_color: str = "#3B82F6"  # Primary accent color
    # Settings
    enabled: bool = True
    show_price_calculator: bool = True
    submit_button_text: str = "Add to Cart"
    success_message: str = "Your custom product has been added to cart!"
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomBuilderCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    fields: List[BuilderField] = []
    base_options: List[BuilderFieldOption] = []
    base_option_label: str = "Select Your Base"
    show_base_options: bool = True
    accent_color: str = "#3B82F6"
    enabled: bool = True
    show_price_calculator: bool = True
    submit_button_text: str = "Add to Cart"
    success_message: str = "Your custom product has been added to cart!"

class CustomBuilderUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[BuilderField]] = None
    base_options: Optional[List[BuilderFieldOption]] = None
    base_option_label: Optional[str] = None
    show_base_options: Optional[bool] = None
    accent_color: Optional[str] = None
    enabled: Optional[bool] = None
    show_price_calculator: Optional[bool] = None
    submit_button_text: Optional[str] = None
    success_message: Optional[str] = None

# ============ PICKUP LOCATION MODELS ============

class PickupTimeSlot(BaseModel):
    start_time: str  # e.g., "10:00"
    end_time: str    # e.g., "11:00"

class PickupDaySchedule(BaseModel):
    day: str  # e.g., "monday", "tuesday", etc.
    enabled: bool = True
    time_slots: List[PickupTimeSlot] = []

class PickupLocation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "Print Queen HQ"
    address: str
    city: str
    state: str
    zip_code: str
    phone: Optional[str] = None
    hours_display: Optional[str] = None  # e.g., "Mon-Sat 10am-9pm" for display
    schedule: List[PickupDaySchedule] = []  # Detailed schedule with time slots
    notes: Optional[str] = None  # Parking instructions, etc.
    enabled: bool = True
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PickupLocationCreate(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    phone: Optional[str] = None
    hours_display: Optional[str] = None
    schedule: List[PickupDaySchedule] = []
    notes: Optional[str] = None
    enabled: bool = True

class PickupLocationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    hours_display: Optional[str] = None
    schedule: Optional[List[PickupDaySchedule]] = None
    notes: Optional[str] = None
    enabled: Optional[bool] = None
    order: Optional[int] = None

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
async def get_products(category: Optional[str] = None, published: Optional[bool] = None, search: Optional[str] = None):
    """Get all products with optional filters"""
    query = {}
    if category:
        query["category"] = category
    if published is not None:
        query["published"] = published
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    
    # Apply search filter if provided
    if search:
        search_lower = search.lower()
        products = [p for p in products if search_lower in p.get('name', '').lower() or search_lower in p.get('description', '').lower()]
    
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
    """Get all category names from categories collection"""
    # Get all categories from the categories collection
    category_docs = await db.categories.find({}, {"_id": 0, "name": 1}).to_list(100)
    categories = [cat["name"] for cat in category_docs]
    return categories

# ============ COLLECTION ROUTES ============

@api_router.get("/collections", response_model=List[Collection])
async def get_collections():
    """Get all collections"""
    collections = await db.product_collections.find({}, {"_id": 0}).to_list(1000)
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
    await db.product_collections.insert_one(collection_dict)
    
    # If product_ids are provided, also update those products' collection_ids
    if collection_data.product_ids:
        for product_id in collection_data.product_ids:
            await db.products.update_one(
                {"id": product_id},
                {"$addToSet": {"collection_ids": collection.id}}
            )
    
    return collection

@api_router.put("/collections/{collection_id}", response_model=Collection)
async def update_collection(collection_id: str, collection_data: CollectionCreate, user: User = Depends(require_admin)):
    """Update collection"""
    existing = await db.product_collections.find_one({"id": collection_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Get old product_ids to determine what changed
    old_product_ids = set(existing.get('product_ids', []))
    new_product_ids = set(collection_data.product_ids)
    
    # Products to add to collection
    added_products = new_product_ids - old_product_ids
    # Products to remove from collection
    removed_products = old_product_ids - new_product_ids
    
    # Update products' collection_ids
    for product_id in added_products:
        await db.products.update_one(
            {"id": product_id},
            {"$addToSet": {"collection_ids": collection_id}}
        )
    
    for product_id in removed_products:
        await db.products.update_one(
            {"id": product_id},
            {"$pull": {"collection_ids": collection_id}}
        )
    
    update_dict = collection_data.model_dump()
    await db.product_collections.update_one({"id": collection_id}, {"$set": update_dict})
    
    updated = await db.product_collections.find_one({"id": collection_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str, user: User = Depends(require_admin)):
    """Delete collection"""
    # First, remove this collection_id from all products
    await db.products.update_many(
        {"collection_ids": collection_id},
        {"$pull": {"collection_ids": collection_id}}
    )
    
    result = await db.product_collections.delete_one({"id": collection_id})
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
        subtotal=order_data.subtotal,
        tax_amount=order_data.tax_amount,
        shipping_amount=order_data.shipping_amount,
        fulfillment_type=order_data.fulfillment_type,
        customer_info=order_data.customer_info,
        shipping_address=order_data.shipping_address,
        pickup_details=order_data.pickup_details,
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
    update_data = {"status": status}
    
    # Add timestamp based on status
    if status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}

class OrderFulfillment(BaseModel):
    fulfillment_action: str = "ship"  # "ship", "pickup", "fulfill_only"
    tracking_number: Optional[str] = None
    shipping_carrier: Optional[str] = None
    admin_notes: Optional[str] = None

@api_router.put("/admin/orders/{order_id}/fulfill")
async def fulfill_order(order_id: str, fulfillment: OrderFulfillment, user: User = Depends(require_admin)):
    """Fulfill order - mark as shipped or ready for pickup"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {"fulfilled_at": now}
    
    if fulfillment.fulfillment_action == "ship":
        update_data["status"] = "shipped"
        update_data["shipped_at"] = now
        if fulfillment.tracking_number:
            update_data["tracking_number"] = fulfillment.tracking_number
        if fulfillment.shipping_carrier:
            update_data["shipping_carrier"] = fulfillment.shipping_carrier
    elif fulfillment.fulfillment_action == "pickup":
        update_data["status"] = "picked_up"
        update_data["picked_up_at"] = now
    else:  # fulfill_only - mark as fulfilled but not yet shipped/picked up
        update_data["status"] = "fulfilled"
    
    if fulfillment.admin_notes:
        update_data["admin_notes"] = fulfillment.admin_notes
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    return {"message": f"Order {fulfillment.fulfillment_action} successfully", "status": update_data["status"]}

@api_router.get("/admin/orders/{order_id}")
async def get_order_details(order_id: str, user: User = Depends(require_admin)):
    """Get detailed order info (admin only)"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get user info
    user_doc = await db.users.find_one({"id": order.get("user_id")}, {"_id": 0, "hashed_password": 0})
    
    # If pickup order, get location details
    pickup_location = None
    if order.get("pickup_details") and order["pickup_details"].get("location_id"):
        pickup_location = await db.pickup_locations.find_one(
            {"id": order["pickup_details"]["location_id"]}, 
            {"_id": 0}
        )
    
    return {
        "order": order,
        "user": user_doc,
        "pickup_location": pickup_location
    }

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

# ============ SITE EDITOR ROUTES ============

# Default homepage sections configuration
DEFAULT_SECTIONS = [
    {
        "id": "hero",
        "name": "Hero Banner",
        "enabled": True,
        "order": 1,
        "content": {
            "headline": "Custom 3D Printed Creations",
            "subheadline": "Bringing Your Ideas to Life",
            "description": "Discover unique 3D printed products crafted with precision and care.",
            "button_text": "Shop Now",
            "button_link": "/products"
        }
    },
    {
        "id": "marquee",
        "name": "Scrolling Marquee",
        "enabled": True,
        "order": 2,
        "content": {
            "headline": "FREE SHIPPING ON ORDERS OVER $50 • NEW ARRIVALS WEEKLY • CUSTOM ORDERS WELCOME"
        }
    },
    {
        "id": "categories",
        "name": "Category Grid",
        "enabled": True,
        "order": 3,
        "content": {
            "headline": "Shop by Category",
            "subheadline": "Find exactly what you're looking for"
        }
    },
    {
        "id": "featured",
        "name": "Featured Products",
        "enabled": True,
        "order": 4,
        "content": {
            "headline": "Featured Products",
            "subheadline": "Our most popular items"
        }
    },
    {
        "id": "why_choose_us",
        "name": "Why Choose Us",
        "enabled": True,
        "order": 5,
        "content": {
            "headline": "Why Choose Print Queen 3D?",
            "description": "Quality craftsmanship, fast shipping, and exceptional customer service."
        }
    },
    {
        "id": "newsletter",
        "name": "Newsletter Signup",
        "enabled": True,
        "order": 6,
        "content": {
            "headline": "Stay in the Loop",
            "description": "Subscribe for exclusive deals and new product announcements.",
            "button_text": "Subscribe"
        }
    }
]

@api_router.get("/site-config")
async def get_public_site_config():
    """Get public site configuration (no auth required)"""
    # Get site settings
    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        settings = SiteSettings().model_dump()
        settings['updated_at'] = settings['updated_at'].isoformat()
    
    # Get homepage sections
    sections_config = await db.homepage_sections.find_one({"id": "homepage_sections"}, {"_id": 0})
    if not sections_config:
        sections_config = {
            "id": "homepage_sections",
            "sections": DEFAULT_SECTIONS,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    return {
        "settings": settings,
        "homepage_sections": sections_config["sections"]
    }

@api_router.get("/admin/site-settings")
async def get_site_settings(user: User = Depends(require_admin)):
    """Get site settings (admin only)"""
    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        default_settings = SiteSettings()
        return default_settings.model_dump()
    return settings

@api_router.put("/admin/site-settings")
async def update_site_settings(settings_update: SiteSettingsUpdate, user: User = Depends(require_admin)):
    """Update site settings (admin only)"""
    update_data = {}
    settings_dict = settings_update.model_dump()
    
    # Process each field, including nested objects
    for k, v in settings_dict.items():
        if v is not None:
            if isinstance(v, dict):
                # For nested objects, filter out None values but keep empty strings
                filtered = {nk: nv for nk, nv in v.items() if nv is not None}
                if filtered:  # Only include if there's at least one non-None value
                    update_data[k] = filtered
            else:
                update_data[k] = v
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.site_settings.update_one(
        {"id": "site_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Site settings updated successfully"}

@api_router.get("/admin/homepage-sections")
async def get_homepage_sections(user: User = Depends(require_admin)):
    """Get homepage sections configuration (admin only)"""
    sections_config = await db.homepage_sections.find_one({"id": "homepage_sections"}, {"_id": 0})
    if not sections_config:
        # Return default sections
        return {
            "id": "homepage_sections",
            "sections": DEFAULT_SECTIONS,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    return sections_config

@api_router.put("/admin/homepage-sections")
async def update_homepage_sections(sections_update: HomepageSectionsUpdate, user: User = Depends(require_admin)):
    """Update homepage sections configuration (admin only)"""
    update_data = {
        "id": "homepage_sections",
        "sections": [section.model_dump() for section in sections_update.sections],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.homepage_sections.update_one(
        {"id": "homepage_sections"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Homepage sections updated successfully"}

# ============ STRIPE SETTINGS ROUTES ============

@api_router.get("/admin/stripe-settings")
async def get_stripe_settings(user: User = Depends(require_admin)):
    """Get Stripe configuration (admin only)"""
    settings = await db.stripe_settings.find_one({"id": "stripe_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        default_settings = StripeSettings()
        return default_settings.model_dump()
    return settings

@api_router.put("/admin/stripe-settings")
async def update_stripe_settings(settings_update: StripeSettingsUpdate, user: User = Depends(require_admin)):
    """Update Stripe configuration (admin only)"""
    update_data = {k: v for k, v in settings_update.model_dump().items() if v is not None}
    update_data["id"] = "stripe_settings"
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.stripe_settings.update_one(
        {"id": "stripe_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Stripe settings updated successfully"}

@api_router.get("/stripe-config")
async def get_public_stripe_config():
    """Get public Stripe config (publishable key only - no auth required)"""
    settings = await db.stripe_settings.find_one({"id": "stripe_settings"}, {"_id": 0})
    if not settings:
        settings = StripeSettings().model_dump()
    
    # Only return safe, public fields
    return {
        "publishable_key": settings.get("publishable_key"),
        "currency": settings.get("currency", "usd"),
        "enable_apple_pay": settings.get("enable_apple_pay", True),
        "enable_google_pay": settings.get("enable_google_pay", True),
        "enable_link": settings.get("enable_link", True),
        "tax_rate": settings.get("tax_rate", 0.0),
        "free_shipping_threshold": settings.get("free_shipping_threshold", 50.0),
        "flat_shipping_rate": settings.get("flat_shipping_rate", 5.99)
    }

# ============ EMAIL SETTINGS ROUTES ============

async def get_email_settings_from_db() -> Optional[Dict]:
    """Helper to get email settings from database"""
    settings = await db.email_settings.find_one({"id": "email_settings"}, {"_id": 0})
    return settings

async def send_email_via_resend(
    to_email: str,
    subject: str,
    html_content: str,
    api_key: str,
    sender_email: str,
    sender_name: str
) -> Dict:
    """Send email using Resend API"""
    try:
        resend.api_key = api_key
        sender = f"{sender_name} <{sender_email}>"
        
        params = {
            "from": sender,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        
        email_response = resend.Emails.send(params)
        
        if email_response and email_response.get("id"):
            return {"success": True, "email_id": email_response.get("id")}
        else:
            return {"success": False, "error": "No email ID returned"}
    except Exception as e:
        logging.error(f"Resend email error: {str(e)}")
        return {"success": False, "error": str(e)}

def generate_order_confirmation_email(order: Dict, customer_name: str, site_name: str = "Print Queen 3D") -> str:
    """Generate HTML for order confirmation email"""
    items_html = ""
    for item in order.get("items", []):
        items_html += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{item.get('product_name', 'Product')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">{item.get('quantity', 1)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.get('price', 0):.2f}</td>
        </tr>
        """
    
    fulfillment_info = ""
    if order.get("fulfillment_type") == "pickup":
        pickup = order.get("pickup_details", {})
        fulfillment_info = f"""
        <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin-top: 20px;">
            <h3 style="margin: 0 0 8px 0; color: #059669;">Pickup Information</h3>
            <p style="margin: 0; color: #047857;"><strong>{pickup.get('location_name', 'Store')}</strong></p>
            <p style="margin: 4px 0 0 0; color: #059669;">{pickup.get('location_address', '')}</p>
            <p style="margin: 4px 0 0 0; color: #059669;">Date: {pickup.get('pickup_date', '')} at {pickup.get('pickup_time', '')}</p>
        </div>
        """
    else:
        shipping = order.get("shipping_address", {})
        if shipping:
            fulfillment_info = f"""
            <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin-top: 20px;">
                <h3 style="margin: 0 0 8px 0; color: #2563eb;">Shipping Address</h3>
                <p style="margin: 0; color: #1d4ed8;">{shipping.get('street', '')}</p>
                <p style="margin: 4px 0 0 0; color: #1d4ed8;">{shipping.get('city', '')}, {shipping.get('state', '')} {shipping.get('zip_code', '')}</p>
            </div>
            """
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Thank you for your order</p>
            </div>
            <div style="padding: 32px;">
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">Hi {customer_name},</p>
                <p style="margin: 0 0 20px 0; color: #6b7280;">We've received your order and are getting it ready. Here's a summary:</p>
                
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Order Number</p>
                    <p style="margin: 4px 0 0 0; color: #111827; font-weight: 600; font-size: 18px;">#{order.get('id', '')[:8].upper()}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f9fafb;">
                            <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 14px;">Item</th>
                            <th style="padding: 12px; text-align: center; color: #6b7280; font-size: 14px;">Qty</th>
                            <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 14px;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #6b7280;">Subtotal</span>
                        <span style="color: #374151;">${order.get('subtotal', order.get('total', 0)):.2f}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #6b7280;">Tax</span>
                        <span style="color: #374151;">${order.get('tax_amount', 0):.2f}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #6b7280;">Shipping</span>
                        <span style="color: #374151;">${order.get('shipping_amount', 0):.2f}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 18px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                        <span style="color: #111827;">Total</span>
                        <span style="color: #10b981;">${order.get('total', 0):.2f}</span>
                    </div>
                </div>
                
                {fulfillment_info}
            </div>
            <div style="background: #f9fafb; padding: 24px; text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Questions? Reply to this email or contact us</p>
                <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">© {site_name}</p>
            </div>
        </div>
    </body>
    </html>
    """

def generate_status_update_email(order: Dict, new_status: str, customer_name: str, site_name: str = "Print Queen 3D") -> str:
    """Generate HTML for order status update email"""
    status_messages = {
        "processing": ("Order Processing", "We're preparing your order", "#f59e0b"),
        "fulfilled": ("Order Fulfilled", "Your order has been processed and is ready", "#10b981"),
        "shipped": ("Order Shipped", "Your order is on its way", "#3b82f6"),
        "picked_up": ("Order Picked Up", "Your order has been picked up", "#10b981"),
        "completed": ("Order Completed", "Thank you for your order", "#10b981"),
        "cancelled": ("Order Cancelled", "Your order has been cancelled", "#ef4444"),
    }
    
    title, message, color = status_messages.get(new_status, ("Status Update", f"Your order status is now: {new_status}", "#6b7280"))
    
    tracking_info = ""
    if new_status == "shipped" and order.get("tracking_number"):
        tracking_info = f"""
        <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin-top: 20px;">
            <h3 style="margin: 0 0 8px 0; color: #2563eb;">Tracking Information</h3>
            <p style="margin: 0; color: #1d4ed8;"><strong>Carrier:</strong> {order.get('shipping_carrier', 'N/A')}</p>
            <p style="margin: 4px 0 0 0; color: #1d4ed8;"><strong>Tracking #:</strong> {order.get('tracking_number', 'N/A')}</p>
        </div>
        """
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: {color}; padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">{title}</h1>
            </div>
            <div style="padding: 32px;">
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">Hi {customer_name},</p>
                <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 16px;">{message}</p>
                
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Order Number</p>
                    <p style="margin: 4px 0 0 0; color: #111827; font-weight: 600; font-size: 18px;">#{order.get('id', '')[:8].upper()}</p>
                </div>
                
                {tracking_info}
            </div>
            <div style="background: #f9fafb; padding: 24px; text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Questions? Reply to this email or contact us</p>
                <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">© {site_name}</p>
            </div>
        </div>
    </body>
    </html>
    """

def generate_welcome_email(user_name: str, user_email: str, site_name: str = "Print Queen 3D") -> str:
    """Generate HTML for welcome email"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to {site_name}!</h1>
            </div>
            <div style="padding: 32px;">
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">Hi {user_name},</p>
                <p style="margin: 0 0 20px 0; color: #6b7280;">Welcome! We're excited to have you join us. Your account has been created successfully.</p>
                
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Your Email</p>
                    <p style="margin: 4px 0 0 0; color: #111827; font-weight: 600;">{user_email}</p>
                </div>
                
                <p style="margin: 0 0 20px 0; color: #6b7280;">Here's what you can do:</p>
                <ul style="color: #6b7280; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Browse our collection of unique 3D printed products</li>
                    <li style="margin-bottom: 8px;">Customize your own NFC stands</li>
                    <li style="margin-bottom: 8px;">Track your orders in real-time</li>
                    <li style="margin-bottom: 8px;">Get exclusive deals and updates</li>
                </ul>
                
                <div style="text-align: center; margin-top: 32px;">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">Start Shopping</a>
                </div>
            </div>
            <div style="background: #f9fafb; padding: 24px; text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Questions? Reply to this email or contact us</p>
                <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">© {site_name}</p>
            </div>
        </div>
    </body>
    </html>
    """

async def send_order_confirmation_email_background(order_id: str):
    """Background task to send order confirmation email"""
    try:
        email_settings = await get_email_settings_from_db()
        if not email_settings or not email_settings.get("enabled") or not email_settings.get("send_order_confirmation"):
            return
        
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order:
            return
        
        customer_info = order.get("customer_info", {})
        customer_email = customer_info.get("email")
        customer_name = customer_info.get("name", "Customer")
        
        if not customer_email:
            return
        
        site_settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
        site_name = site_settings.get("site_name", "Print Queen 3D") if site_settings else "Print Queen 3D"
        
        html_content = generate_order_confirmation_email(order, customer_name, site_name)
        
        result = await send_email_via_resend(
            to_email=customer_email,
            subject=f"Order Confirmation - #{order_id[:8].upper()}",
            html_content=html_content,
            api_key=email_settings.get("api_key"),
            sender_email=email_settings.get("sender_email"),
            sender_name=email_settings.get("sender_name")
        )
        
        if result.get("success"):
            logging.info(f"Order confirmation email sent for order {order_id}")
        else:
            logging.error(f"Failed to send order confirmation email: {result.get('error')}")
    except Exception as e:
        logging.error(f"Error sending order confirmation email: {str(e)}")

async def send_status_update_email_background(order_id: str, new_status: str):
    """Background task to send order status update email"""
    try:
        email_settings = await get_email_settings_from_db()
        if not email_settings or not email_settings.get("enabled") or not email_settings.get("send_status_updates"):
            return
        
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order:
            return
        
        customer_info = order.get("customer_info", {})
        customer_email = customer_info.get("email")
        customer_name = customer_info.get("name", "Customer")
        
        if not customer_email:
            return
        
        site_settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
        site_name = site_settings.get("site_name", "Print Queen 3D") if site_settings else "Print Queen 3D"
        
        html_content = generate_status_update_email(order, new_status, customer_name, site_name)
        
        status_subjects = {
            "processing": "Your Order is Being Processed",
            "fulfilled": "Your Order is Ready",
            "shipped": "Your Order Has Shipped",
            "picked_up": "Your Order Has Been Picked Up",
            "completed": "Order Complete - Thank You!",
            "cancelled": "Order Cancelled"
        }
        subject = status_subjects.get(new_status, f"Order Update - #{order_id[:8].upper()}")
        
        result = await send_email_via_resend(
            to_email=customer_email,
            subject=subject,
            html_content=html_content,
            api_key=email_settings.get("api_key"),
            sender_email=email_settings.get("sender_email"),
            sender_name=email_settings.get("sender_name")
        )
        
        if result.get("success"):
            logging.info(f"Status update email sent for order {order_id}")
        else:
            logging.error(f"Failed to send status update email: {result.get('error')}")
    except Exception as e:
        logging.error(f"Error sending status update email: {str(e)}")

async def send_welcome_email_background(user_id: str):
    """Background task to send welcome email"""
    try:
        email_settings = await get_email_settings_from_db()
        if not email_settings or not email_settings.get("enabled") or not email_settings.get("send_welcome_emails"):
            return
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            return
        
        site_settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
        site_name = site_settings.get("site_name", "Print Queen 3D") if site_settings else "Print Queen 3D"
        
        html_content = generate_welcome_email(user.get("name", "Friend"), user.get("email"), site_name)
        
        result = await send_email_via_resend(
            to_email=user.get("email"),
            subject=f"Welcome to {site_name}!",
            html_content=html_content,
            api_key=email_settings.get("api_key"),
            sender_email=email_settings.get("sender_email"),
            sender_name=email_settings.get("sender_name")
        )
        
        if result.get("success"):
            logging.info(f"Welcome email sent to user {user_id}")
        else:
            logging.error(f"Failed to send welcome email: {result.get('error')}")
    except Exception as e:
        logging.error(f"Error sending welcome email: {str(e)}")

@api_router.get("/admin/email-settings")
async def get_email_settings(user: User = Depends(require_admin)):
    """Get email configuration (admin only)"""
    settings = await db.email_settings.find_one({"id": "email_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        default_settings = EmailSettings()
        settings_dict = default_settings.model_dump()
        settings_dict['updated_at'] = settings_dict['updated_at'].isoformat()
        return settings_dict
    
    # Ensure all default fields are present
    default_settings = EmailSettings()
    default_dict = default_settings.model_dump()
    default_dict['updated_at'] = default_dict['updated_at'].isoformat()
    
    # Merge with existing settings
    for key, value in default_dict.items():
        if key not in settings:
            settings[key] = value
    
    # Mask API key for security (show only first 3 and last 4 characters)
    if settings.get("api_key"):
        api_key = settings["api_key"]
        if len(api_key) > 7:
            settings["api_key"] = f"{api_key[:3]}{'*' * (len(api_key) - 7)}{api_key[-4:]}"
        else:
            settings["api_key"] = "****"
    
    return settings

@api_router.put("/admin/email-settings")
async def update_email_settings(settings_update: EmailSettingsUpdate, user: User = Depends(require_admin)):
    """Update email configuration (admin only)"""
    update_data = {k: v for k, v in settings_update.model_dump().items() if v is not None}
    update_data["id"] = "email_settings"
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.email_settings.update_one(
        {"id": "email_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Email settings updated successfully"}

@api_router.post("/admin/email-settings/test")
async def send_test_email(test_request: TestEmailRequest, user: User = Depends(require_admin)):
    """Send a test email to verify configuration"""
    settings = await db.email_settings.find_one({"id": "email_settings"}, {"_id": 0})
    
    if not settings or not settings.get("api_key"):
        raise HTTPException(status_code=400, detail="Email settings not configured. Please add your API key first.")
    
    site_settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    site_name = site_settings.get("site_name", "Print Queen 3D") if site_settings else "Print Queen 3D"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Test Email</h1>
            </div>
            <div style="padding: 32px;">
                <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">Hello!</p>
                <p style="margin: 0 0 20px 0; color: #6b7280;">This is a test email from your {site_name} store. If you received this, your email configuration is working correctly!</p>
                
                <div style="background: #ecfdf5; padding: 16px; border-radius: 8px;">
                    <p style="margin: 0; color: #059669; font-weight: 600;">✓ Email Configuration Successful</p>
                    <p style="margin: 8px 0 0 0; color: #047857; font-size: 14px;">Provider: {settings.get('provider', 'resend').upper()}</p>
                    <p style="margin: 4px 0 0 0; color: #047857; font-size: 14px;">Sender: {settings.get('sender_name')} &lt;{settings.get('sender_email')}&gt;</p>
                </div>
            </div>
            <div style="background: #f9fafb; padding: 24px; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">© {site_name}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    result = await send_email_via_resend(
        to_email=test_request.recipient_email,
        subject=f"Test Email from {site_name}",
        html_content=html_content,
        api_key=settings.get("api_key"),
        sender_email=settings.get("sender_email"),
        sender_name=settings.get("sender_name")
    )
    
    if result.get("success"):
        return {"message": f"Test email sent successfully to {test_request.recipient_email}", "email_id": result.get("email_id")}
    else:
        raise HTTPException(status_code=400, detail=f"Failed to send test email: {result.get('error')}")

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

# ============ PICKUP LOCATION ROUTES ============

# Default schedule for Mon-Sat 10am-9pm with hourly slots
def generate_default_schedule():
    """Generate default Mon-Sat 10am-9pm schedule with hourly time slots"""
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    schedule = []
    
    for day in days:
        time_slots = []
        for hour in range(10, 21):  # 10am to 9pm (last slot is 8pm-9pm)
            start = f"{hour:02d}:00"
            end = f"{hour+1:02d}:00" if hour < 21 else "21:00"
            time_slots.append({"start_time": start, "end_time": end})
        
        schedule.append({
            "day": day,
            "enabled": True,
            "time_slots": time_slots
        })
    
    # Sunday disabled by default
    schedule.append({
        "day": "sunday",
        "enabled": False,
        "time_slots": []
    })
    
    return schedule

@api_router.get("/admin/pickup-locations")
async def get_pickup_locations(user: User = Depends(require_admin)):
    """Get all pickup locations (admin only)"""
    locations = await db.pickup_locations.find({}, {"_id": 0}).to_list(100)
    
    # Sort by order field
    locations.sort(key=lambda x: x.get("order", 0))
    
    for location in locations:
        if isinstance(location.get('created_at'), str):
            location['created_at'] = datetime.fromisoformat(location['created_at'])
    
    return locations

@api_router.get("/pickup-locations")
async def get_public_pickup_locations():
    """Get enabled pickup locations (public - for checkout)"""
    locations = await db.pickup_locations.find({"enabled": True}, {"_id": 0}).to_list(100)
    
    # Sort by order field
    locations.sort(key=lambda x: x.get("order", 0))
    
    return locations

@api_router.get("/admin/pickup-locations/{location_id}")
async def get_pickup_location(location_id: str, user: User = Depends(require_admin)):
    """Get single pickup location (admin only)"""
    location = await db.pickup_locations.find_one({"id": location_id}, {"_id": 0})
    if not location:
        raise HTTPException(status_code=404, detail="Pickup location not found")
    
    if isinstance(location.get('created_at'), str):
        location['created_at'] = datetime.fromisoformat(location['created_at'])
    
    return location

@api_router.post("/admin/pickup-locations", response_model=PickupLocation)
async def create_pickup_location(location_data: PickupLocationCreate, user: User = Depends(require_admin)):
    """Create new pickup location (admin only)"""
    # Get current count for order
    count = await db.pickup_locations.count_documents({})
    
    # If no schedule provided, generate default
    schedule = location_data.schedule if location_data.schedule else generate_default_schedule()
    
    location = PickupLocation(
        name=location_data.name,
        address=location_data.address,
        city=location_data.city,
        state=location_data.state,
        zip_code=location_data.zip_code,
        phone=location_data.phone,
        hours_display=location_data.hours_display,
        schedule=schedule,
        notes=location_data.notes,
        enabled=location_data.enabled,
        order=count
    )
    
    location_dict = location.model_dump()
    location_dict['created_at'] = location_dict['created_at'].isoformat()
    
    await db.pickup_locations.insert_one(location_dict)
    return location

@api_router.put("/admin/pickup-locations/{location_id}")
async def update_pickup_location(location_id: str, location_data: PickupLocationUpdate, user: User = Depends(require_admin)):
    """Update pickup location (admin only)"""
    existing = await db.pickup_locations.find_one({"id": location_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Pickup location not found")
    
    update_data = {k: v for k, v in location_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.pickup_locations.update_one(
            {"id": location_id},
            {"$set": update_data}
        )
    
    updated = await db.pickup_locations.find_one({"id": location_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/pickup-locations/{location_id}")
async def delete_pickup_location(location_id: str, user: User = Depends(require_admin)):
    """Delete pickup location (admin only)"""
    result = await db.pickup_locations.delete_one({"id": location_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pickup location not found")
    return {"message": "Pickup location deleted successfully"}

@api_router.put("/admin/pickup-locations/{location_id}/toggle")
async def toggle_pickup_location(location_id: str, user: User = Depends(require_admin)):
    """Toggle pickup location enabled/disabled (admin only)"""
    location = await db.pickup_locations.find_one({"id": location_id})
    if not location:
        raise HTTPException(status_code=404, detail="Pickup location not found")
    
    new_status = not location.get("enabled", True)
    await db.pickup_locations.update_one(
        {"id": location_id},
        {"$set": {"enabled": new_status}}
    )
    
    return {"message": f"Pickup location {'enabled' if new_status else 'disabled'}", "enabled": new_status}

@api_router.get("/pickup-locations/{location_id}/available-slots")
async def get_available_pickup_slots(location_id: str, date: str):
    """Get available pickup time slots for a specific date"""
    location = await db.pickup_locations.find_one({"id": location_id, "enabled": True}, {"_id": 0})
    if not location:
        raise HTTPException(status_code=404, detail="Pickup location not found")
    
    # Parse the date and get day of week
    try:
        pickup_date = datetime.strptime(date, "%Y-%m-%d")
        day_name = pickup_date.strftime("%A").lower()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Find schedule for that day
    schedule = location.get("schedule", [])
    day_schedule = next((s for s in schedule if s.get("day") == day_name), None)
    
    if not day_schedule or not day_schedule.get("enabled"):
        return {"available_slots": [], "message": "No pickup available on this day"}
    
    # Return available time slots
    return {
        "location_id": location_id,
        "date": date,
        "day": day_name,
        "available_slots": day_schedule.get("time_slots", [])
    }


# ============ PRODUCT PICKUP AVAILABILITY ============

class CartProductItem(BaseModel):
    product_id: str
    quantity: int = 1

@api_router.post("/checkout/available-locations")
async def get_available_locations_for_cart(cart_items: List[CartProductItem]):
    """
    Get pickup locations that can fulfill ALL products in the cart.
    This filters locations based on each product's pickup_location_ids setting.
    """
    if not cart_items:
        return {"locations": [], "all_products_available": False, "unavailable_products": []}
    
    # Get all enabled pickup locations
    all_locations = await db.pickup_locations.find({"enabled": True}, {"_id": 0}).to_list(100)
    all_location_ids = {loc["id"] for loc in all_locations}
    
    # Get product IDs from cart
    product_ids = [item.product_id for item in cart_items]
    
    # Fetch products
    products = await db.products.find(
        {"id": {"$in": product_ids}},
        {"_id": 0, "id": 1, "name": 1, "available_for_pickup": 1, "pickup_only": 1, "pickup_location_ids": 1}
    ).to_list(100)
    
    # Build product map
    product_map = {p["id"]: p for p in products}
    
    # Track unavailable products and compatible locations
    unavailable_products = []
    compatible_location_ids = None
    shipping_available = True
    
    for item in cart_items:
        product = product_map.get(item.product_id)
        if not product:
            continue
        
        # Check if product is available for pickup
        if not product.get("available_for_pickup", True):
            unavailable_products.append({
                "product_id": item.product_id,
                "name": product.get("name", "Unknown"),
                "reason": "not_available_for_pickup"
            })
            continue
        
        # Check if product is pickup only
        if product.get("pickup_only", False):
            shipping_available = False
        
        # Get this product's compatible locations
        product_locations = product.get("pickup_location_ids", [])
        
        if product_locations:
            # Product has specific location restrictions
            product_location_set = set(product_locations)
            if compatible_location_ids is None:
                compatible_location_ids = product_location_set
            else:
                compatible_location_ids = compatible_location_ids.intersection(product_location_set)
        else:
            # Product available at all locations
            if compatible_location_ids is None:
                compatible_location_ids = all_location_ids
            # Don't narrow down if this product is available everywhere
    
    # If no products had restrictions, all locations are compatible
    if compatible_location_ids is None:
        compatible_location_ids = all_location_ids
    
    # Filter locations to only those compatible with all products
    compatible_locations = [
        loc for loc in all_locations 
        if loc["id"] in compatible_location_ids
    ]
    
    # Sort by order field
    compatible_locations.sort(key=lambda x: x.get("order", 0))
    
    return {
        "locations": compatible_locations,
        "all_products_available": len(unavailable_products) == 0,
        "unavailable_products": unavailable_products,
        "shipping_available": shipping_available,
        "pickup_available": len(compatible_locations) > 0 and len(unavailable_products) == 0
    }

@api_router.get("/products/{product_id}/pickup-locations")
async def get_product_pickup_locations(product_id: str):
    """Get all pickup locations where a specific product is available"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.get("available_for_pickup", True):
        return {"locations": [], "available_for_pickup": False}
    
    # Get product's location restrictions
    product_location_ids = product.get("pickup_location_ids", [])
    
    # Query locations
    if product_location_ids:
        # Only specific locations
        locations = await db.pickup_locations.find(
            {"id": {"$in": product_location_ids}, "enabled": True},
            {"_id": 0}
        ).to_list(100)
    else:
        # All enabled locations
        locations = await db.pickup_locations.find(
            {"enabled": True},
            {"_id": 0}
        ).to_list(100)
    
    locations.sort(key=lambda x: x.get("order", 0))
    
    return {
        "locations": locations,
        "available_for_pickup": True,
        "pickup_only": product.get("pickup_only", False)
    }




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