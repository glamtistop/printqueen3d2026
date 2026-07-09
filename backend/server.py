from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Header, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import asyncio
from html import escape
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import stripe
from cloudinary_config import CloudinaryService
import bcrypt
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

HOME_DECOR_LITHOPHANES_DESCRIPTION = "Transform your space with custom 3D-printed home décor designed to reflect your unique style. Discover personalized lithophane night lights, photo lamps, vases, nameplates, wall décor, incense holders, and decorative accents, all professionally 3D printed with precision and expert finishing. Upload your favorite photo, logo, or inspiration—or simply share your idea, and we'll work with you to create a one-of-a-kind piece made just for you."
HOME_DECOR_LITHOPHANES_COLLECTION_ID = "home-decor-lithophanes"
TOYS_FIDGETS_COLLECTION_ID = "toys-fidgets"
TOYS_FIDGETS_DESCRIPTION = "Shop professionally 3D printed toys, fidgets, articulated animals, dragons, puzzles, and custom character pieces made to order with your selected filament colors."
GIFTS_KEEPSAKES_CELEBRATIONS_COLLECTION_ID = "gifts-keepsakes-celebrations"
GIFTS_KEEPSAKES_CELEBRATIONS_DESCRIPTION = "Shop professionally 3D printed gifts, keepsakes, celebration displays, personalized name art, graduation pieces, couple gifts, and made-to-order display pieces."
FILAMENT_COLOR_OPTIONS = [
    "Original Printed Color",
    "Single Color Request",
    "Silky Triple-Color Red • Blue • Green",
    "Silky Triple-Color Purple • Blue • Pink",
    "Silky Triple-Color Black Cherry",
    "Silky Triple-Color Blackberry",
    "Silky Triple-Color Bright Blue • Raspberry",
    "Silky Triple-Color Rainbow",
    "Silky Triple-Color Rainbow 2",
    "Silky Triple-Color Pastel Rainbow",
    "Silky Triple-Color Gold • Copper • Bronze",
    "Silky Triple-Color Blue • Green • Purple",
    "Silky Triple-Color Sunset (Orange • Gold • Red)"
]

NFC_BUSINESS_STANDS_COLLECTION_ID = "nfc-business-stands"
NFC_BUSINESS_STANDS_DESCRIPTION = "Transform the way customers connect with your business using custom 3D-printed NFC stands. Whether you're accepting payments, sharing your social media, website, reviews, menus, booking links, or contact information, each stand is professionally designed and 3D printed to make networking fast, easy, and memorable. Every stand is made to order and can be personalized with your logo, business colors, QR codes, branding, and the platforms that matter most to your business."
NFC_PLATFORM_OPTIONS = [
    "Cash App", "Venmo", "PayPal", "Zelle", "Apple Pay", "Instagram", "TikTok",
    "Facebook", "YouTube", "LinkedIn", "X", "Website", "Online Store",
    "Google Reviews", "Booking Page", "Restaurant Menu", "Contact Card",
    "Wi-Fi Sharing", "Music or Streaming Link", "Portfolio Link", "Custom URL"
]
NFC_ADD_ON_OPTIONS = [
    {"name": "NFC programming", "price": 0, "label": "Included"},
    {"name": "Custom logo", "price": 0, "label": "Included"},
    {"name": "QR code", "price": 0, "label": "Included"},
    {"name": "Business card slot", "price": 10},
    {"name": "Square Reader holder", "price": 15},
    {"name": "Glitter finish", "price": 8},
    {"name": "Matching NFC keychain", "price": 10},
    {"name": "Rush production", "price": 25, "label": "$25+"}
]
NFC_BUNDLE_OPTIONS = [
    {"name": "Starter Business Bundle", "price": 84.99, "includes": ["NFC Connect Duo", "1 matching NFC keychain"]},
    {"name": "Vendor Essentials Bundle", "price": 109.99, "includes": ["NFC Connect Trio", "2 NFC keychains", "Business card holder"]},
    {"name": "Business Pro Bundle", "price": 149.99, "includes": ["NFC Business Hub", "3 matching NFC keychains", "Custom logo", "QR code", "Business card holder"]},
]
NFC_PRODUCT_SECTION_TITLE = "Customize Your NFC Stand"
NFC_PRODUCT_SECTION_TEXT = "Choose the platforms that fit your business. Your stand can be programmed to connect customers to payment apps, social media pages, websites, reviews, booking links, menus, contact cards, music links, portfolios, Wi-Fi sharing, or any custom URL."
NFC_PRODUCT_PAGE_NOTE = "Don’t see what you need? We can program your stand with almost any NFC-compatible link or digital destination."
KEYCHAINS_CHARMS_COLLECTION_ID = "keychains-charms"
SOCIAL_MEDIA_KEYCHAIN_OPTIONS = [
    "Instagram", "TikTok", "Facebook", "YouTube", "X", "WhatsApp", "Cash App",
    "Venmo", "PayPal", "Zelle", "Website", "Google Reviews", "Phone", "Email",
    "Discord", "Messenger", "Amazon", "eBay", "Booking", "Custom Icon"
]

def is_home_decor_lithophanes_collection(collection):
    collection_text = f"{collection.get('name', '')} {collection.get('description', '')}".lower()
    normalized_text = collection_text.replace("decor", "décor")
    return (
        "home décor" in normalized_text or
        "lithophane" in normalized_text or
        collection.get("id") == HOME_DECOR_LITHOPHANES_COLLECTION_ID
    )

def is_toys_fidgets_collection(collection):
    collection_text = f"{collection.get('name', '')} {collection.get('description', '')}".lower()
    return (
        collection.get("id") == TOYS_FIDGETS_COLLECTION_ID or
        ("toy" in collection_text and "fidget" in collection_text) or
        "fidgets & fun" in collection_text or
        "toys & fidgets" in collection_text
    )

def is_gifts_keepsakes_celebrations_collection(collection):
    collection_text = f"{collection.get('name', '')} {collection.get('description', '')}".lower()
    return (
        collection.get("id") == GIFTS_KEEPSAKES_CELEBRATIONS_COLLECTION_ID or
        ("gift" in collection_text and "keepsake" in collection_text) or
        ("celebration" in collection_text and "keepsake" in collection_text)
    )

# Stripe setup
stripe_api_key = os.environ.get('STRIPE_API_KEY')
stripe_webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')

def env_flag(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}

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

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

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
    subtitle: Optional[str] = None
    description: str
    price: float
    price_prefix: Optional[str] = None
    compare_at_price: Optional[float] = None
    compare_at_price_prefix: Optional[str] = None
    category: str
    images: List[str]
    image_alt: Optional[str] = None
    variants: List[ProductVariant] = []
    stock: int = 0
    is_custom: bool = False
    custom_page_url: Optional[str] = None
    published: bool = True
    collection_ids: List[str] = []
    badge: Optional[str] = None
    badge_color: Optional[str] = None
    sale_badge_enabled: bool = True
    available_colors: List[str] = []
    material_details: Optional[str] = None
    custom_builder: Optional[str] = None
    platform_options: List[str] = []
    add_on_options: List[Dict] = []
    bundle_options: List[Dict] = []
    customization_fields: List[Dict] = []
    product_page_section_title: Optional[str] = None
    product_page_section_text: Optional[str] = None
    product_page_note: Optional[str] = None
    # Pickup settings
    available_for_pickup: bool = True  # Whether this product can be picked up
    pickup_only: bool = False  # If true, shipping is not available
    pickup_location_ids: List[str] = []  # Specific locations that can fulfill this product (empty = all)
    estimated_prep_time: Optional[int] = None  # Estimated prep time in hours for pickup orders
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    subtitle: Optional[str] = None
    description: str
    price: float
    price_prefix: Optional[str] = None
    compare_at_price: Optional[float] = None
    compare_at_price_prefix: Optional[str] = None
    category: str
    images: List[str]
    image_alt: Optional[str] = None
    variants: List[ProductVariant] = []
    stock: int = 0
    published: bool = True
    collection_ids: List[str] = []
    badge: Optional[str] = None
    badge_color: Optional[str] = None
    sale_badge_enabled: bool = True
    available_colors: List[str] = []
    material_details: Optional[str] = None
    custom_builder: Optional[str] = None
    platform_options: List[str] = []
    add_on_options: List[Dict] = []
    bundle_options: List[Dict] = []
    customization_fields: List[Dict] = []
    product_page_section_title: Optional[str] = None
    product_page_section_text: Optional[str] = None
    product_page_note: Optional[str] = None
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
    image_url: Optional[str] = None
    image_alt: Optional[str] = None
    cover_image_url: Optional[str] = None
    image: Optional[str] = None
    link_url: Optional[str] = None
    url: Optional[str] = None
    type: str = "manual"  # manual or automated
    product_ids: List[str] = []
    rules: List[CollectionRule] = []
    sort_order: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_alt: Optional[str] = None
    cover_image_url: Optional[str] = None
    image: Optional[str] = None
    link_url: Optional[str] = None
    url: Optional[str] = None
    type: str = "manual"
    product_ids: List[str] = []
    rules: List[CollectionRule] = []
    sort_order: Optional[int] = None

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
    # Rush order and shipping method chosen at checkout
    rush_order: bool = False
    rush_order_amount: float = 0.0
    shipping_option: Optional[Dict] = None
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
    rush_order: bool = False
    rush_order_amount: float = 0.0
    shipping_option: Optional[Dict] = None

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

def require_stripe_key() -> str:
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe is not configured. Add STRIPE_API_KEY to the backend environment.")
    return stripe_api_key

def amount_to_cents(amount: float) -> int:
    return int(round(float(amount) * 100))

# ============ CHECKOUT PRICE VERIFICATION ============

CHECKOUT_TAX_RATE = 0.0925  # must match the rate in frontend CheckoutPage.js
MAX_ADDON_SURCHARGE_PER_ITEM = 200.0  # max customization upcharge accepted above DB base price
ADMIN_VISIBLE_ORDER_STATUSES = ["processing", "fulfilled", "shipped", "picked_up", "completed"]

def to_cents(amount) -> int:
    return int(round(float(amount or 0) * 100))

async def verify_order_pricing(order_data) -> Optional[str]:
    """Verify client-submitted order pricing against the database.

    Returns an error message string when the order should be rejected, or
    None when pricing is valid. Customized items may legitimately cost MORE
    than the DB base price (frontend folds add-on charges into item.price),
    so per-item checks are floor + cap, not equality.
    """
    items = order_data.items or []
    if not items:
        return "Order has no items"

    product_ids = [item.product_id for item in items]
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(1000)
    product_map = {product["id"]: product for product in products}

    subtotal_cents = 0
    for item in items:
        product = product_map.get(item.product_id)
        if not product or not product.get("published", False):
            return f"Product {item.product_id} is not available"
        if not isinstance(item.quantity, int) or item.quantity < 1 or item.quantity > 100:
            return f"Invalid quantity for {product.get('name', item.product_id)}"
        item_cents = to_cents(item.price)
        base_cents = to_cents(product.get("price", 0))
        if item_cents < base_cents:
            return f"Price for {product.get('name', item.product_id)} is below the current price"
        if item_cents - base_cents > to_cents(MAX_ADDON_SURCHARGE_PER_ITEM):
            return f"Customization charge for {product.get('name', item.product_id)} is not valid"
        subtotal_cents += item_cents * item.quantity

    if abs(subtotal_cents - to_cents(order_data.subtotal)) > 2:
        return "Order subtotal does not match item prices"

    tax_cents = round(subtotal_cents * CHECKOUT_TAX_RATE)
    if abs(tax_cents - to_cents(order_data.tax_amount)) > 2:
        return "Order tax does not match the expected tax amount"

    settings = await db.shipping_settings.find_one({"id": "shipping_settings"}, {"_id": 0}) or {}
    free_enabled = settings.get("free_shipping_enabled", True)
    free_threshold_cents = to_cents(settings.get("free_shipping_threshold", 150.0))
    enabled_options = [
        opt for opt in settings.get("shipping_options", [])
        if opt.get("enabled", True)
    ]

    shipping_cents = to_cents(order_data.shipping_amount)
    if order_data.fulfillment_type == "pickup":
        if shipping_cents != 0:
            return "Pickup orders cannot include shipping charges"
    elif free_enabled and subtotal_cents >= free_threshold_cents:
        if shipping_cents != 0:
            return "Order qualifies for free shipping"
    else:
        allowed_shipping = [to_cents(opt.get("price", 0)) for opt in enabled_options] or [to_cents(12.95)]
        if not any(abs(shipping_cents - allowed) <= 2 for allowed in allowed_shipping):
            return "Shipping charge does not match an available shipping option"

    rush_cents = 0
    if getattr(order_data, "rush_order", False):
        if not settings.get("rush_order_enabled", True):
            return "Rush orders are not currently available"
        rush_cents = to_cents(settings.get("rush_order_price", 25.0))
        if abs(to_cents(getattr(order_data, "rush_order_amount", 0)) - rush_cents) > 2:
            return "Rush order charge does not match the current rush price"
    elif abs(to_cents(getattr(order_data, "rush_order_amount", 0))) > 2:
        return "Rush order charge cannot be included unless rush production is selected"

    expected_total_cents = subtotal_cents + tax_cents + shipping_cents + rush_cents
    if abs(expected_total_cents - to_cents(order_data.total)) > 5:
        return "Order total does not match the expected amount"

    return None

async def mark_checkout_paid(session_id: str, payment_status: str = "paid"):
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    already_paid = transaction and transaction.get("payment_status") == "paid"

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": payment_status}}
    )

    order_id = transaction.get("metadata", {}).get("order_id") if transaction else None
    if order_id and payment_status == "paid":
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"status": "processing"}}
        )
        if not already_paid:
            await send_order_confirmation_email_background(order_id)

# ============ SITE EDITOR MODELS ============

class SocialLinks(BaseModel):
    instagram: Optional[str] = "https://instagram.com/printqueen3d"
    facebook: Optional[str] = None
    twitter: Optional[str] = "https://x.com/printqueen3d"
    tiktok: Optional[str] = "https://www.tiktok.com/@printqueen3d"
    youtube: Optional[str] = None

class BrandColors(BaseModel):
    primary: str = "#3B82F6"  # Blue
    secondary: str = "#10B981"  # Emerald
    accent: str = "#F59E0B"  # Amber

class ContactInfo(BaseModel):
    email: Optional[str] = "printqueen3d@gmail.com"
    phone: Optional[str] = "(310) 936-1893"
    address: Optional[str] = "Los Angeles, California"

class AppIcons(BaseModel):
    favicon_32: Optional[str] = None  # 32x32 browser tab
    apple_touch_180: Optional[str] = None  # 180x180 iPhone
    android_192: Optional[str] = None  # 192x192 Android
    pwa_512: Optional[str] = None  # 512x512 PWA splash

class HeroImages(BaseModel):
    desktop_images: List[str] = []  # Single desktop hero image stored first for backwards compatibility
    mobile_image: Optional[str] = None  # Single mobile hero image

class NavigationItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    link: str
    enabled: bool = True
    show_desktop: bool = True
    show_mobile: bool = True
    show_footer: bool = False
    featured: bool = False
    footer_group: Optional[str] = None
    order: int = 0

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
    navigation_items: List[NavigationItem] = []
    footer_shop_title: str = "Shop"
    footer_company_title: str = "Company"
    footer_support_title: str = "Support"
    footer_contact_title: str = "Contact"
    footer_links_title: str = "Company"
    footer_policies_title: str = "Support"
    footer_partner_title: str = ""
    footer_partner_text: str = ""
    footer_partner_link_text: str = "Send a partner inquiry"
    footer_partner_link: str = "/contact"
    footer_description: str = "Professionally 3D printed custom creations made to order with precision and care."
    footer_location_text: str = "Los Angeles, California"
    footer_pickup_text: str = "Los Angeles, California"
    footer_instagram_label: str = "Instagram: @printqueen3d"
    footer_tiktok_label: str = "TikTok: @printqueen3d"
    footer_x_label: str = "X: @printqueen3d"
    footer_background_color: str = ""
    footer_text_color: str = ""
    footer_text_size: str = ""
    footer_padding_y: Optional[int] = None
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
    navigation_items: Optional[List[NavigationItem]] = None
    footer_shop_title: Optional[str] = None
    footer_company_title: Optional[str] = None
    footer_support_title: Optional[str] = None
    footer_contact_title: Optional[str] = None
    footer_links_title: Optional[str] = None
    footer_policies_title: Optional[str] = None
    footer_partner_title: Optional[str] = None
    footer_partner_text: Optional[str] = None
    footer_partner_link_text: Optional[str] = None
    footer_partner_link: Optional[str] = None
    footer_description: Optional[str] = None
    footer_location_text: Optional[str] = None
    footer_pickup_text: Optional[str] = None
    footer_instagram_label: Optional[str] = None
    footer_tiktok_label: Optional[str] = None
    footer_x_label: Optional[str] = None
    footer_background_color: Optional[str] = None
    footer_text_color: Optional[str] = None
    footer_text_size: Optional[str] = None
    footer_padding_y: Optional[int] = None
    footer_text: Optional[str] = None

class SectionContent(BaseModel):
    badge_label: Optional[str] = None
    headline: Optional[str] = None
    subheadline: Optional[str] = None
    description: Optional[str] = None
    button_text: Optional[str] = None
    button_link: Optional[str] = None
    secondary_button_text: Optional[str] = None
    secondary_button_link: Optional[str] = None
    overlay_opacity: Optional[float] = None
    overlay_color: Optional[str] = None
    hero_height_desktop: Optional[int] = None
    hero_height_mobile: Optional[int] = None
    hero_image_position: Optional[str] = None
    mobile_image_url: Optional[str] = None
    image_position: Optional[str] = None
    image_alt: Optional[str] = None
    text_size: Optional[str] = None
    button_size: Optional[str] = None
    section_padding_y: Optional[int] = None
    background_color: Optional[str] = None
    image_url: Optional[str] = None
    background_image_url: Optional[str] = None
    categories: Optional[List[Dict[str, str]]] = None
    hidden_category_ids: Optional[List[str]] = None
    homepage_category_ids: Optional[List[str]] = None
    marquee_messages: Optional[List[str]] = None
    marquee_speed: Optional[int] = None
    marquee_direction: Optional[str] = None
    marquee_background_color: Optional[str] = None
    marquee_background_image_url: Optional[str] = None
    marquee_images: Optional[List[str]] = None
    marquee_show_images: Optional[bool] = None
    marquee_text_color: Optional[str] = None
    marquee_padding_y: Optional[int] = None
    marquee_gap: Optional[int] = None
    product_limit: Optional[int] = None
    gallery_images: Optional[List[str]] = None
    gallery_captions: Optional[List[str]] = None
    reviews: Optional[List[Dict[str, str]]] = None
    steps: Optional[List[Dict[str, str]]] = None
    faq_items: Optional[List[Dict[str, str]]] = None
    info_cards: Optional[List[Dict[str, str]]] = None

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
    free_shipping_threshold: float = 150.0  # Free shipping above this amount
    flat_shipping_rate: float = 12.95  # Shipping cost below threshold
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

# ============ SHIPPING SETTINGS MODELS ============

class ShippingOption(BaseModel):
    """Individual shipping option"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "Standard Shipping", "Express Shipping"
    description: Optional[str] = None  # e.g., "5-7 business days"
    price: float  # Shipping cost
    estimated_days_min: int = 5  # Minimum delivery days
    estimated_days_max: int = 7  # Maximum delivery days
    enabled: bool = True
    order: int = 0  # Display order

class ShippingSettings(BaseModel):
    """Shipping configuration"""
    model_config = ConfigDict(extra="ignore")
    id: str = "shipping_settings"
    # Default shipping location (for ship-from address)
    default_location_id: Optional[str] = None
    # Shipping options
    shipping_options: List[ShippingOption] = []
    # Free shipping threshold
    free_shipping_enabled: bool = True
    free_shipping_threshold: float = 150.0
    # Rush order settings
    rush_order_enabled: bool = True
    rush_order_price: float = 25.0
    rush_order_days_min: int = 1
    rush_order_days_max: int = 3
    rush_order_label: str = "Rush Order"
    rush_order_description: str = "Expedite your order for faster processing"
    fulfillment_heading: str = "How would you like to receive your order?"
    shipping_card_title: str = "Ship to Me"
    shipping_unavailable_text: str = "Not available for these items"
    pickup_card_title: str = "Local Pickup"
    pickup_price_label: str = "FREE"
    pickup_unavailable_text: str = "Not available"
    pickup_location_heading: str = "Select Pickup Location"
    pickup_datetime_heading: str = "Select Pickup Date & Time"
    pickup_details_heading: str = "Pickup Details"
    pickup_confirmation_note: str = "Local pickup is available in Los Angeles, California. Once your order is complete and ready for pickup, you will receive an email notification with pickup instructions."
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShippingSettingsUpdate(BaseModel):
    default_location_id: Optional[str] = None
    shipping_options: Optional[List[ShippingOption]] = None
    free_shipping_enabled: Optional[bool] = None
    free_shipping_threshold: Optional[float] = None
    rush_order_enabled: Optional[bool] = None
    rush_order_price: Optional[float] = None
    rush_order_days_min: Optional[int] = None
    rush_order_days_max: Optional[int] = None
    rush_order_label: Optional[str] = None
    rush_order_description: Optional[str] = None
    fulfillment_heading: Optional[str] = None
    shipping_card_title: Optional[str] = None
    shipping_unavailable_text: Optional[str] = None
    pickup_card_title: Optional[str] = None
    pickup_price_label: Optional[str] = None
    pickup_unavailable_text: Optional[str] = None
    pickup_location_heading: Optional[str] = None
    pickup_datetime_heading: Optional[str] = None
    pickup_details_heading: Optional[str] = None
    pickup_confirmation_note: Optional[str] = None

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

# ============ INQUIRY MODELS ============

class CustomQuoteRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: str
    phone: Optional[str] = None
    use_type: Optional[str] = None
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    creation_type: Optional[str] = None
    personalization: List[str] = []
    quantity_needed: Optional[str] = None
    preferred_colors: Optional[str] = None
    preferred_finish: Optional[str] = None
    size_needed: Optional[str] = None
    need_by_date: Optional[str] = None
    budget_range: Optional[str] = None
    nfc_link: Optional[str] = None
    nfc_links: List[str] = []
    material_request: Optional[str] = None
    resin_overlay: bool = False
    qr_code_note: Optional[str] = None
    project_details: str = ""
    special_ideas: Optional[str] = None
    delivery_method: Optional[str] = None
    delivery_fee: Optional[float] = None
    attachment_image_url: Optional[str] = None
    attachment_public_id: Optional[str] = None
    status: str = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PartnerInquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    instagram: Optional[str] = None
    tiktok: Optional[str] = None
    website: Optional[str] = None
    collaboration_idea: str
    status: str = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InquiryStatusUpdate(BaseModel):
    status: str

class NewsletterSignup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    source: str = "homepage"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerReview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    rating: int
    review: str
    status: str = "pending"
    featured: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class CustomerReviewUpdate(BaseModel):
    name: Optional[str] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    status: Optional[str] = None
    featured: Optional[bool] = None

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

def should_use_secure_cookie(request: Request) -> bool:
    cookie_secure = os.environ.get("COOKIE_SECURE")
    if cookie_secure is not None:
        return cookie_secure.lower() == "true"
    return request.url.scheme == "https"

def set_session_cookie(response: Response, request: Request, session_token: str):
    secure_cookie = should_use_secure_cookie(request)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=secure_cookie,
        samesite="none" if secure_cookie else "lax",
        path="/",
        max_age=7 * 24 * 60 * 60
    )

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

@api_router.get("/auth/me")
async def get_me(user: User = Depends(require_auth)):
    """Get current user info"""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "is_admin": user.is_admin,
        "created_at": user.created_at
    }

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

@api_router.post("/auth/register")
async def register_user(register_data: RegisterRequest, request: Request, background_tasks: BackgroundTasks):
    """Create a customer account with email and password"""
    email = register_data.email.strip().lower()
    name = register_data.name.strip()

    if len(register_data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=409, detail="An account already exists for this email")

    user = User(
        email=email,
        name=name,
        hashed_password=hash_password(register_data.password),
        is_admin=False
    )
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)

    session_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    user_session = UserSession(
        user_id=user.id,
        session_token=session_token,
        expires_at=expires_at
    )
    session_dict = user_session.model_dump()
    session_dict['expires_at'] = session_dict['expires_at'].isoformat()
    session_dict['created_at'] = session_dict['created_at'].isoformat()
    await db.user_sessions.insert_one(session_dict)

    response = JSONResponse(content={
        "message": "Account created",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "is_admin": user.is_admin
        }
    })
    set_session_cookie(response, request, session_token)
    background_tasks.add_task(send_welcome_email_background, user.id)
    return response

@api_router.post("/auth/login")
async def email_password_login(login_data: EmailPasswordLogin, request: Request):
    """Login with email and password (backup authentication method)"""
    # Find user by email
    user_doc = await db.users.find_one({"email": login_data.email.strip().lower()}, {"_id": 0})
    
    if not user_doc:
        await asyncio.sleep(1)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user has a password set
    if not user_doc.get("hashed_password"):
        raise HTTPException(status_code=401, detail="Password not set. Please use Google login.")
    
    # Verify password
    if not verify_password(login_data.password, user_doc["hashed_password"]):
        await asyncio.sleep(1)
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
    
    set_session_cookie(response, request, session_token)
    
    return response

async def seed_admin_user():
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    admin_name = os.environ.get("ADMIN_NAME", "Print Queen Admin").strip()

    if not admin_email or not admin_password:
        return
    if len(admin_password) < 8:
        logging.warning("ADMIN_PASSWORD must be at least 8 characters; admin user was not created.")
        return

    existing_user = await db.users.find_one({"email": admin_email})
    if existing_user:
        update_data = {"is_admin": True}
        if not existing_user.get("hashed_password"):
            update_data["hashed_password"] = hash_password(admin_password)
        await db.users.update_one({"email": admin_email}, {"$set": update_data})
        return

    user = User(
        email=admin_email,
        name=admin_name or "Print Queen Admin",
        hashed_password=hash_password(admin_password),
        is_admin=True
    )
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)

async def seed_email_settings():
    resend_api_key = os.environ.get("RESEND_API_KEY", "").strip()
    if not resend_api_key:
        return

    update_data = {
        "id": "email_settings",
        "provider": "resend",
        "api_key": resend_api_key,
        "sender_name": os.environ.get("EMAIL_SENDER_NAME", "Print Queen 3D").strip() or "Print Queen 3D",
        "sender_email": os.environ.get("EMAIL_SENDER_EMAIL", "noreply@example.com").strip() or "noreply@example.com",
        "enabled": True,
        "send_order_confirmation": True,
        "send_status_updates": True,
        "send_welcome_emails": True,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    admin_email = os.environ.get("EMAIL_ADMIN_EMAIL", "").strip()
    if admin_email:
        update_data["admin_email"] = admin_email

    await db.email_settings.update_one(
        {"id": "email_settings"},
        {"$set": update_data},
        upsert=True
    )

async def seed_stripe_settings():
    publishable_key = os.environ.get("STRIPE_PUBLISHABLE_KEY", "").strip()
    if not publishable_key:
        return

    await db.stripe_settings.update_one(
        {"id": "stripe_settings"},
        {"$set": {
            "id": "stripe_settings",
            "publishable_key": publishable_key,
            "test_mode": not publishable_key.startswith("pk_live_"),
            "currency": "usd",
            "enable_apple_pay": True,
            "enable_google_pay": True,
            "enable_link": True,
            "tax_rate": 0.0,
            "free_shipping_threshold": 150.0,
            "flat_shipping_rate": 12.95,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )

# ============ PRODUCT ROUTES ============

def nfc_product_payloads(collection_id: str = NFC_BUSINESS_STANDS_COLLECTION_ID):
    common = {
        "category": "NFC Business Stands",
        "collection_ids": [collection_id],
        "badge": "SALE",
        "badge_color": "#dc2626",
        "sale_badge_enabled": True,
        "stock": 0,
        "published": True,
        "is_custom": True,
        "available_colors": ["enabled"],
        "material_details": "Professionally 3D printed and made to order with PLA or PETG filament, NFC programming included, and finished with care.",
        "platform_options": NFC_PLATFORM_OPTIONS,
        "add_on_options": NFC_ADD_ON_OPTIONS,
        "bundle_options": NFC_BUNDLE_OPTIONS,
        "product_page_section_title": NFC_PRODUCT_SECTION_TITLE,
        "product_page_section_text": NFC_PRODUCT_SECTION_TEXT,
        "product_page_note": NFC_PRODUCT_PAGE_NOTE,
        "custom_builder": ""
    }
    products = [
        {
            "id": "nfc-connect-duo",
            "name": "NFC Connect Duo",
            "subtitle": "2 Icon NFC Stand",
            "compare_at_price": 39.99,
            "price": 29.99,
            "images": [
                "/assets/products/nfc-stands/nfc-connect-duo-black-white.jpg"
            ],
            "image_alt": "Black and white two icon NFC payment stand",
            "description": "A clean and modern custom 3D-printed NFC stand featuring two customizable icons, perfect for sharing your most important business links with a single tap. Use it for payments, social media, websites, reviews, booking pages, contact cards, menus, or custom links. Personalize it with your logo, business colors, and branding to create a professional counter display for your business, event table, vendor booth, salon, shop, or pop-up."
        },
        {
            "id": "nfc-connect-trio",
            "name": "NFC Connect Trio",
            "subtitle": "3 Icon NFC Stand",
            "compare_at_price": 49.99,
            "price": 39.99,
            "images": ["/assets/products/nfc-stands/nfc-connect-trio-pink-white.jpg"],
            "image_alt": "Pink and white three icon NFC stand",
            "description": "Give customers more ways to connect with your business using a custom 3D-printed NFC stand with three customizable icons. The NFC Connect Trio is perfect for combining payments, social media, websites, reviews, booking links, menus, QR codes, contact cards, and more in one polished display. Each stand is made to order and personalized with your brand colors, logo, and preferred platforms."
        },
        {
            "id": "nfc-business-hub",
            "name": "NFC Business Hub",
            "subtitle": "Logo, QR & Multi-Link NFC Display",
            "compare_at_price": 69.99,
            "price": 59.99,
            "images": [
                "/assets/products/nfc-stands/nfc-business-hub-pink-white.jpg",
                "/assets/products/nfc-stands/nfc-business-hub-neeta-tees.jpg"
            ],
            "image_alt": "Custom branded NFC business hub display stand",
            "description": "Your all-in-one custom 3D-printed business display. The NFC Business Hub combines branding, QR code access, NFC technology, and multiple connection options into one professional countertop stand. Add your business logo, payment apps, social media, website, booking page, reviews, menu, contact card, or custom links to create a complete customer connection station. Perfect for storefronts, salons, barbershops, restaurants, vendors, photographers, trade shows, markets, and service-based businesses."
        },
        {
            "id": "industry-nfc-stand",
            "name": "Industry NFC Stand",
            "subtitle": "Custom Business-Themed NFC Stand",
            "compare_at_price": 59.99,
            "compare_at_price_prefix": "Starting at",
            "price": 49.99,
            "price_prefix": "Starting at",
            "images": [
                "/assets/products/nfc-stands/industry-barber-nfc-stand.jpg",
                "/assets/products/nfc-stands/custom-shape-mouse-ear-stand.jpg"
            ],
            "image_alt": "Custom industry themed barber NFC stand",
            "description": "A custom 3D-printed NFC stand designed around your industry, brand, or business theme. Perfect for barbers, nail techs, hairstylists, bakeries, boutiques, realtors, vendors, creators, restaurants, and service providers. Add your logo, colors, business name, payment links, booking page, website, social media, reviews, QR code, or custom NFC destination to create a stand that fits your brand and helps customers connect instantly."
        },
        {
            "id": "custom-shape-nfc-stand",
            "name": "Custom Shape NFC Stand",
            "subtitle": "Personalized Shape + NFC Display",
            "compare_at_price": 64.99,
            "compare_at_price_prefix": "Starting at",
            "price": 54.99,
            "price_prefix": "Starting at",
            "images": [
                "/assets/products/nfc-stands/custom-shape-mouse-ear-stand.jpg",
                "/assets/products/nfc-stands/industry-barber-nfc-stand.jpg"
            ],
            "image_alt": "Custom shaped mouse ear QR and NFC stand",
            "description": "Create an NFC stand that matches your brand personality. This custom 3D-printed stand can be shaped around your logo, theme, industry, character, product, or creative idea while still including NFC tap functionality. Send your inspiration, logo, sketch, or concept, and we’ll work together to create a unique stand designed just for you."
        },
        {
            "id": "fully-custom-logo-nfc-stand",
            "name": "Fully Custom Logo NFC Stand",
            "subtitle": "Branded NFC Business Display",
            "compare_at_price": 79.99,
            "compare_at_price_prefix": "Starting at",
            "price": 69.99,
            "price_prefix": "Starting at",
            "images": [
                "/assets/products/nfc-stands/nfc-business-hub-neeta-tees.jpg",
                "/assets/products/nfc-stands/nfc-business-hub-pink-white.jpg"
            ],
            "image_alt": "Fully custom logo NFC business display",
            "description": "A fully customized 3D-printed NFC stand made around your business logo, colors, and brand identity. This option is perfect for businesses that want a standout display for payments, social media, websites, booking links, reviews, menus, or customer engagement. Send your logo or idea, and we’ll work with you to create a professional branded NFC display made specifically for your business."
        }
    ]
    return [{**common, **product} for product in products]

def is_nfc_stands_collection(collection):
    name = (collection.get("name") or "").strip().lower()
    if not name:
        return False
    exact_matches = {
        "nfc business stands",
        "nfc stands",
        "nfc stand",
        "nfc products",
        "nfc & business solutions",
        "nfc and business solutions",
        "business solutions",
    }
    if name in exact_matches:
        return True
    return "nfc" in name and ("stand" in name or "business" in name or "solution" in name)

def is_keychains_charms_collection(collection):
    name = (collection.get("name") or "").strip().lower()
    if not name:
        return False
    exact_matches = {
        "keychains & charms",
        "keychains and charms",
        "keychain & charms",
        "keychain and charms",
        "custom keychains",
        "keychains",
    }
    if name in exact_matches:
        return True
    return "keychain" in name and ("charm" in name or "charms" in name)

def nfc_keychain_product_payloads(collection_id: str = KEYCHAINS_CHARMS_COLLECTION_ID):
    default_keychain_fields = [
        filament_color_field("primary_color", "Primary Color"),
        filament_color_field("secondary_color", "Secondary Color"),
        {"id": "icon", "label": "Icon", "type": "select", "required": True, "options": SOCIAL_MEDIA_KEYCHAIN_OPTIONS},
        {"id": "nfc_link", "label": "NFC Link to Program", "type": "url", "required": True, "placeholder": "Paste your website, payment link, social media link, booking page, review page, or custom URL"},
        {"id": "logo_or_qr_upload", "label": "Upload Logo or QR Code, optional", "type": "file", "required": False, "helper": "Upload a high-quality PNG if this keychain needs a logo, artwork, or QR code."},
        {"id": "keychain_notes", "label": "Additional Notes", "type": "textarea", "required": False, "placeholder": "Tell us anything else you want included on your NFC keychain."}
    ]
    vinyl_record_fields = [
        filament_color_field("primary_color", "Primary Color"),
        filament_color_field("secondary_color", "Secondary Color"),
        {"id": "chain_color", "label": "Chain Color", "type": "text", "required": True, "placeholder": "Example: silver or gold"},
        {"id": "nfc_link", "label": "NFC Link to Program", "type": "url", "required": True, "placeholder": "Paste Spotify, Apple Music, website, booking, or custom link"}
    ]
    mini_cd_fields = [
        {"id": "front_cover_logo", "label": "Upload Front Cover Logo or Artwork", "type": "file", "required": True, "helper": "Upload a high-quality image for the front cover."},
        filament_color_field("primary_color", "Primary Color"),
        filament_color_field("keychain_color", "Keychain Color"),
        {"id": "nfc_link", "label": "NFC Link to Program", "type": "url", "required": True, "placeholder": "Paste the link customers should tap to open"}
    ]
    social_keychain_fields = [
        {"id": "social_platform", "label": "Social Media Platform", "type": "select", "required": True, "options": SOCIAL_MEDIA_KEYCHAIN_OPTIONS},
        filament_color_field("primary_color", "Primary Color"),
        filament_color_field("secondary_color", "Secondary Color"),
        {"id": "chain_color", "label": "Chain Color", "type": "text", "required": True, "placeholder": "Example: silver or gold"},
        {"id": "nfc_link", "label": "NFC Link to Program", "type": "url", "required": True, "placeholder": "Paste your social media, payment, website, or custom link"}
    ]
    emergency_keychain_fields = [
        {"id": "backpack_name", "label": "Name on Backpack", "type": "text", "required": True, "placeholder": "Enter the name to add"},
        {
            "id": "back_pack_color",
            "label": "Original Color as Displayed or Single Color",
            "type": "filament_color",
            "required": True,
            "helper": "This color is for the backpack.",
            "options": ["Original Printed Color", "Single Color Request"],
            "allow_tri_color": False,
            "single_color_label": "Single Color",
            "original_color_label": "Original Color as Displayed",
            "original_color_message": "Your backpack will be printed using the colors shown in the product photo."
        },
        {
            "id": "pocket_and_straps",
            "label": "Original Color as Displayed or Single Color",
            "type": "filament_color",
            "required": True,
            "helper": "This color is for the straps and pocket.",
            "options": ["Original Printed Color", "Single Color Request"],
            "allow_tri_color": False,
            "single_color_label": "Single Color",
            "original_color_label": "Original Color as Displayed",
            "original_color_message": "The pocket and straps will be printed using the colors shown in the product photo."
        },
        {"id": "name", "label": "Emergency Contact", "type": "textarea", "required": True, "placeholder": "Enter the emergency contact name and details"},
        {"id": "phone_number", "label": "Phone Number", "type": "number", "required": True, "placeholder": "Enter phone number"}
    ]
    common = {
        "category": "Keychains & Charms",
        "collection_ids": [collection_id],
        "badge": "Customizable",
        "badge_color": "#2563eb",
        "sale_badge_enabled": True,
        "stock": 0,
        "published": True,
        "is_custom": True,
        "available_colors": ["enabled"],
        "price": 14.99,
        "price_prefix": "Starting at",
        "material_details": "Professionally 3D printed NFC keychain made to order with PLA or PETG filament, NFC programming included, and finished with care.",
        "platform_options": NFC_PLATFORM_OPTIONS,
        "add_on_options": [
            {"name": "NFC programming", "price": 0, "label": "Included"},
            {"name": "QR code setup", "price": 0, "label": "Included"},
            {"name": "Resin finish", "price": 5}
        ],
        "product_page_section_title": "Customize Your NFC Keychain",
        "product_page_section_text": "Choose your keychain style, color, icon, and URL. Your keychain can be programmed to connect to a website, social profile, payment link, review page, emergency contact, booking page, or custom URL.",
        "product_page_note": "NFC will be programmed to the exact link you provide. Please double-check the URL before checkout.",
        "custom_builder": "",
        "customization_fields": default_keychain_fields
    }
    products = [
        {
            "id": "nfc-keychain-nail-tech",
            "name": "Nail Tech NFC Keychain",
            "subtitle": "Tap-to-Connect Nail Tech Keychain",
            "images": ["/assets/products/nfc-keychains/nail-tech-nfc-keychain.jpg"],
            "image_alt": "Pink and black nail tech NFC keychain",
            "description": "A custom 3D-printed NFC keychain designed for nail techs, beauty pros, and service providers. Program it with your booking link, social profile, payment link, website, or custom URL so customers can tap to connect instantly."
        },
        {
            "id": "nfc-keychain-social-payment",
            "name": "Social & Payment NFC Keychain",
            "subtitle": "Website, Social, Payment or Custom Link Keychain",
            "images": ["/assets/products/nfc-keychains/social-payment-nfc-keychains.jpg"],
            "image_alt": "Custom social and payment NFC keychains",
            "description": "A clean custom NFC keychain for social profiles, websites, payment links, stores, menus, reviews, booking pages, or any tap-to-connect destination. Choose your icon, color, and URL before checkout."
        },
        {
            "id": "nfc-keychain-emergency-contact",
            "name": "Emergency Contact NFC Keychain",
            "subtitle": "Tap-for-Emergency-Contact Keychain",
            "images": ["/assets/products/nfc-keychains/emergency-contact-nfc-keychain.jpg"],
            "image_alt": "Backpack style emergency contact NFC keychain",
            "description": "A custom 3D-printed emergency contact NFC keychain for backpacks, bags, kids, caregivers, or daily carry. This design comes as shown and can be personalized with a name and keychain color.",
            "product_page_section_title": "Customize Your NFC Backpack",
            "product_page_section_text": "Add the backpack name, choose the original displayed colors or a single color, and enter the emergency contact details before checkout.",
            "customization_fields": emergency_keychain_fields
        },
        {
            "id": "nfc-keychain-barber-pole",
            "name": "Barber Pole NFC Keychain",
            "subtitle": "Tap-to-Book Barber Keychain",
            "images": ["/assets/products/nfc-keychains/barber-pole-nfc-keychain.jpg"],
            "image_alt": "Barber pole NFC keychain",
            "description": "A barber-themed custom NFC keychain that can link customers to booking, payments, social media, reviews, contact information, or a custom business page. Made to order and personalized with your colors and link."
        },
        {
            "id": "nfc-keychain-vinyl-record",
            "name": "Vinyl Record NFC Keychain",
            "subtitle": "Tap-to-Stream Music Keychain",
            "images": ["/assets/products/nfc-keychains/music-mini-cd-vinyl-nfc-keychains.jpg"],
            "image_alt": "Vinyl record NFC keychains for musicians",
            "description": "A custom 3D-printed vinyl record style NFC keychain made for musicians, creators, DJs, artists, and brands. Choose two colors, chain color, and the NFC link you want programmed so fans or customers can tap to stream, follow, book, or connect.",
            "customization_fields": vinyl_record_fields
        },
        {
            "id": "nfc-keychain-mini-cd",
            "name": "Mini CD NFC Keychain",
            "subtitle": "Custom Cover Art Tap-to-Connect Keychain",
            "images": ["/assets/products/nfc-keychains/music-mini-cd-vinyl-nfc-keychains.jpg"],
            "image_alt": "Mini CD NFC keychain with custom cover artwork",
            "description": "A mini CD style NFC keychain with custom front cover artwork. Upload a logo, image, or cover design, choose your colors and keychain color, and provide the NFC link you want programmed.",
            "customization_fields": mini_cd_fields
        },
        {
            "id": "nfc-keychain-social-media-icon",
            "name": "Social Media NFC Keychain",
            "subtitle": "Choose Your Platform Tap-to-Connect Keychain",
            "images": ["/assets/products/nfc-keychains/social-media-nfc-keychain-photo.jpg"],
            "image_alt": "Instagram Facebook TikTok WhatsApp NFC keychains",
            "description": "A custom NFC keychain for social media, payment, website, booking, review, or custom links. Choose your platform from the dropdown, pick two colors and chain color, and provide the NFC link to program.",
            "customization_fields": social_keychain_fields
        }
    ]
    return [{**common, **product} for product in products]

def home_decor_lithophanes_product_payloads(collection_id: str = HOME_DECOR_LITHOPHANES_COLLECTION_ID):
    color_field = [
        filament_color_field("requested_color", "Product Color")
    ]
    lithophane_fields = [
        *color_field,
        {
            "id": "lithophane_photo",
            "label": "Upload Photo for Lithophane",
            "type": "file",
            "required": True,
            "helper": "Upload the photo you want converted into your lithophane nightlight."
        },
        {
            "id": "photo_notes",
            "label": "Photo Notes",
            "type": "textarea",
            "required": False,
            "placeholder": "Add names, date, message, crop preference, or orientation notes."
        }
    ]
    common = {
        "category": "Home Décor & Lithophanes",
        "collection_ids": [collection_id],
        "badge": "Made to Order",
        "badge_color": "#2563eb",
        "sale_badge_enabled": True,
        "stock": 0,
        "published": True,
        "is_custom": True,
        "available_colors": [],
        "price_prefix": "Starting at",
        "material_details": "Professionally 3D printed to order using PLA filament, PETG filament when appropriate, and expert finishing.",
        "product_page_section_title": "Customize Your Home Décor",
        "product_page_section_text": "Choose your product color and add any special notes before checkout. Each piece is made to order and professionally 3D printed with care.",
        "custom_builder": "",
        "customization_fields": color_field
    }
    products = [
        {
            "id": "home-decor-incense-holder",
            "name": "Incense Holder",
            "subtitle": "Made-to-Order 3D Printed Incense Holder",
            "price": 24.99,
            "images": ["/assets/products/home-decor-lithophanes/incense-holder.png"],
            "image_alt": "Gold 3D printed incense holder",
            "description": "A statement 3D-printed incense holder made to order in your requested color. Designed as functional décor with a sculptural look for shelves, tables, or display spaces. Incense shown in photos is a prop and is not included.",
            "product_page_note": "Incense is not included. Photo props are for display only."
        },
        {
            "id": "home-decor-designer-diffuser",
            "name": "Designer Diffuser",
            "subtitle": "Made-to-Order Decorative Diffuser Display",
            "price": 34.99,
            "images": ["/assets/products/home-decor-lithophanes/designer-diffuser.jpeg"],
            "image_alt": "Designer diffuser display with flower reeds",
            "description": "A custom 3D-printed designer diffuser display made to order in your selected color. Perfect for decorative styling and home accents with a premium sculptural feel. Diffuser oil, reed sticks, and flowers shown in photos are props and are not included.",
            "product_page_note": "Diffuser oil, reed sticks, and flowers are not included. Photo props are for display only."
        },
        {
            "id": "home-decor-spiral-vase",
            "name": "Spiral Vase",
            "subtitle": "Modern 3D Printed Spiral Vase",
            "price": 29.99,
            "images": ["/assets/products/home-decor-lithophanes/spiral-vase.jpg"],
            "image_alt": "Black spiral 3D printed vase",
            "description": "A modern spiral vase professionally 3D printed and made to order in your requested color. Designed for decorative styling, shelves, centerpieces, and statement home décor.",
            "product_page_note": "Decorative use recommended. Flowers or styling props are not included."
        },
        {
            "id": "home-decor-lithophane-nightlight",
            "name": "Lithophane Nightlight",
            "subtitle": "Custom Photo Lithophane Light",
            "price": 44.99,
            "images": ["/assets/products/home-decor-lithophanes/lithophane-nightlight.jpg"],
            "image_alt": "Custom photo lithophane nightlight",
            "description": "Turn a meaningful photo into a custom 3D-printed lithophane nightlight. Upload your photo, choose your color, and add any notes for names, dates, messages, crop preference, or layout. Each lithophane is made to order and finished with care.",
            "customization_fields": lithophane_fields,
            "product_page_section_title": "Customize Your Lithophane Nightlight",
            "product_page_section_text": "Upload the photo you want converted into your lithophane and choose your product color before checkout.",
            "product_page_note": "A clear, high-quality photo works best. We may contact you if the image needs adjustment."
        },
        {
            "id": "home-decor-designer-storage",
            "name": "Designer Storage",
            "subtitle": "3D Printed Decorative Storage Piece",
            "price": 39.99,
            "images": ["/assets/products/home-decor-lithophanes/designer-storage.jpeg"],
            "image_alt": "Pink designer 3D printed storage containers",
            "description": "A stylish 3D-printed designer storage piece made to order in your chosen color. Great for display, shelf styling, small accessories, vanity organization, or decorative storage.",
            "product_page_note": "Decorative props shown in photos are not included."
        },
        {
            "id": "home-decor-spiral-candle-holder",
            "name": "Spiral Candle Holder",
            "subtitle": "Made-to-Order 3D Printed Candle Holder",
            "price": 24.99,
            "images": ["/assets/products/home-decor-lithophanes/spiral-candle-holder.jpg"],
            "image_alt": "Spiral 3D printed candle holder",
            "description": "A sculptural spiral candle holder professionally 3D printed and made to order in your requested color. Designed as a decorative home accent with a clean modern look. Candles shown in photos are props and are not included.",
            "product_page_note": "Candles are not included. Photo props are for display only."
        }
    ]
    return [{**common, **product} for product in products]

def filament_color_field(field_id: str = "filament_color", label: str = "Filament Color", required: bool = True):
    return {
        "id": field_id,
        "label": label,
        "type": "filament_color",
        "required": required,
        "helper": "Choose the filament color option you would like for this made-to-order 3D print.",
        "options": FILAMENT_COLOR_OPTIONS,
        "single_color_label": "Single Color Request",
        "single_color_placeholder": "Example:\nMatte Black\nWhite\nTeal\nGold\nSilver\nOrange\nPink\nPurple\nRed\nBlue",
        "original_color_message": "Your item will be printed using the colors shown in the product photos."
    }

def toys_fidgets_product_payloads(collection_id: str = TOYS_FIDGETS_COLLECTION_ID):
    common = {
        "category": "Toys & Fidgets",
        "collection_ids": [collection_id],
        "badge": "Made to Order",
        "badge_color": "#2563eb",
        "sale_badge_enabled": True,
        "stock": 0,
        "published": True,
        "is_custom": True,
        "available_colors": [],
        "material_details": "Professionally 3D printed to order using quality PLA filament, silk tri-color filament when selected, and expert finishing.",
        "product_page_section_title": "Customize Your Toy or Fidget",
        "product_page_section_text": "Choose the size, color, character, animal, or personalization details for your made-to-order 3D printed item before checkout.",
        "custom_builder": "",
        "images": []
    }
    size_small_large_field = {
        "id": "size",
        "label": "Size",
        "type": "select",
        "required": True,
        "options": ["Small", "Large"]
    }
    dragon_size_field = {
        "id": "size",
        "label": "Size",
        "type": "select",
        "required": True,
        "options": ["Small", "Medium", "Large"]
    }
    products = [
        {
            "id": "toys-fidgets-infinity-hex-fidget",
            "name": "Infinity Hex Fidget",
            "price": 14.99,
            "price_prefix": "Starting at",
            "description": "The Infinity Hex Fidget is a uniquely designed 3D printed folding fidget with smooth, satisfying movement and a compact geometric design. Printed to order, it's perfect for collectors, desk accessories, or anyone who enjoys high-quality articulated fidget toys.",
            "customization_fields": [
                size_small_large_field,
                filament_color_field()
            ]
        },
        {
            "id": "toys-fidgets-pocket-zoo-articulated-animals",
            "name": "Pocket Zoo Articulated Animals",
            "price": 4.99,
            "price_prefix": "Starting at",
            "description": "Bring your favorite animals to life with these adorable articulated mini animals. Each animal features movable joints and is professionally 3D printed to order. Choose almost any animal and customize it with your favorite filament color or select the original printed colors.",
            "customization_fields": [
                {
                    "id": "animal_type",
                    "label": "Animal Type",
                    "type": "text",
                    "required": True,
                    "placeholder": "Example:\nAxolotl\nBee\nDragon\nFox\nFrog\nPenguin\nShark\nTurtle\nSnake\nGecko\nCow\nPig\nCustom Animal"
                },
                filament_color_field()
            ]
        },
        {
            "id": "toys-fidgets-personalized-puzzle-name",
            "name": "Personalized Puzzle Name",
            "price": 12.99,
            "price_prefix": "Starting at",
            "description": "Create a personalized 3D printed puzzle featuring the name of your choice. Each puzzle is custom made and designed to create a fun keepsake for children, classrooms, gifts, nurseries, birthdays, and more.",
            "customization_fields": [
                {
                    "id": "puzzle_name",
                    "label": "Name",
                    "type": "text",
                    "required": True,
                    "max_length": 12,
                    "placeholder": "Maximum 12 characters"
                },
                filament_color_field("back_base_color", "Back/Base Color"),
                filament_color_field("letter_color", "Letter Color")
            ]
        },
        {
            "id": "toys-fidgets-rose-crystal-dragon",
            "name": "Rose Crystal Dragon",
            "price": 34.99,
            "description": "An elegant articulated dragon featuring beautiful crystal-inspired details and sculpted roses throughout the body. Printed using premium silk tri-color filament, each dragon has its own unique color transition.",
            "customization_fields": [
                {
                    **dragon_size_field,
                    "price_adjustments": {"Small": 0, "Medium": 15, "Large": 35}
                },
                filament_color_field()
            ]
        },
        {
            "id": "toys-fidgets-crystal-guardian-dragon",
            "name": "Crystal Guardian Dragon",
            "price": 24.99,
            "description": "A fully articulated crystal dragon inspired by magical crystal formations. Every dragon is printed to order using premium silk tri-color filament, creating stunning color shifts and a one-of-a-kind finish.",
            "customization_fields": [
                {
                    **dragon_size_field,
                    "price_adjustments": {"Small": 0, "Medium": 10, "Large": 20}
                },
                filament_color_field()
            ]
        },
        {
            "id": "toys-fidgets-custom-character-figurine",
            "name": "Custom Character Figurine",
            "price": 12.99,
            "price_prefix": "Starting at",
            "description": "Bring your favorite characters to life with a custom 3D printed collectible figurine. Whether it's inspired by anime, gaming, cartoons, fantasy, or your own creative idea, each figurine is printed to order and customized with your selected colors.",
            "customization_fields": [
                {
                    "id": "character_name",
                    "label": "Character Name",
                    "type": "text",
                    "required": True,
                    "placeholder": "Example:\nStitch\nKirby\nPikachu\nHello Kitty\nBluey\nDragon\nDinosaur\nAxolotl\nCustom Character"
                },
                filament_color_field("primary_color", "Primary Color"),
                filament_color_field("secondary_color", "Secondary Color (Optional)", False),
                {
                    "id": "character_notes",
                    "label": "Character Notes",
                    "type": "textarea",
                    "required": False,
                    "placeholder": "Tell us anything you'd like us to know about your character or preferred color placement."
                }
            ]
        }
    ]
    return [{**common, **product} for product in products]

def gifts_keepsakes_celebrations_product_payloads(collection_id: str = GIFTS_KEEPSAKES_CELEBRATIONS_COLLECTION_ID):
    standard_size_notice = "Standard size only. Need another size? Please submit a Custom Order Request."
    common = {
        "category": "Gifts, Keepsakes & Celebrations",
        "collection_ids": [collection_id],
        "badge": "Made to Order",
        "badge_color": "#2563eb",
        "sale_badge_enabled": True,
        "stock": 0,
        "published": True,
        "is_custom": True,
        "available_colors": [],
        "material_details": "Professionally 3D printed to order using quality PLA filament and finished with care.",
        "product_page_section_title": "Customize Your Display",
        "product_page_section_text": "Complete the required personalization and color options below. All display products are made to order in standard size.",
        "custom_builder": ""
    }
    products = [
        {
            "id": "gifts-personalized-papa-word-display",
            "name": "Personalized Papa Word Display",
            "price": 29.99,
            "images": ["/assets/products/gifts-keepsakes-celebrations/personalized-papa-word-display.jpg"],
            "image_alt": "Blue 3D printed Papa word display keepsake",
            "description": "A bold 3D printed Papa display made as a meaningful keepsake for dads, grandpas, and father figures. This decorative display is printed to order and makes a thoughtful gift for Father's Day, birthdays, Christmas, or any special occasion.",
            "product_page_section_text": "This design is sold exactly as shown. Customers may only choose the display color. No wording changes, font changes, or size changes are included.",
            "product_page_note": "This design is sold exactly as shown. No wording changes. No font changes. No size changes. If you want a different word or size, please submit a Custom Order Request.",
            "customization_fields": [
                filament_color_field("display_color", "Display Color")
            ]
        },
        {
            "id": "gifts-layered-name-word-art",
            "name": "Layered Name Word Art",
            "price": 34.99,
            "images": ["/assets/products/gifts-keepsakes-celebrations/layered-name-word-art.jpg"],
            "image_alt": "3D printed layered name word art display",
            "description": "A personalized layered name display featuring elegant script over bold block lettering. Perfect for bedrooms, nurseries, offices, shelves, and personalized gifts.",
            "product_page_note": standard_size_notice,
            "customization_fields": [
                {"id": "main_name", "label": "Main Name", "type": "text", "required": True, "placeholder": "Enter the main block name"},
                {"id": "front_script_name", "label": "Front Script Name", "type": "text", "required": True, "placeholder": "Enter the front script name"},
                filament_color_field("base_color", "Base Color"),
                filament_color_field("script_color", "Script Color")
            ]
        },
        {
            "id": "gifts-personalized-initial-name-display",
            "name": "Personalized Initial Name Display",
            "price": 24.99,
            "images": ["/assets/products/gifts-keepsakes-celebrations/personalized-initial-name-display.jpg"],
            "image_alt": "Pink and white 3D printed initial name display",
            "description": "A modern personalized monogram featuring a large initial with a custom name layered across the front. Makes a beautiful gift for birthdays, baby showers, teachers, offices, weddings, and home décor.",
            "product_page_note": standard_size_notice,
            "customization_fields": [
                {"id": "large_initial", "label": "Large Initial", "type": "text", "required": True, "max_length": 1, "placeholder": "1 character"},
                {"id": "name", "label": "Name", "type": "text", "required": True, "placeholder": "Enter the name"},
                filament_color_field("initial_color", "Initial Color"),
                filament_color_field("name_color", "Name Color")
            ]
        },
        {
            "id": "gifts-custom-graduation-display",
            "name": "Custom Graduation Display",
            "price": 39.99,
            "images": ["/assets/products/gifts-keepsakes-celebrations/custom-graduation-display.jpg"],
            "image_alt": "Custom 3D printed graduation display with class year and name",
            "description": "Celebrate your graduate with a personalized graduation display featuring graduation year, graduate's name, and graduation cap. Perfect for graduation parties, gifts, memory tables, and keepsakes.",
            "product_page_note": standard_size_notice,
            "customization_fields": [
                {"id": "graduation_year", "label": "Graduation Year", "type": "text", "required": True, "placeholder": "Example: 2026"},
                {"id": "graduate_name", "label": "Graduate Name", "type": "text", "required": True, "placeholder": "Enter graduate name"},
                filament_color_field("main_color", "Main Color"),
                filament_color_field("accent_color", "Accent Color")
            ]
        },
        {
            "id": "gifts-personalized-couple-name-display",
            "name": "Personalized Couple Name Display",
            "price": 39.99,
            "images": ["/assets/products/gifts-keepsakes-celebrations/personalized-couple-name-display.jpg"],
            "image_alt": "3D printed couple name display with special date",
            "description": "Celebrate your love story with a custom couple's display featuring two names connected with elegant script and a personalized special date. Perfect for weddings, anniversaries, engagements, bridal showers, Valentine's Day, or home décor.",
            "product_page_note": standard_size_notice,
            "customization_fields": [
                {"id": "name_1", "label": "Name 1", "type": "text", "required": True, "placeholder": "Enter first name"},
                {"id": "name_2", "label": "Name 2", "type": "text", "required": True, "placeholder": "Enter second name"},
                {"id": "special_date", "label": "Special Date", "type": "text", "required": True, "placeholder": "Example: 11.11.2024"},
                filament_color_field("base_color", "Base Color"),
                filament_color_field("script_color", "Script Color")
            ]
        },
        {
            "id": "gifts-custom-pendant-and-chain",
            "name": "Custom Pendant and Chain",
            "price": 25.99,
            "images": ["/assets/products/gifts-keepsakes-celebrations/custom-pendant-and-chain.jpg"],
            "image_alt": "Custom glitter name pendant and chain",
            "description": "Create a personalized custom pendant and chain with the name or word of your choice. This bold statement piece is 3D printed and can be customized with your preferred colors. Perfect for birthdays, concerts, events, gifts, party favors, photoshoots, and custom fashion accessories.",
            "product_page_section_title": "Customize Your Pendant",
            "product_page_section_text": "Choose your pendant size, name or word, colors, and optional glitter/resin finish before checkout.",
            "product_page_note": "Each pendant is custom made. Final look may vary slightly depending on the name length, font shape, colors selected, and finish chosen.",
            "customization_fields": [
                {"id": "pendant_text", "label": "Name or word you would like on the pendant", "type": "text", "required": True, "placeholder": "Example: Cardie"},
                {
                    "id": "pendant_size",
                    "label": "Pendant Size",
                    "type": "select",
                    "required": True,
                    "options": ["Regular", "Large"],
                    "price_adjustments": {"Regular": 0, "Large": 14.01},
                    "helper": "Regular starts at $25.99. Large starts at $40.00."
                },
                filament_color_field("main_color", "Main Color"),
                filament_color_field("chain_color", "Chain Color"),
                {
                    "id": "glitter_resin_add_on",
                    "label": "Add glitter and resin finish",
                    "type": "checkbox",
                    "required": False,
                    "price_adjustments": {"true": 5},
                    "helper": "Glitter and resin adds a shiny, sparkly sealed finish to make the pendant stand out."
                }
            ]
        }
    ]
    return [{**common, **product} for product in products]

async def resolve_nfc_stands_collection(product_ids):
    collections = await db.product_collections.find({}, {"_id": 0}).to_list(1000)
    seeded_collection = next((collection for collection in collections if collection.get("id") == NFC_BUSINESS_STANDS_COLLECTION_ID), None)
    existing_admin_collection = next(
        (
            collection for collection in collections
            if collection.get("id") != NFC_BUSINESS_STANDS_COLLECTION_ID and is_nfc_stands_collection(collection)
        ),
        None
    )

    target_collection = existing_admin_collection or seeded_collection
    if target_collection:
        target_collection_id = target_collection["id"]
        await db.product_collections.update_one(
            {"id": target_collection_id},
            {
                "$addToSet": {"product_ids": {"$each": product_ids}},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )

        if seeded_collection and existing_admin_collection and seeded_collection.get("nfc_seed_version"):
            await db.product_collections.delete_one({"id": NFC_BUSINESS_STANDS_COLLECTION_ID})

        return target_collection_id

    collection_payload = {
        "id": NFC_BUSINESS_STANDS_COLLECTION_ID,
        "name": "NFC Business Stands",
        "description": NFC_BUSINESS_STANDS_DESCRIPTION,
        "image_url": "/assets/products/nfc-stands/nfc-business-hub-neeta-tees.jpg",
        "image_alt": "Custom 3D printed NFC business stands",
        "link_url": f"/shop?collection={NFC_BUSINESS_STANDS_COLLECTION_ID}",
        "type": "manual",
        "product_ids": product_ids,
        "rules": [],
        "sort_order": 1,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "nfc_seed_version": 2
    }
    await db.product_collections.insert_one(collection_payload)
    return NFC_BUSINESS_STANDS_COLLECTION_ID

async def resolve_keychains_charms_collection(product_ids):
    collections = await db.product_collections.find({}, {"_id": 0}).to_list(1000)
    target_collection = next((collection for collection in collections if is_keychains_charms_collection(collection)), None)
    if target_collection:
        target_collection_id = target_collection["id"]
        await db.product_collections.update_one(
            {"id": target_collection_id},
            {
                "$addToSet": {"product_ids": {"$each": product_ids}},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        return target_collection_id

    collection_payload = {
        "id": KEYCHAINS_CHARMS_COLLECTION_ID,
        "name": "Keychains & Charms",
        "description": "Shop custom 3D-printed keychains, charms, NFC keychains, and personalized accessories made to order with colors, names, logos, links, and custom design details.",
        "image_url": "/assets/products/nfc-keychains/social-payment-nfc-keychains.jpg",
        "image_alt": "Custom NFC keychains and charms",
        "link_url": f"/shop?collection={KEYCHAINS_CHARMS_COLLECTION_ID}",
        "type": "manual",
        "product_ids": product_ids,
        "rules": [],
        "sort_order": 2,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "keychain_seed_version": 1
    }
    await db.product_collections.insert_one(collection_payload)
    return KEYCHAINS_CHARMS_COLLECTION_ID

async def resolve_home_decor_lithophanes_collection(product_ids):
    collections = await db.product_collections.find({}, {"_id": 0}).to_list(1000)
    target_collection = next((collection for collection in collections if is_home_decor_lithophanes_collection(collection)), None)
    if target_collection:
        target_collection_id = target_collection["id"]
        await db.product_collections.update_one(
            {"id": target_collection_id},
            {
                "$addToSet": {"product_ids": {"$each": product_ids}},
                "$set": {
                    "description": target_collection.get("description") or HOME_DECOR_LITHOPHANES_DESCRIPTION,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return target_collection_id

    collection_payload = {
        "id": HOME_DECOR_LITHOPHANES_COLLECTION_ID,
        "name": "Home Décor & Lithophanes",
        "description": HOME_DECOR_LITHOPHANES_DESCRIPTION,
        "image_url": "/assets/products/home-decor-lithophanes/lithophane-nightlight.jpg",
        "image_alt": "Custom 3D printed home décor and lithophane products",
        "link_url": f"/shop?collection={HOME_DECOR_LITHOPHANES_COLLECTION_ID}",
        "type": "manual",
        "product_ids": product_ids,
        "rules": [],
        "sort_order": 3,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "home_decor_seed_version": 1
    }
    await db.product_collections.insert_one(collection_payload)
    return HOME_DECOR_LITHOPHANES_COLLECTION_ID

async def resolve_toys_fidgets_collection(product_ids):
    collections = await db.product_collections.find({}, {"_id": 0}).to_list(1000)
    target_collection = next((collection for collection in collections if is_toys_fidgets_collection(collection)), None)
    if target_collection:
        target_collection_id = target_collection["id"]
        await db.product_collections.update_one(
            {"id": target_collection_id},
            {
                "$addToSet": {"product_ids": {"$each": product_ids}},
                "$set": {
                    "description": target_collection.get("description") or TOYS_FIDGETS_DESCRIPTION,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return target_collection_id

    collection_payload = {
        "id": TOYS_FIDGETS_COLLECTION_ID,
        "name": "Toys & Fidgets",
        "description": TOYS_FIDGETS_DESCRIPTION,
        "image_url": "",
        "image_alt": "Custom 3D printed toys and fidgets",
        "link_url": f"/shop?collection={TOYS_FIDGETS_COLLECTION_ID}",
        "type": "manual",
        "product_ids": product_ids,
        "rules": [],
        "sort_order": 4,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "toys_fidgets_seed_version": 1
    }
    await db.product_collections.insert_one(collection_payload)
    return TOYS_FIDGETS_COLLECTION_ID

async def resolve_gifts_keepsakes_celebrations_collection(product_ids):
    collections = await db.product_collections.find({}, {"_id": 0}).to_list(1000)
    target_collection = next((collection for collection in collections if is_gifts_keepsakes_celebrations_collection(collection)), None)
    if target_collection:
        target_collection_id = target_collection["id"]
        await db.product_collections.update_one(
            {"id": target_collection_id},
            {
                "$addToSet": {"product_ids": {"$each": product_ids}},
                "$set": {
                    "description": target_collection.get("description") or GIFTS_KEEPSAKES_CELEBRATIONS_DESCRIPTION,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return target_collection_id

    collection_payload = {
        "id": GIFTS_KEEPSAKES_CELEBRATIONS_COLLECTION_ID,
        "name": "Gifts, Keepsakes & Celebrations",
        "description": GIFTS_KEEPSAKES_CELEBRATIONS_DESCRIPTION,
        "image_url": "/assets/products/gifts-keepsakes-celebrations/personalized-couple-name-display.jpg",
        "image_alt": "Custom 3D printed gifts keepsakes and celebration displays",
        "link_url": f"/shop?collection={GIFTS_KEEPSAKES_CELEBRATIONS_COLLECTION_ID}",
        "type": "manual",
        "product_ids": product_ids,
        "rules": [],
        "sort_order": 5,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "gifts_seed_version": 1
    }
    await db.product_collections.insert_one(collection_payload)
    return GIFTS_KEEPSAKES_CELEBRATIONS_COLLECTION_ID

_nfc_seed_completed = False

async def ensure_nfc_business_stands_seeded():
    """Create NFC stand products and attach them to the existing NFC collection when available."""
    global _nfc_seed_completed
    if _nfc_seed_completed:
        return
    product_ids = [product["id"] for product in nfc_product_payloads()]
    keychain_product_ids = [product["id"] for product in nfc_keychain_product_payloads()]
    home_decor_product_ids = [product["id"] for product in home_decor_lithophanes_product_payloads()]
    toys_fidgets_product_ids = [product["id"] for product in toys_fidgets_product_payloads()]
    gifts_product_ids = [product["id"] for product in gifts_keepsakes_celebrations_product_payloads()]
    existing_category = await db.categories.find_one({"name": "NFC Business Stands"}, {"_id": 0})
    if not existing_category:
        await db.categories.insert_one({
            "id": "nfc-business-stands-category",
            "name": "NFC Business Stands",
            "description": NFC_BUSINESS_STANDS_DESCRIPTION,
            "image_url": "/assets/products/nfc-stands/nfc-business-hub-neeta-tees.jpg",
            "created_at": datetime.now(timezone.utc)
        })
    existing_keychain_category = await db.categories.find_one({"name": "Keychains & Charms"}, {"_id": 0})
    if not existing_keychain_category:
        await db.categories.insert_one({
            "id": "keychains-charms-category",
            "name": "Keychains & Charms",
            "description": "Custom 3D-printed keychains, charms, NFC keychains, and personalized accessories.",
            "image_url": "/assets/products/nfc-keychains/social-payment-nfc-keychains.jpg",
            "created_at": datetime.now(timezone.utc)
        })

    target_collection_id = await resolve_nfc_stands_collection(product_ids)
    keychain_collection_id = await resolve_keychains_charms_collection(keychain_product_ids)
    home_decor_collection_id = await resolve_home_decor_lithophanes_collection(home_decor_product_ids)
    toys_fidgets_collection_id = await resolve_toys_fidgets_collection(toys_fidgets_product_ids)
    gifts_collection_id = await resolve_gifts_keepsakes_celebrations_collection(gifts_product_ids)

    for product_payload in nfc_product_payloads(target_collection_id):
        now = datetime.now(timezone.utc).isoformat()
        product_payload = {
            **product_payload,
            "updated_at": now,
            "nfc_seed_version": 2
        }
        existing_product = await db.products.find_one({"id": product_payload["id"]}, {"_id": 0})
        if existing_product:
            fields_to_fill = {
                key: value
                for key, value in product_payload.items()
                if key not in existing_product
            }
            fields_to_fill.update({
                "updated_at": now,
                "nfc_seed_version": 2
            })
            await db.products.update_one(
                {"id": product_payload["id"]},
                {"$set": fields_to_fill}
            )
            await db.products.update_one(
                {"id": product_payload["id"]},
                {"$addToSet": {"collection_ids": target_collection_id}}
            )
            await db.products.update_one(
                {"id": product_payload["id"]},
                {"$pull": {"add_on_options": {"name": {"$in": ["Extra NFC icon", "Extra color"]}}}}
            )
            if target_collection_id != NFC_BUSINESS_STANDS_COLLECTION_ID:
                await db.products.update_one(
                    {"id": product_payload["id"]},
                    {"$pull": {"collection_ids": NFC_BUSINESS_STANDS_COLLECTION_ID}}
                )
        else:
            product_payload["created_at"] = now
            await db.products.insert_one(product_payload)

    for product_payload in nfc_keychain_product_payloads(keychain_collection_id):
        now = datetime.now(timezone.utc).isoformat()
        product_payload = {
            **product_payload,
            "updated_at": now,
            "keychain_seed_version": 1
        }
        existing_product = await db.products.find_one({"id": product_payload["id"]}, {"_id": 0})
        if existing_product:
            fields_to_fill = {
                key: value
                for key, value in product_payload.items()
                if key not in existing_product
            }
            fields_to_fill.update({
                "updated_at": now,
                "keychain_seed_version": 1
            })
            await db.products.update_one(
                {"id": product_payload["id"]},
                {"$set": fields_to_fill}
            )
            await db.products.update_one(
                {"id": product_payload["id"]},
                {"$addToSet": {"collection_ids": keychain_collection_id}}
            )
            existing_fields = existing_product.get("customization_fields") or []
            product_fields = product_payload.get("customization_fields") or []
            needs_filament_refresh = (
                product_fields
                and any(field.get("type") == "filament_color" for field in product_fields)
                and not any(field.get("type") == "filament_color" for field in existing_fields)
            )
            if product_fields and (not existing_fields or needs_filament_refresh):
                await db.products.update_one(
                    {"id": product_payload["id"]},
                    {"$set": {"customization_fields": product_fields}}
                )
            await db.products.update_one(
                {"id": product_payload["id"]},
                {"$pull": {"collection_ids": NFC_BUSINESS_STANDS_COLLECTION_ID}}
            )
        else:
            product_payload["created_at"] = now
            await db.products.insert_one(product_payload)

    for product_payload in home_decor_lithophanes_product_payloads(home_decor_collection_id):
        now = datetime.now(timezone.utc).isoformat()
        product_payload = {
            **product_payload,
            "updated_at": now,
            "home_decor_seed_version": 1
        }
        existing_product = await db.products.find_one({"id": product_payload["id"]}, {"_id": 0})
        if existing_product:
            fields_to_fill = {
                key: value
                for key, value in product_payload.items()
                if key not in existing_product
            }
            fields_to_fill.update({
                "updated_at": now,
                "home_decor_seed_version": 1
            })
            await db.products.update_one(
                {"id": product_payload["id"]},
                {"$set": fields_to_fill}
            )
            await db.products.update_one(
                {"id": product_payload["id"]},
                {"$addToSet": {"collection_ids": home_decor_collection_id}}
            )
            existing_fields = existing_product.get("customization_fields") or []
            product_fields = product_payload.get("customization_fields") or []
            needs_filament_refresh = (
                product_fields
                and any(field.get("type") == "filament_color" for field in product_fields)
                and not any(field.get("type") == "filament_color" for field in existing_fields)
            )
            if product_fields and (not existing_fields or needs_filament_refresh):
                await db.products.update_one(
                    {"id": product_payload["id"]},
                    {"$set": {"customization_fields": product_fields}}
                )
        else:
            product_payload["created_at"] = now
            await db.products.insert_one(product_payload)

    for product_payload in toys_fidgets_product_payloads(toys_fidgets_collection_id):
        now = datetime.now(timezone.utc).isoformat()
        product_payload = {
            **product_payload,
            "updated_at": now,
            "toys_fidgets_seed_version": 1
        }
        existing_product = await db.products.find_one({"id": product_payload["id"]}, {"_id": 0})
        if existing_product:
            fields_to_fill = {
                key: value
                for key, value in product_payload.items()
                if key not in existing_product
            }
            fields_to_fill.update({
                "updated_at": now,
                "toys_fidgets_seed_version": 1
            })
            await db.products.update_one(
                {"id": product_payload["id"]},
                {"$set": fields_to_fill}
            )
            await db.products.update_one(
                {"id": product_payload["id"]},
                {"$addToSet": {"collection_ids": toys_fidgets_collection_id}}
            )
            existing_fields = existing_product.get("customization_fields") or []
            product_fields = product_payload.get("customization_fields") or []
            needs_filament_refresh = (
                product_fields
                and any(field.get("type") == "filament_color" for field in product_fields)
                and not any(field.get("type") == "filament_color" for field in existing_fields)
            )
            if product_fields and (not existing_fields or needs_filament_refresh):
                await db.products.update_one(
                    {"id": product_payload["id"]},
                    {"$set": {"customization_fields": product_fields}}
                )
        else:
            product_payload["created_at"] = now
            await db.products.insert_one(product_payload)

    for product_payload in gifts_keepsakes_celebrations_product_payloads(gifts_collection_id):
        now = datetime.now(timezone.utc).isoformat()
        product_payload = {
            **product_payload,
            "updated_at": now,
            "gifts_seed_version": 1
        }
        existing_product = await db.products.find_one({"id": product_payload["id"]}, {"_id": 0})
        if existing_product:
            fields_to_fill = {
                key: value
                for key, value in product_payload.items()
                if key not in existing_product
            }
            fields_to_fill.update({
                "updated_at": now,
                "gifts_seed_version": 1
            })
            await db.products.update_one(
                {"id": product_payload["id"]},
                {"$set": fields_to_fill}
            )
            await db.products.update_one(
                {"id": product_payload["id"]},
                {"$addToSet": {"collection_ids": gifts_collection_id}}
            )
            existing_fields = existing_product.get("customization_fields") or []
            product_fields = product_payload.get("customization_fields") or []
            needs_filament_refresh = (
                product_fields
                and any(field.get("type") == "filament_color" for field in product_fields)
                and not any(field.get("type") == "filament_color" for field in existing_fields)
            )
            if product_fields and (not existing_fields or needs_filament_refresh):
                await db.products.update_one(
                    {"id": product_payload["id"]},
                    {"$set": {"customization_fields": product_fields}}
                )
        else:
            product_payload["created_at"] = now
            await db.products.insert_one(product_payload)

    _nfc_seed_completed = True

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, collection: Optional[str] = None, published: Optional[bool] = None, search: Optional[str] = None):
    """Get all products with optional filters"""
    await ensure_nfc_business_stands_seeded()
    query = {}
    if category:
        query["category"] = category
    collection_product_ids = []
    collection_match_ids = []
    if collection:
        collection_doc = await db.product_collections.find_one({"id": collection}, {"_id": 0})
        if not collection_doc:
            all_collections = await db.product_collections.find({}, {"_id": 0}).to_list(1000)
            normalized_collection = collection.strip().lower().replace("-", " ")
            collection_doc = next(
                (
                    item for item in all_collections
                    if item.get("id") == collection
                    or (item.get("name") or "").strip().lower() == normalized_collection
                    or (item.get("link_url") or "").endswith(f"collection={collection}")
                ),
                None
            )
        collection_product_ids = collection_doc.get("product_ids", []) if collection_doc else []
        collection_match_ids = [collection]
        if collection_doc and collection_doc.get("id") not in collection_match_ids:
            collection_match_ids.append(collection_doc.get("id"))
        if collection_doc and is_toys_fidgets_collection(collection_doc):
            collection_product_ids = list(set(collection_product_ids + [product["id"] for product in toys_fidgets_product_payloads(collection_doc.get("id", collection))]))
        if collection_doc and is_gifts_keepsakes_celebrations_collection(collection_doc):
            collection_product_ids = list(set(collection_product_ids + [product["id"] for product in gifts_keepsakes_celebrations_product_payloads(collection_doc.get("id", collection))]))
        query["$or"] = [
            {"collection_ids": {"$in": collection_match_ids}},
            {"id": {"$in": collection_product_ids}}
        ]
    if published is not None:
        query["published"] = published
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    if collection:
        allowed_product_ids = set(collection_product_ids)
        allowed_collection_ids = set(collection_match_ids)
        products = [
            product for product in products
            if allowed_collection_ids.intersection(set(product.get("collection_ids") or [])) or product.get("id") in allowed_product_ids
        ]
    
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
    await ensure_nfc_business_stands_seeded()
    collections = await db.product_collections.find({}, {"_id": 0}).to_list(1000)
    for collection in collections:
        if isinstance(collection.get('created_at'), str):
            collection['created_at'] = datetime.fromisoformat(collection['created_at'])
        normalized_name = (collection.get("name") or "").strip().lower().replace("decor", "décor")
        if normalized_name == "home décor & lithophanes" and not collection.get("wording_migrated_home_decor_20260629"):
            collection["description"] = HOME_DECOR_LITHOPHANES_DESCRIPTION
            await db.product_collections.update_one(
                {"id": collection.get("id")},
                {"$set": {
                    "description": HOME_DECOR_LITHOPHANES_DESCRIPTION,
                    "wording_migrated_home_decor_20260629": True
                }}
            )
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

# ============ INQUIRY ROUTES ============

def serialize_inquiry(inquiry: Dict, inquiry_type: str) -> Dict:
    inquiry.pop("_id", None)
    inquiry["inquiry_type"] = inquiry_type
    created_at = inquiry.get("created_at")
    updated_at = inquiry.get("updated_at")

    if isinstance(created_at, datetime):
        inquiry["created_at"] = created_at.isoformat()
    if isinstance(updated_at, datetime):
        inquiry["updated_at"] = updated_at.isoformat()

    return inquiry

@api_router.post("/custom-quote-requests", response_model=CustomQuoteRequest)
async def create_custom_quote_request(inquiry_data: CustomQuoteRequest):
    """Create a custom quote inquiry from the public design-your-own form"""
    inquiry = inquiry_data.model_dump()
    inquiry["created_at"] = inquiry["created_at"].isoformat()
    await db.custom_quote_requests.insert_one(inquiry)
    return inquiry_data

@api_router.post("/partner-inquiries", response_model=PartnerInquiry)
async def create_partner_inquiry(inquiry_data: PartnerInquiry):
    """Create a partnership or collaboration inquiry"""
    inquiry = inquiry_data.model_dump()
    inquiry["created_at"] = inquiry["created_at"].isoformat()
    await db.partner_inquiries.insert_one(inquiry)
    return inquiry_data

@api_router.post("/custom-quote-uploads")
async def upload_custom_quote_image(file: UploadFile = File(...)):
    """Upload an optional inspiration image for a public custom quote request"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    content = await file.read()
    max_size = 8 * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="Image must be 8MB or smaller")

    try:
        result = CloudinaryService.upload_image(content, folder="custom-quote-requests")
        return result
    except Exception as e:
        logging.error(f"Custom quote image upload failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Image upload failed")

@api_router.get("/admin/inquiries")
async def get_admin_inquiries(user: User = Depends(require_admin)):
    """Get quote, custom design, and contact inquiries for the admin inbox"""
    quote_requests = await db.custom_quote_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    contact_requests = await db.partner_inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

    inquiries = [
        *(serialize_inquiry(inquiry, "custom_quote") for inquiry in quote_requests),
        *(serialize_inquiry(inquiry, "contact") for inquiry in contact_requests)
    ]

    return sorted(inquiries, key=lambda item: item.get("created_at", ""), reverse=True)

@api_router.put("/admin/inquiries/{inquiry_type}/{inquiry_id}/status")
async def update_admin_inquiry_status(
    inquiry_type: str,
    inquiry_id: str,
    status_update: InquiryStatusUpdate,
    user: User = Depends(require_admin)
):
    """Update the workflow status for a saved inquiry"""
    allowed_statuses = {"new", "reviewing", "quoted", "completed", "archived"}
    if status_update.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid inquiry status")

    collections = {
        "custom_quote": db.custom_quote_requests,
        "contact": db.partner_inquiries,
        "partner": db.partner_inquiries
    }
    collection = collections.get(inquiry_type)
    if collection is None:
        raise HTTPException(status_code=400, detail="Invalid inquiry type")

    result = await collection.update_one(
        {"id": inquiry_id},
        {"$set": {
            "status": status_update.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    return {"message": "Inquiry status updated"}

@api_router.post("/newsletter-signups", response_model=NewsletterSignup)
async def create_newsletter_signup(signup_data: NewsletterSignup):
    """Create or refresh a VIP/newsletter signup"""
    signup = signup_data.model_dump()
    signup["email"] = signup["email"].strip().lower()
    signup["created_at"] = signup["created_at"].isoformat()
    await db.newsletter_signups.update_one(
        {"email": signup["email"]},
        {"$set": signup},
        upsert=True
    )
    return NewsletterSignup(**signup)

# ============ REVIEW ROUTES ============

def serialize_review(review: Dict) -> Dict:
    review.pop("_id", None)
    for field in ["created_at", "updated_at"]:
        if isinstance(review.get(field), datetime):
            review[field] = review[field].isoformat()
    return review

@api_router.get("/reviews", response_model=List[CustomerReview])
async def get_featured_reviews():
    """Get approved featured reviews for the public homepage"""
    reviews = await db.customer_reviews.find(
        {"status": "approved", "featured": True},
        {"_id": 0}
    ).sort("created_at", -1).to_list(4)
    return [serialize_review(review) for review in reviews]

@api_router.post("/reviews", response_model=CustomerReview)
async def create_customer_review(review_data: CustomerReview):
    """Create a customer review submission for admin approval"""
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    review = review_data.model_dump()
    review["name"] = review["name"].strip()
    review["review"] = review["review"].strip()
    review["status"] = "pending"
    review["featured"] = False
    review["created_at"] = review["created_at"].isoformat()
    review["updated_at"] = None

    if not review["name"] or not review["review"]:
        raise HTTPException(status_code=400, detail="Name and review are required")

    await db.customer_reviews.insert_one(review)
    return CustomerReview(**review)

@api_router.get("/admin/reviews")
async def get_admin_reviews(user: User = Depends(require_admin)):
    """Get all customer reviews for admin management"""
    reviews = await db.customer_reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [serialize_review(review) for review in reviews]

@api_router.put("/admin/reviews/{review_id}")
async def update_admin_review(review_id: str, review_update: CustomerReviewUpdate, user: User = Depends(require_admin)):
    """Update a customer review and choose whether it appears on the homepage"""
    existing = await db.customer_reviews.find_one({"id": review_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Review not found")

    update_data = {key: value for key, value in review_update.model_dump().items() if value is not None}
    if "rating" in update_data and (update_data["rating"] < 1 or update_data["rating"] > 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    if "status" in update_data and update_data["status"] not in {"pending", "approved", "hidden"}:
        raise HTTPException(status_code=400, detail="Invalid review status")

    if update_data.get("featured"):
        featured_count = await db.customer_reviews.count_documents({
            "id": {"$ne": review_id},
            "status": "approved",
            "featured": True
        })
        if featured_count >= 4:
            raise HTTPException(status_code=400, detail="Only 4 reviews can be highlighted at a time")
        update_data["status"] = "approved"

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.customer_reviews.update_one({"id": review_id}, {"$set": update_data})
    return {"message": "Review updated"}

@api_router.delete("/admin/reviews/{review_id}")
async def delete_admin_review(review_id: str, user: User = Depends(require_admin)):
    """Delete a customer review"""
    result = await db.customer_reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review deleted"}

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
async def create_order(order_data: OrderCreate, background_tasks: BackgroundTasks, user: User = Depends(require_auth)):
    """Create new order"""
    pricing_error = await verify_order_pricing(order_data)
    if pricing_error:
        logging.warning(f"Order price verification failed for user {user.id}: {pricing_error}")
        raise HTTPException(status_code=400, detail=pricing_error)

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
        rush_order=order_data.rush_order,
        rush_order_amount=order_data.rush_order_amount,
        shipping_option=order_data.shipping_option,
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

    if to_cents(order.get("total", 0)) <= 0:
        pricing_error = "Order total is not valid for payment"
        logging.warning(f"Order price verification failed for user {user.id}: {pricing_error}")
        raise HTTPException(status_code=400, detail=pricing_error)

    # Warn (but do not block) if admin price changes since order creation
    # would make stored item prices lower than current base prices.
    order_product_ids = [item.get("product_id") for item in order.get("items", [])]
    current_products = await db.products.find({"id": {"$in": order_product_ids}}, {"_id": 0, "id": 1, "price": 1}).to_list(1000)
    current_price_map = {product["id"]: product.get("price", 0) for product in current_products}
    for item in order.get("items", []):
        current_base = current_price_map.get(item.get("product_id"))
        if current_base is not None and to_cents(item.get("price")) < to_cents(current_base) - 2:
            logging.warning(
                f"Order {order['id']}: item {item.get('product_id')} priced below current base "
                f"({item.get('price')} < {current_base}); allowing (price changed after order creation)"
            )

    # Create success and cancel URLs
    success_url = f"{checkout_req.origin_url}/order-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{checkout_req.origin_url}/checkout"
    
    # Create checkout session
    stripe.api_key = require_stripe_key()
    session = stripe.checkout.Session.create(
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        customer_email=user.email,
        line_items=[
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"Print Queen 3D order {order['id'][:8]}",
                    },
                    "unit_amount": amount_to_cents(order["total"]),
                },
                "quantity": 1,
            }
        ],
        metadata={
            "order_id": order["id"],
            "user_id": user.id,
            "user_email": user.email
        }
    )
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        session_id=session.id,
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
        {"$set": {"payment_session_id": session.id}}
    )
    
    return {"url": session.url, "session_id": session.id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, user: User = Depends(require_auth)):
    """Get checkout session status"""
    # Check if already processed
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment transaction not found")
    if transaction.get("user_id") and transaction["user_id"] != user.id and not user.is_admin:
        raise HTTPException(status_code=404, detail="Payment transaction not found")
    
    # If already paid, return existing status
    if transaction["payment_status"] == "paid":
        return {
            "status": "complete",
            "payment_status": "paid",
            "session_id": session_id
        }
    
    # Check with Stripe
    stripe.api_key = require_stripe_key()
    checkout_status = stripe.checkout.Session.retrieve(session_id)
    
    # Update transaction status
    if checkout_status.payment_status == "paid" and transaction["payment_status"] != "paid":
        await mark_checkout_paid(session_id, "paid")
    
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

    stripe.api_key = require_stripe_key()
    
    try:
        if stripe_webhook_secret:
            if not signature:
                raise stripe.SignatureVerificationError(
                    "Missing Stripe-Signature header",
                    signature
                )
            event = stripe.Webhook.construct_event(body, signature, stripe_webhook_secret)
        else:
            logging.error("STRIPE_WEBHOOK_SECRET is not configured; rejecting unsigned webhook")
            raise HTTPException(status_code=400, detail="Webhook signing is not configured")

        if event["type"] in ["checkout.session.completed", "checkout.session.async_payment_succeeded"]:
            session = event["data"]["object"]
            await mark_checkout_paid(session["id"], session.get("payment_status", "paid"))
        elif event["type"] in ["checkout.session.expired", "checkout.session.async_payment_failed"]:
            session = event["data"]["object"]
            await db.payment_transactions.update_one(
                {"session_id": session["id"]},
                {"$set": {"payment_status": session.get("payment_status", "failed")}}
            )
        
        return {"status": "success"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook payload")
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook signature")
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

# ============ ADMIN ROUTES ============

@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(user: User = Depends(require_admin)):
    """Get paid/verified orders (admin only)"""
    orders = await db.orders.find(
        {"status": {"$in": ADMIN_VISIBLE_ORDER_STATUSES}},
        {"_id": 0}
    ).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, background_tasks: BackgroundTasks, user: User = Depends(require_admin)):
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
    background_tasks.add_task(send_status_update_email_background, order_id, status)
    return {"message": "Order status updated"}

class OrderFulfillment(BaseModel):
    fulfillment_action: str = "ship"  # "ship", "pickup", "fulfill_only"
    tracking_number: Optional[str] = None
    shipping_carrier: Optional[str] = None
    admin_notes: Optional[str] = None

@api_router.put("/admin/orders/{order_id}/fulfill")
async def fulfill_order(order_id: str, fulfillment: OrderFulfillment, background_tasks: BackgroundTasks, user: User = Depends(require_admin)):
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

    # Notify the customer: ready-for-pickup, shipped (with tracking), or fulfilled
    if fulfillment.fulfillment_action == "pickup":
        background_tasks.add_task(send_status_update_email_background, order_id, "ready_for_pickup")
    else:
        background_tasks.add_task(send_status_update_email_background, order_id, update_data["status"])

    return {"message": f"Order {fulfillment.fulfillment_action} successfully", "status": update_data["status"]}

@api_router.get("/admin/orders/{order_id}")
async def get_order_details(order_id: str, user: User = Depends(require_admin)):
    """Get detailed order info (admin only)"""
    order = await db.orders.find_one(
        {"id": order_id, "status": {"$in": ADMIN_VISIBLE_ORDER_STATUSES}},
        {"_id": 0}
    )
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

    # One aggregation for all customers' paid/verified order stats instead of a query per user.
    pipeline = [
        {"$match": {"status": {"$in": ADMIN_VISIBLE_ORDER_STATUSES}}},
        {"$group": {
            "_id": "$user_id",
            "total_orders": {"$sum": 1},
            "total_spent": {"$sum": {"$ifNull": ["$total", 0]}}
        }}
    ]
    stats = {row["_id"]: row for row in await db.orders.aggregate(pipeline).to_list(10000)}

    customers = []
    for usr in users:
        stat = stats.get(usr["id"], {})
        customers.append({
            "id": usr["id"],
            "email": usr["email"],
            "name": usr["name"],
            "created_at": usr.get("created_at"),
            "total_orders": stat.get("total_orders", 0),
            "total_spent": stat.get("total_spent", 0)
        })

    return customers

# ============ SITE EDITOR ROUTES ============

def default_navigation_items():
    return [
        {"id": "home", "label": "Home", "link": "/", "enabled": True, "show_desktop": True, "show_mobile": True, "show_footer": False, "featured": False, "footer_group": "company", "order": 1},
        {"id": "personalize", "label": "Personalize", "link": "/personalize", "enabled": True, "show_desktop": True, "show_mobile": True, "show_footer": True, "featured": True, "order": 2},
        {"id": "shop", "label": "Shop", "link": "/shop", "enabled": True, "show_desktop": True, "show_mobile": True, "show_footer": True, "featured": False, "order": 3},
        {"id": "design-your-own", "label": "Design Your Own", "link": "/design-your-own", "enabled": True, "show_desktop": True, "show_mobile": True, "show_footer": True, "featured": True, "order": 4},
        {"id": "corporate-bulk", "label": "Corporate & Bulk", "link": "/corporate-bulk-orders", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": False, "featured": False, "footer_group": "hidden", "order": 5},
        {"id": "about", "label": "About", "link": "/about", "enabled": True, "show_desktop": True, "show_mobile": True, "show_footer": True, "featured": False, "footer_group": "company", "order": 6},
        {"id": "contact", "label": "Contact", "link": "/contact", "enabled": True, "show_desktop": True, "show_mobile": True, "show_footer": True, "featured": False, "footer_group": "company", "order": 7},
        {"id": "footer-personalized", "label": "Personalized Creations", "link": "/personalize", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "shop", "order": 8},
        {"id": "footer-chains-pendants", "label": "Custom Chains & Pendants", "link": "/shop", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "shop", "order": 9},
        {"id": "footer-nfc-business", "label": "NFC & Business Solutions", "link": "/shop", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "shop", "order": 10},
        {"id": "footer-home-decor", "label": "Home Décor & Lithophanes", "link": "/shop", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "shop", "order": 11},
        {"id": "footer-gifts", "label": "Gifts, Keepsakes & Celebrations", "link": "/shop", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "shop", "order": 12},
        {"id": "footer-design-your-own", "label": "Design Your Own", "link": "/design-your-own", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "shop", "order": 13},
        {"id": "footer-custom-order", "label": "Custom Order", "link": "/design-your-own", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "company", "order": 14},
        {"id": "footer-corporate-bulk", "label": "Corporate & Bulk Orders", "link": "/corporate-bulk-orders", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "company", "order": 15},
        {"id": "footer-partner-with-us", "label": "Partner With Us", "link": "/contact", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "company", "order": 16},
        {"id": "shipping-policy", "label": "Shipping Policy", "link": "/shipping-policy", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "support", "order": 17},
        {"id": "materials-process", "label": "Materials & 3D Printing", "link": "/materials", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "support", "order": 18},
        {"id": "refund-policy", "label": "Refund Policy", "link": "/refund-policy", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "support", "order": 19},
        {"id": "product-care", "label": "Product Care", "link": "/product-care", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "support", "order": 20},
        {"id": "privacy", "label": "Privacy Policy", "link": "/privacy-policy", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "support", "order": 21},
        {"id": "terms", "label": "Terms of Service", "link": "/terms-of-service", "enabled": True, "show_desktop": False, "show_mobile": False, "show_footer": True, "featured": False, "footer_group": "support", "order": 22},
    ]

def merge_default_navigation_items(items: List[Dict]) -> List[Dict]:
    existing_items = list(items or [])
    defaults = default_navigation_items()
    default_by_id = {item["id"]: item for item in defaults}
    for item in existing_items:
        default_item = default_by_id.get(item.get("id"))
        if default_item:
            for key, value in default_item.items():
                if key not in item:
                    item[key] = value
            if item.get("id") == "corporate-bulk" and item.get("link") == "/corporate-bulk-orders":
                item["show_desktop"] = False
                item["show_mobile"] = False
                item["show_footer"] = False
                item["footer_group"] = "hidden"
    existing_ids = {item.get("id") for item in existing_items}
    for default_item in defaults:
        if default_item["id"] not in existing_ids:
            existing_items.append(default_item)
    return existing_items

# Retained ONLY for the one-time content migration (migrate_content_overrides_20260707).
# It is no longer applied on API reads — the admin editor is the source of truth.
def refresh_3d_printing_wording(value):
    if isinstance(value, str):
        replacements = {
            "Premium Materials • Expert Finishing": "Precision 3D Printing • Expert Finishing",
            "premium materials": "quality PLA and PETG materials",
            "Premium Materials": "Precision 3D Printing",
            "crafted with quality PLA and PETG materials": "crafted with precision",
            "made with quality PLA and PETG materials": "made to order and finished with care",
            "quality materials": "quality PLA and PETG materials",
            "Premium custom 3D printing": "Professional custom 3D printing",
            "Local Pickup: Los Angeles • Altadena • Hawthorne • Long Beach • West Covina": "Local Pickup: Los Angeles, California",
            "Local pickup may be available in Los Angeles, Altadena, Hawthorne, Long Beach, and West Covina.": "Local pickup may be available in Los Angeles, California.",
            "Los Angeles, Altadena, Hawthorne, Long Beach, West Covina": "Los Angeles, California",
            "Los Angeles, Altadena, Long Beach, Hawthorne, West Covina": "Los Angeles, California",
            "Most Custom Orders Completed Within 72 Hours": "Production Time: 3-5 Days",
            "Most Orders Complete in 72 Hours": "Production Time: 3-5 Days",
            "Most custom orders are completed within 72 hours after design approval, depending on product type, project complexity, material availability, and order volume.": "Production typically takes 3-5 days after design approval, depending on product type, project complexity, material availability, and order volume.",
            "Most custom orders are completed within 72 hours after design approval, depending on project size and complexity.": "Production typically takes 3-5 days after design approval, depending on project size and complexity.",
        }
        updated = value
        for old, new in replacements.items():
            updated = updated.replace(old, new)
        return updated
    if isinstance(value, list):
        return [refresh_3d_printing_wording(item) for item in value]
    if isinstance(value, dict):
        return {key: refresh_3d_printing_wording(item) for key, item in value.items()}
    return value

# Default homepage sections configuration
DEFAULT_SECTIONS = [
    {
        "id": "marquee",
        "name": "Top Announcement Marquee",
        "enabled": True,
        "order": 1,
        "content": {
            "headline": "Top Announcement Marquee",
            "marquee_messages": [
                "Free U.S. Shipping on Orders $150+",
                "Production Time: 3-5 Days",
                "Local Pickup: Los Angeles, California",
                "Personalized Just for You",
                "Precision 3D Printing • Expert Finishing",
                "Your Vision, Printed Perfectly"
            ],
            "marquee_speed": 30,
            "marquee_direction": "left",
            "marquee_background_color": "",
            "marquee_background_image_url": "",
            "marquee_images": [],
            "marquee_show_images": False,
            "marquee_text_color": "#ffffff",
            "marquee_padding_y": 12,
            "marquee_gap": 32
        }
    },
    {
        "id": "hero",
        "name": "Hero Banner",
        "enabled": True,
        "order": 2,
        "content": {
            "badge_label": "CUSTOM 3D CREATION STUDIO",
            "headline": "Create Something Uniquely Yours",
            "subheadline": "Professionally 3D printed custom creations for personalized gifts, business branding, NFC products, home décor, keepsakes, and one-of-a-kind designs.",
            "description": "CUSTOM 3D CREATION STUDIO",
            "button_text": "Start Custom Order",
            "button_link": "/design-your-own",
            "secondary_button_text": "Shop Collections",
            "secondary_button_link": "#collections",
            "overlay_opacity": 0.58,
            "overlay_color": "#d8ecdd",
            "hero_height_desktop": 640,
            "hero_height_mobile": 560,
            "hero_image_position": "center right"
        }
    },
    {
        "id": "categories",
        "name": "Category Grid",
        "enabled": True,
        "order": 3,
        "content": {
            "headline": "Shop by Collection",
            "subheadline": "Browse our most popular custom creations.",
            "button_text": "Personalize Yours",
            "secondary_button_text": "Start Custom Project",
            "homepage_category_ids": []
        }
    },
    {
        "id": "featured",
        "name": "Featured Products",
        "enabled": True,
        "order": 4,
        "content": {
            "headline": "Best Sellers",
            "subheadline": "Customer favorites made to personalize, gift, and use every day.",
            "button_text": "Customize Now",
            "product_limit": 8
        }
    },
    {
        "id": "why_choose_us",
        "name": "Why Choose Us",
        "enabled": True,
        "order": 5,
        "content": {
            "headline": "Why Print Queen 3D",
            "description": "A quick look at what makes each order feel personal, polished, and professional.",
            "info_cards": [
                {"title": "Personalized for Every Customer", "text": "Every piece can be customized with names, colors, photos, logos, QR codes, NFC chips, or custom design details."},
                {"title": "Production Time: 3-5 Days", "text": "Production typically takes 3-5 days after design approval, depending on project size and complexity."},
                {"title": "Expert Finishing", "text": "Each piece is cleaned, refined, and quality checked for a polished final result."},
                {"title": "Designed & Printed in Los Angeles", "text": "Locally made in Los Angeles with nationwide U.S. shipping and select local pickup options."}
            ]
        }
    },
    {
        "id": "how_it_works",
        "name": "How It Works",
        "enabled": True,
        "order": 5,
        "content": {
            "headline": "How It Works",
            "subheadline": "Custom orders made easy, from idea to finished print in four simple steps.",
            "steps": [
                {"title": "Share Your Idea", "text": "Pick a product to personalize or send us your idea, photo, logo, or sketch through the Design Your Own form."},
                {"title": "We Design It Together", "text": "We review your request, confirm colors, sizes, and details, and make sure everything is exactly how you want it."},
                {"title": "Printed & Finished in LA", "text": "Your piece is professionally 3D printed and hand-finished in Los Angeles with care and quality checks."},
                {"title": "Ship or Local Pickup", "text": "Choose nationwide shipping or free pickup in Los Angeles. Express manufacturing and delivery is available."}
            ],
            "button_text": "Start My Custom Order",
            "button_link": "/design-your-own"
        }
    },
    {
        "id": "faq",
        "name": "FAQ",
        "enabled": True,
        "order": 8,
        "content": {
            "headline": "Frequently Asked Questions",
            "subheadline": "Quick answers about custom orders, turnaround, shipping, and pickup.",
            "faq_items": [
                {"question": "How long does a custom order take?", "answer": "Production typically takes 3-5 days after design approval, depending on product type and order details. If we have something in stock, it ships next day. Shipping or delivery time is separate from production time."},
                {"question": "How do I start a custom order?", "answer": "Use the Design Your Own form to share your idea, inspiration photos, logo, or sketch. We review every request and work with you on colors, sizes, and details before production begins."},
                {"question": "What materials do you use?", "answer": "We professionally 3D print with quality PLA and PETG filament, plus resin finishes when needed. If you need a specific material or finish, include it in your custom request."},
                {"question": "Do you offer local pickup?", "answer": "Yes! Free local pickup is available in Los Angeles. You will receive an email confirmation when your order is ready for pickup."},
                {"question": "Can I get my order faster?", "answer": "Yes, express manufacturing and delivery is available at checkout for an additional $25."},
                {"question": "How does NFC programming work?", "answer": "NFC stands and keychains are programmed to the exact link you provide, like payments, social media, booking pages, menus, reviews, or any custom URL. Please double-check your link before checkout."}
            ],
            "button_text": "Still have questions? Contact us",
            "button_link": "/contact"
        }
    },
    {
        "id": "design_cta",
        "name": "Design Your Own CTA",
        "enabled": True,
        "order": 6,
        "content": {
            "headline": "Have an idea? We’ll bring it to life.",
            "description": "Start your custom order by sharing your idea, inspiration photos, logo, sketch, or reference details. We’ll review your project and help create something made just for you.",
            "button_text": "Start My Custom Project",
            "button_link": "/custom-order",
            "background_image_url": "/assets/homepage/printqueen-hero-realistic-products.png",
            "overlay_opacity": 0.76
        }
    },
    {
        "id": "about_preview",
        "name": "About Preview",
        "enabled": True,
        "order": 7,
        "content": {
            "badge_label": "",
            "headline": "About Print Queen 3D",
            "description": "Print Queen 3D is a small business built on creativity, precision, and the love of bringing ideas to life. As a small business owner, I take pride in creating custom 3D-printed products that feel personal, polished, and made just for you.\n\nFrom personalized gifts and keepsakes to NFC products, business branding, home décor, lithophanes, keychains, pendants, and one-of-a-kind designs, every piece is professionally 3D printed with care, precision, and expert finishing. Whether you have a finished design, a photo, a logo, or just an idea, I’ll work with you to help turn your vision into something real.",
            "button_text": "Learn More",
            "button_link": "/about",
            "image_url": "",
            "mobile_image_url": "",
            "image_alt": "Print Queen 3D custom creations",
            "image_position": "center",
            "text_size": "lg",
            "button_size": "default",
            "section_padding_y": 64,
            "background_color": "#ffffff"
        }
    },
    {
        "id": "reviews",
        "name": "Customer Reviews",
        "enabled": True,
        "order": 8,
        "content": {
            "headline": "What Customers Are Saying",
            "subheadline": "Real custom creations deserve real reactions.",
            "reviews": []
        }
    },
    {
        "id": "social_gallery",
        "name": "Instagram / Social Gallery",
        "enabled": True,
        "order": 9,
        "content": {
            "headline": "Follow Our Latest Creations",
            "description": "See new custom orders, behind-the-scenes printing, and product drops.",
            "button_text": "@printqueen3d",
            "button_link": "https://instagram.com/printqueen3d",
            "gallery_images": []
        }
    },
    {
        "id": "personalize_page",
        "name": "Personalize Page",
        "enabled": True,
        "order": 20,
        "content": {
            "badge_label": "Personalize",
            "headline": "Made Just for You",
            "subheadline": "Browse personalized favorites, keepsakes, décor, charms, fidgets, and celebration pieces.",
            "button_text": "Start Custom Order",
            "button_link": "/design-your-own"
        }
    },
    {
        "id": "design_page",
        "name": "Design Your Own Page",
        "enabled": True,
        "order": 21,
        "content": {
            "badge_label": "Design Your Own",
            "headline": "Design Your Own Custom 3D Print",
            "description": "Tell us what you want to create and we'll review your details, timeline, materials, and next steps.",
            "button_text": "Get My Custom Quote"
        }
    },
    {
        "id": "about_page",
        "name": "About Page",
        "enabled": True,
        "order": 22,
        "content": {
            "badge_label": "",
            "headline": "Turning Your Vision Into Reality",
            "description": "At Print Queen 3D, we believe every great idea deserves to become something real. From personalized gifts and business branding to custom home décor, event keepsakes, NFC products, and one-of-a-kind creations, we specialize in designing and professionally 3D printing high-quality products made specifically for you.\n\nEvery order is crafted with precision, quality PLA and PETG materials when appropriate, and expert finishing to ensure it not only looks incredible but is built to last. Whether you’re celebrating a milestone, growing your business, creating memorable event favors, or bringing a completely original idea to life, we’re committed to delivering products that are as unique as the people who order them.\n\nBased in Los Angeles, California, Print Queen 3D proudly serves customers nationwide with fast turnaround times, exceptional craftsmanship, and personalized service from concept to completion. We don’t just print products—we create meaningful pieces that tell stories, strengthen brands, celebrate life’s biggest moments, and leave lasting impressions.\n\nIf you can imagine it, we can print it."
        }
    },
    {
        "id": "contact_page",
        "name": "Contact Page",
        "enabled": True,
        "order": 23,
        "content": {
            "badge_label": "Contact",
            "headline": "Contact Print Queen 3D",
            "description": "Send a message, ask about a custom project, or start a partnership conversation.",
            "button_text": "Send Message"
        }
    },
    {
        "id": "corporate_bulk_page",
        "name": "Corporate & Bulk Orders Page",
        "enabled": True,
        "order": 24,
        "content": {
            "badge_label": "Corporate & Bulk",
            "headline": "Corporate & Bulk Orders",
            "description": "Need custom 3D-printed products for your business, event, organization, school, or brand? Print Queen 3D creates professionally 3D printed bulk orders, branded pieces, event favors, NFC products, signage, keepsakes, and made-to-order custom items with precision and expert finishing.",
            "button_text": "Start a Bulk Order",
            "button_link": "/design-your-own"
        }
    },
    {
        "id": "refund_policy_page",
        "name": "Refund Policy Page",
        "enabled": True,
        "order": 25,
        "content": {
            "badge_label": "Policies",
            "headline": "Refund Policy",
            "description": "At Print Queen 3D, every product is made with care and many of our items are custom-made specifically for each customer. Because of the personalized nature of our products, all personalized, custom-made, and made-to-order products are final sale.\n\nOnce production has begun, orders cannot be canceled, refunded, or exchanged. Please carefully review all names, dates, colors, sizes, spellings, logos, photos, and customization details before submitting your order. Print Queen 3D is not responsible for customer-submitted errors that are approved prior to production.\n\nNon-custom products may be eligible for return on a case-by-case basis within 14 days of delivery if they are unused, in their original condition, and in their original packaging. Approved returns may be subject to a 15% restocking fee. Customers are responsible for all return shipping costs unless the return is due to our error.\n\nPlease inspect your order immediately upon arrival. If your order arrives damaged, defective, or incorrect, contact us within 24 hours of delivery by emailing printqueen3d@gmail.com. Include your order number, a description of the issue, clear photos of the product, and photos of the packaging if shipping damage occurred.\n\nWe will review each claim and, if approved, repair, replace, or remake the item at no additional cost. Claims submitted after 24 hours may not qualify for replacement or repair.\n\nCarrier delivery estimates are not guaranteed. Print Queen 3D is not responsible for delays caused by USPS, UPS, FedEx, weather conditions, holidays, customs, or other carrier-related issues.\n\nRequests to modify an order must be made before production begins. Once production starts, customization changes cannot be guaranteed and additional charges may apply.\n\nQuestions regarding refunds or returns may be sent to printqueen3d@gmail.com or (310) 936-1893."
        }
    },
    {
        "id": "product_care_page",
        "name": "Product Care Page",
        "enabled": True,
        "order": 26,
        "content": {
            "badge_label": "Policies",
            "headline": "Product Care",
            "description": "Thank you for choosing Print Queen 3D. Each item is expertly designed and 3D printed with care. Proper care will help ensure your product remains beautiful for years to come.\n\nGeneral Care:\nHandle products with care. Avoid dropping or exposing items to excessive force. Store in a cool, dry location. Keep away from prolonged direct sunlight and excessive heat. Clean using a soft microfiber cloth. For stubborn dirt, wipe gently with a damp cloth and mild soap. Do not use abrasive cleaners, acetone, bleach, alcohol, or harsh chemicals.\n\nPersonalized Products:\nCustomized products are created specifically for you. Avoid scratching engraved or printed surfaces and keep personalized items away from excessive moisture unless otherwise noted.\n\nNFC Products:\nDo not bend or puncture NFC-enabled products. Avoid prolonged exposure to high temperatures, magnets, or excessive moisture. Clean gently with a soft cloth.\n\nLithophane Night Lights:\nIndoor use only. Keep away from water and excessive humidity. Use only the recommended light source included with your product. Do not place near open flames or excessive heat.\n\nKeychains & Charms:\nAvoid placing heavy weight or excessive pressure on acrylic or printed keychains. Metal hardware may naturally wear over time depending on usage.\n\nHome Décor:\nDecorative items, including vases, nameplates, wall décor, incense holders, and lithophane lamps, are intended for display. Do not use products for purposes other than their intended design.\n\nProduct Variations:\nDue to the custom 3D printing process, slight variations in color, texture, finish, or layer appearance may occur. These variations are a normal part of 3D printing and make each item unique."
        }
    },
    {
        "id": "privacy_policy_page",
        "name": "Privacy Policy Page",
        "enabled": True,
        "order": 27,
        "content": {
            "badge_label": "Policies",
            "headline": "Privacy Policy",
            "description": "Print Queen 3D respects your privacy and is committed to protecting your personal information.\n\nWhen you place an order, submit a custom inquiry, or use our website, we may collect your name, email address, phone number, shipping and billing address, payment information processed securely by our payment providers, uploaded photos, logos, artwork, files, form messages, device information, browser information, and website usage analytics.\n\nWe use this information to process orders, manufacture custom products, communicate about your order, provide customer support, improve our website, prevent fraud, comply with legal obligations, and send marketing messages if you choose to subscribe.\n\nPrint Queen 3D does not store complete credit card information. Payments are processed securely by trusted third-party payment providers.\n\nIf you upload or submit logos, photographs, artwork, or designs, you confirm that you have the legal right to use those materials. You retain ownership of your intellectual property.\n\nIf you subscribe to our mailing list, we may send updates, promotions, and new product announcements. You may unsubscribe at any time.\n\nOur website may use cookies and similar technologies to improve your browsing experience and analyze website traffic. You may disable cookies through your browser settings, although some website features may not function properly.\n\nWe use commercially reasonable safeguards to protect your information. While no system can guarantee absolute security, we work to protect your data from unauthorized access.\n\nYou may request to access, correct, or delete eligible personal information, or opt out of marketing communications by emailing printqueen3d@gmail.com.\n\nQuestions regarding this Privacy Policy may be directed to:\nPrint Queen 3D\nEmail: printqueen3d@gmail.com\nPhone: (310) 936-1893"
        }
    },
    {
        "id": "terms_of_service_page",
        "name": "Terms of Service Page",
        "enabled": True,
        "order": 28,
        "content": {
            "badge_label": "Policies",
            "headline": "Terms of Service",
            "description": "Welcome to Print Queen 3D. By accessing our website, placing an order, submitting a custom request, or using our services, you agree to these Terms of Service.\n\nPrint Queen 3D provides custom 3D printed products, personalized gifts, NFC products, business branding items, home décor, lithophane night lights, fidgets, event items, and related custom design services. Our website and services are intended for customers in the United States only.\n\nAll product descriptions, pricing, availability, and processing timelines are subject to change at any time without notice. We reserve the right to refuse service, cancel orders, or limit quantities at our discretion.\n\nBecause many of our products are custom-made, customers are responsible for carefully reviewing all order details before submitting payment. This includes names, spelling, dates, colors, photos, logos, sizes, quantities, personalization details, and any approved design proofs.\n\nOnce production has begun, custom orders cannot be canceled, refunded, or exchanged. Personalized and made-to-order items are final sale unless they arrive damaged, defective, or incorrect due to our error.\n\nProduction typically takes 3-5 days after design approval, depending on product type, project complexity, material availability, and order volume. Rush production may be available for an additional fee. Production timelines do not include carrier shipping time, weekends, or holidays unless otherwise stated.\n\nCustomers who submit photos, artwork, logos, business names, slogans, or other design materials confirm that they have the legal right to use those materials. Print Queen 3D is not responsible for claims arising from customer-submitted content.\n\nAll website content, product images, product designs, logos, text, graphics, and branding created by Print Queen 3D are protected intellectual property and may not be copied, reproduced, sold, or used without written permission.\n\nShipping estimates are not guaranteed. Print Queen 3D is not responsible for delays caused by shipping carriers, weather, holidays, incorrect addresses, or events outside our control.\n\nLocal pickup may be available in Los Angeles, California. Pickup details will be provided when applicable.\n\nCustomers must inspect items upon delivery and report any damaged, defective, or incorrect items within 24 hours by emailing printqueen3d@gmail.com with photos and order details.\n\nPrint Queen 3D is not responsible for damage caused after delivery, including drops, misuse, exposure to heat, improper cleaning, water damage, or normal wear and tear.\n\nTo the fullest extent permitted by law, Print Queen 3D is not liable for indirect, incidental, special, or consequential damages arising from use of our website, products, or services.\n\nWe may update these Terms of Service at any time. Continued use of our website after changes are posted means you accept the updated terms.\n\nFor questions, contact:\nPrint Queen 3D\nEmail: printqueen3d@gmail.com\nPhone: (310) 936-1893"
        }
    },
    {
        "id": "shipping_policy_page",
        "name": "Shipping Policy Page",
        "enabled": True,
        "order": 29,
        "content": {
            "badge_label": "Policies",
            "headline": "Shipping Policy",
            "description": "Print Queen 3D currently serves customers in the United States only.\n\nProduction typically takes 3-5 days after design approval, depending on product type, project complexity, material availability, and order volume. Production timelines do not include carrier shipping time, weekends, or holidays unless otherwise stated.\n\nShipping estimates are not guaranteed. Print Queen 3D is not responsible for delays caused by USPS, UPS, FedEx, weather, holidays, incorrect addresses, or events outside our control.\n\nCustomers are responsible for entering a complete and accurate shipping address at checkout. If an order is returned due to an incorrect or incomplete address, additional shipping fees may apply.\n\nLocal pickup may be available in Los Angeles, California. Pickup details will be provided when applicable.\n\nFor shipping questions, contact:\nPrint Queen 3D\nEmail: printqueen3d@gmail.com\nPhone: (310) 936-1893"
        }
    },
    {
        "id": "materials_page",
        "name": "Materials & 3D Printing Page",
        "enabled": True,
        "order": 30,
        "content": {
            "badge_label": "3D Printed",
            "headline": "Materials & 3D Printing",
            "description": "All Print Queen 3D items are professionally designed and 3D printed with care. Each item is made to order or finished by hand depending on the product, personalization, and requested details.\n\nCommon materials include PLA filament, PETG filament, and resin when needed. A resin overlay may be requested as a $5 add-on where available. Acrylic is only available for custom creations when the project allows it.\n\nBecause 3D printing is a custom manufacturing process, slight variations in texture, color, layer lines, finish, or small details may occur. These natural variations are part of the 3D printing process and help make each piece unique.\n\nIf you need a specific material, finish, color, strength, resin overlay, or acrylic detail for a custom print, include that request when submitting your custom order or personalization details."
        }
    }
]

OBSOLETE_HOMEPAGE_SECTION_IDS = {"custom_projects", "newsletter"}

def merge_default_sections(sections: List[Dict]) -> List[Dict]:
    default_by_id = {section["id"]: section for section in DEFAULT_SECTIONS}
    merged_sections = []
    seen_ids = set()
    for section in sections:
        section_id = section.get("id")
        if section_id in OBSOLETE_HOMEPAGE_SECTION_IDS or section_id in seen_ids:
            continue
        seen_ids.add(section_id)
        merged_sections.append(section)
    for section in merged_sections:
        default_section = default_by_id.get(section.get("id"))
        if default_section:
            section_content = section.get("content") or {}
            default_content = default_section.get("content") or {}
            for key, value in default_content.items():
                if key not in section_content or section_content[key] is None:
                    section_content[key] = value
            section["content"] = section_content
    existing_ids = {section.get("id") for section in merged_sections}
    for default_section in DEFAULT_SECTIONS:
        if default_section["id"] not in existing_ids:
            merged_sections.append(default_section)
    return sorted(merged_sections, key=lambda section: section.get("order", 999))

@api_router.get("/site-config")
async def get_public_site_config(response: Response):
    """Get public site configuration (no auth required)"""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    # Get site settings
    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        settings = SiteSettings().model_dump()
        settings['updated_at'] = settings['updated_at'].isoformat()
    settings["navigation_items"] = merge_default_navigation_items(settings.get("navigation_items", []))
    
    # Get homepage sections
    sections_config = await db.homepage_sections.find_one({"id": "homepage_sections"}, {"_id": 0})
    if not sections_config:
        sections_config = {
            "id": "homepage_sections",
            "sections": DEFAULT_SECTIONS,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    else:
        sections_config["sections"] = merge_default_sections(sections_config.get("sections", []))

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
        settings_dict = default_settings.model_dump()
        settings_dict["navigation_items"] = default_navigation_items()
        return settings_dict
    settings["navigation_items"] = merge_default_navigation_items(settings.get("navigation_items", []))
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
async def get_homepage_sections(response: Response, user: User = Depends(require_admin)):
    """Get homepage sections configuration (admin only)"""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    sections_config = await db.homepage_sections.find_one({"id": "homepage_sections"}, {"_id": 0})
    if not sections_config:
        # Return default sections
        return {
            "id": "homepage_sections",
            "sections": DEFAULT_SECTIONS,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    sections_config["sections"] = merge_default_sections(sections_config.get("sections", []))
    return sections_config

@api_router.put("/admin/homepage-sections")
async def update_homepage_sections(sections_update: HomepageSectionsUpdate, user: User = Depends(require_admin)):
    """Update homepage sections configuration (admin only)"""
    merged_sections = merge_default_sections([section.model_dump() for section in sections_update.sections])
    update_data = {
        "id": "homepage_sections",
        "sections": merged_sections,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.homepage_sections.update_one(
        {"id": "homepage_sections"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Homepage sections updated successfully", "sections": merged_sections}

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
        "free_shipping_threshold": settings.get("free_shipping_threshold", 150.0),
        "flat_shipping_rate": settings.get("flat_shipping_rate", 12.95)
    }

# ============ SHIPPING SETTINGS ROUTES ============

@api_router.get("/admin/shipping-settings")
async def get_shipping_settings(user: User = Depends(require_admin)):
    """Get shipping configuration (admin only)"""
    settings = await db.shipping_settings.find_one({"id": "shipping_settings"}, {"_id": 0})
    if not settings:
        # Return default settings with standard shipping option
        default_settings = ShippingSettings(
            shipping_options=[
                ShippingOption(
                    name="Standard Shipping",
                    description="5-7 business days",
                    price=12.95,
                    estimated_days_min=5,
                    estimated_days_max=7,
                    enabled=True,
                    order=0
                ).model_dump()
            ]
        )
        return default_settings.model_dump()
    return settings

@api_router.put("/admin/shipping-settings")
async def update_shipping_settings(settings_update: ShippingSettingsUpdate, user: User = Depends(require_admin)):
    """Update shipping configuration (admin only)"""
    update_data = {k: v for k, v in settings_update.model_dump().items() if v is not None}
    update_data["id"] = "shipping_settings"
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Convert nested models to dicts
    if "shipping_options" in update_data:
        update_data["shipping_options"] = [
            opt.model_dump() if hasattr(opt, 'model_dump') else opt 
            for opt in update_data["shipping_options"]
        ]
    
    await db.shipping_settings.update_one(
        {"id": "shipping_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Shipping settings updated successfully"}

@api_router.get("/shipping-settings")
async def get_public_shipping_settings():
    """Get shipping settings for checkout (public)"""
    settings = await db.shipping_settings.find_one({"id": "shipping_settings"}, {"_id": 0})
    
    if not settings:
        # Return defaults
        return {
            "shipping_options": [
                {
                    "id": "standard",
                    "name": "Standard Shipping",
                    "description": "5-7 business days",
                    "price": 12.95,
                    "estimated_days_min": 5,
                    "estimated_days_max": 7
                }
            ],
            "free_shipping_enabled": True,
            "free_shipping_threshold": 150.0,
            "rush_order_enabled": True,
            "rush_order_price": 25.0,
            "rush_order_days_min": 1,
            "rush_order_days_max": 3,
            "rush_order_label": "Rush Order",
            "rush_order_description": "Expedite your order for faster processing",
            "fulfillment_heading": "How would you like to receive your order?",
            "shipping_card_title": "Ship to Me",
            "shipping_unavailable_text": "Not available for these items",
            "pickup_card_title": "Local Pickup",
            "pickup_price_label": "FREE",
            "pickup_unavailable_text": "Not available",
            "pickup_location_heading": "Select Pickup Location",
            "pickup_datetime_heading": "Select Pickup Date & Time",
            "pickup_details_heading": "Pickup Details",
            "pickup_confirmation_note": "Local pickup is available in Los Angeles, California. Once your order is complete and ready for pickup, you will receive an email notification with pickup instructions."
        }
    
    # Filter to only enabled shipping options
    enabled_options = [opt for opt in settings.get("shipping_options", []) if opt.get("enabled", True)]
    
    return {
        "shipping_options": enabled_options,
        "free_shipping_enabled": settings.get("free_shipping_enabled", True),
        "free_shipping_threshold": settings.get("free_shipping_threshold", 150.0),
        "rush_order_enabled": settings.get("rush_order_enabled", True),
        "rush_order_price": settings.get("rush_order_price", 25.0),
        "rush_order_days_min": settings.get("rush_order_days_min", 1),
        "rush_order_days_max": settings.get("rush_order_days_max", 3),
        "rush_order_label": settings.get("rush_order_label", "Rush Order"),
        "rush_order_description": settings.get("rush_order_description", "Expedite your order for faster processing"),
        "fulfillment_heading": settings.get("fulfillment_heading", "How would you like to receive your order?"),
        "shipping_card_title": settings.get("shipping_card_title", "Ship to Me"),
        "shipping_unavailable_text": settings.get("shipping_unavailable_text", "Not available for these items"),
        "pickup_card_title": settings.get("pickup_card_title", "Local Pickup"),
        "pickup_price_label": settings.get("pickup_price_label", "FREE"),
        "pickup_unavailable_text": settings.get("pickup_unavailable_text", "Not available"),
        "pickup_location_heading": settings.get("pickup_location_heading", "Select Pickup Location"),
        "pickup_datetime_heading": settings.get("pickup_datetime_heading", "Select Pickup Date & Time"),
        "pickup_details_heading": settings.get("pickup_details_heading", "Pickup Details"),
        "pickup_confirmation_note": settings.get("pickup_confirmation_note", "Local pickup is available in Los Angeles, California. Once your order is complete and ready for pickup, you will receive an email notification with pickup instructions.")
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
        "ready_for_pickup": ("Ready for Pickup", "Great news! Your order is ready for pickup", "#10b981"),
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
    if new_status == "ready_for_pickup" and order.get("pickup_details"):
        pickup = order["pickup_details"]
        tracking_info = f"""
        <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin-top: 20px;">
            <h3 style="margin: 0 0 8px 0; color: #059669;">Pickup Location</h3>
            <p style="margin: 0; color: #047857;"><strong>{pickup.get('location_name', '')}</strong></p>
            <p style="margin: 4px 0 0 0; color: #047857;">{pickup.get('location_address', '')}</p>
            <p style="margin: 8px 0 0 0; color: #047857;"><strong>Pickup date:</strong> {pickup.get('pickup_date', '')} at {pickup.get('pickup_time', '')}</p>
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

# ============ CUSTOM BUILDER ROUTES ============

@api_router.get("/admin/custom-builders")
async def get_custom_builders(user: User = Depends(require_admin)):
    """Get all custom builders (admin only)"""
    builders = await db.custom_builders.find({}, {"_id": 0}).to_list(100)
    # Sort by name
    builders.sort(key=lambda x: x.get("name", ""))
    return builders

@api_router.get("/admin/custom-builders/{builder_id}")
async def get_custom_builder(builder_id: str, user: User = Depends(require_admin)):
    """Get single custom builder (admin only)"""
    builder = await db.custom_builders.find_one({"id": builder_id}, {"_id": 0})
    if not builder:
        raise HTTPException(status_code=404, detail="Custom builder not found")
    return builder

@api_router.post("/admin/custom-builders")
async def create_custom_builder(builder: CustomBuilderCreate, user: User = Depends(require_admin)):
    """Create a new custom builder"""
    # Check if slug already exists
    existing = await db.custom_builders.find_one({"slug": builder.slug})
    if existing:
        raise HTTPException(status_code=400, detail="A builder with this slug already exists")
    
    # Create builder document
    builder_doc = CustomBuilder(
        name=builder.name,
        slug=builder.slug,
        description=builder.description,
        fields=[field.model_dump() for field in builder.fields],
        base_options=[opt.model_dump() for opt in builder.base_options],
        base_option_label=builder.base_option_label,
        show_base_options=builder.show_base_options,
        accent_color=builder.accent_color,
        enabled=builder.enabled,
        show_price_calculator=builder.show_price_calculator,
        submit_button_text=builder.submit_button_text,
        success_message=builder.success_message
    )
    
    builder_dict = builder_doc.model_dump()
    builder_dict['created_at'] = builder_dict['created_at'].isoformat()
    builder_dict['updated_at'] = builder_dict['updated_at'].isoformat()
    
    await db.custom_builders.insert_one(builder_dict)
    
    return {"message": "Custom builder created successfully", "id": builder_doc.id}

@api_router.put("/admin/custom-builders/{builder_id}")
async def update_custom_builder(builder_id: str, builder_update: CustomBuilderUpdate, user: User = Depends(require_admin)):
    """Update a custom builder"""
    existing = await db.custom_builders.find_one({"id": builder_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Custom builder not found")
    
    # Check slug uniqueness if being updated
    if builder_update.slug and builder_update.slug != existing.get("slug"):
        slug_exists = await db.custom_builders.find_one({"slug": builder_update.slug, "id": {"$ne": builder_id}})
        if slug_exists:
            raise HTTPException(status_code=400, detail="A builder with this slug already exists")
    
    update_data = {k: v for k, v in builder_update.model_dump().items() if v is not None}
    
    # Convert nested models to dicts
    if "fields" in update_data:
        update_data["fields"] = [f.model_dump() if hasattr(f, 'model_dump') else f for f in update_data["fields"]]
    if "base_options" in update_data:
        update_data["base_options"] = [o.model_dump() if hasattr(o, 'model_dump') else o for o in update_data["base_options"]]
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.custom_builders.update_one(
        {"id": builder_id},
        {"$set": update_data}
    )
    
    return {"message": "Custom builder updated successfully"}

@api_router.delete("/admin/custom-builders/{builder_id}")
async def delete_custom_builder(builder_id: str, user: User = Depends(require_admin)):
    """Delete a custom builder"""
    result = await db.custom_builders.delete_one({"id": builder_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Custom builder not found")
    
    # Optionally: Remove builder reference from products
    await db.products.update_many(
        {"custom_builder": builder_id},
        {"$set": {"custom_builder": None}}
    )
    
    return {"message": "Custom builder deleted successfully"}

@api_router.get("/custom-builders/{slug}")
async def get_public_custom_builder(slug: str):
    """Get custom builder by slug (public - for rendering on product pages)"""
    builder = await db.custom_builders.find_one({"slug": slug, "enabled": True}, {"_id": 0})
    if not builder:
        raise HTTPException(status_code=404, detail="Custom builder not found")
    return builder

@api_router.get("/custom-builders")
async def list_public_custom_builders():
    """List all enabled custom builders (public)"""
    builders = await db.custom_builders.find({"enabled": True}, {"_id": 0, "id": 1, "name": 1, "slug": 1, "description": 1}).to_list(100)
    return builders

# Seed the NFC Stand Builder if it doesn't exist
async def seed_nfc_builder():
    """Seed the default NFC Stand Builder"""
    existing = await db.custom_builders.find_one({"slug": "nfc-stand-builder"})
    if existing:
        return
    
    nfc_builder = {
        "id": str(uuid.uuid4()),
        "name": "NFC Stand Builder",
        "slug": "nfc-stand-builder",
        "description": "Customize your NFC payment stand with colors, logo, and links",
        "fields": [
            {
                "id": str(uuid.uuid4()),
                "type": "color_dual",
                "label": "Choose Your Colors",
                "name": "colors",
                "description": "Select primary and secondary colors for your stand",
                "required": True,
                "order": 1,
                "options": [],
                "color_options": [
                    "#FF0000", "#FF4500", "#FF6347", "#FF7F50", "#FFA500",
                    "#FFD700", "#FFFF00", "#ADFF2F", "#7FFF00", "#00FF00",
                    "#00FA9A", "#00FFFF", "#00CED1", "#1E90FF", "#0000FF",
                    "#8A2BE2", "#9400D3", "#FF00FF", "#FF1493", "#FF69B4",
                    "#FFC0CB", "#FFFFFF", "#C0C0C0", "#808080", "#000000",
                    "#8B4513", "#D2691E", "#F4A460", "#DEB887", "#F5F5DC",
                    "#FFE4C4", "#FFDAB9"
                ],
                "allow_custom_color": True
            },
            {
                "id": str(uuid.uuid4()),
                "type": "image",
                "label": "Upload Your Logo",
                "name": "logo",
                "description": "Upload your business logo (PNG, JPG, or SVG)",
                "required": True,
                "order": 2,
                "options": []
            },
            {
                "id": str(uuid.uuid4()),
                "type": "icon_select",
                "label": "NFC Link Icons",
                "name": "nfc_icons",
                "description": "Choose icons for each NFC chip",
                "required": True,
                "order": 3,
                "options": [
                    {"id": "ig", "label": "Instagram", "value": "instagram"},
                    {"id": "fb", "label": "Facebook", "value": "facebook"},
                    {"id": "tw", "label": "Twitter/X", "value": "twitter"},
                    {"id": "tt", "label": "TikTok", "value": "tiktok"},
                    {"id": "li", "label": "LinkedIn", "value": "linkedin"},
                    {"id": "yt", "label": "YouTube", "value": "youtube"},
                    {"id": "ws", "label": "Website", "value": "website"},
                    {"id": "em", "label": "Email", "value": "email"},
                    {"id": "ph", "label": "Phone", "value": "phone"},
                    {"id": "wa", "label": "WhatsApp", "value": "whatsapp"},
                    {"id": "vm", "label": "Venmo", "value": "venmo"},
                    {"id": "ca", "label": "Cash App", "value": "cashapp"},
                    {"id": "pp", "label": "PayPal", "value": "paypal"},
                    {"id": "ap", "label": "Apple Pay", "value": "applepay"},
                    {"id": "gp", "label": "Google Pay", "value": "googlepay"},
                    {"id": "zl", "label": "Zelle", "value": "zelle"},
                    {"id": "mn", "label": "Menu", "value": "menu"},
                    {"id": "rv", "label": "Reviews", "value": "reviews"},
                    {"id": "cu", "label": "Custom", "value": "custom"}
                ]
            },
            {
                "id": str(uuid.uuid4()),
                "type": "text",
                "label": "NFC Links",
                "name": "nfc_links",
                "placeholder": "Enter URL for each NFC chip",
                "description": "Enter the URL each NFC chip should link to",
                "required": True,
                "order": 4,
                "options": []
            }
        ],
        "base_options": [
            {"id": "2nfc", "label": "2 NFC Chips", "value": "2nfc", "price_adjustment": 45.00, "description": "Perfect for dual functionality"},
            {"id": "3nfc", "label": "3 NFC Chips", "value": "3nfc", "price_adjustment": 55.00, "description": "Maximum versatility"},
            {"id": "2nfc-card", "label": "2 NFC + Business Card Holder", "value": "2nfc-card", "price_adjustment": 60.00, "description": "Professional networking solution"},
            {"id": "2nfc-square", "label": "2 NFC + Square Reader", "value": "2nfc-square", "price_adjustment": 65.00, "description": "Accept payments on the go"},
            {"id": "3nfc-card", "label": "3 NFC + Business Card Holder", "value": "3nfc-card", "price_adjustment": 70.00, "description": "Complete business solution"},
            {"id": "3nfc-square", "label": "3 NFC + Square Reader", "value": "3nfc-square", "price_adjustment": 75.00, "description": "Complete payment solution"}
        ],
        "base_option_label": "Select Your Base",
        "show_base_options": True,
        "accent_color": "#3B82F6",
        "enabled": True,
        "show_price_calculator": True,
        "submit_button_text": "Add to Cart",
        "success_message": "Your custom NFC stand has been added to cart!",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.custom_builders.insert_one(nfc_builder)
    logging.info("Seeded NFC Stand Builder")

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
        if len(logo_contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Logo must be 5MB or smaller")
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
        
    except HTTPException:
        raise
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

def is_los_angeles_pickup_location(location: Dict) -> bool:
    city = (location.get("city") or "").strip().lower()
    name = (location.get("name") or "").strip().lower()
    address = (location.get("address") or "").strip().lower()
    return city == "los angeles" or "los angeles" in name or "los angeles" in address

def filter_los_angeles_pickup_locations(locations: List[Dict]) -> List[Dict]:
    return [location for location in locations if is_los_angeles_pickup_location(location)]

@api_router.get("/admin/pickup-locations")
async def get_pickup_locations(user: User = Depends(require_admin)):
    """Get all pickup locations (admin only)"""
    locations = await db.pickup_locations.find({}, {"_id": 0}).to_list(100)
    locations = filter_los_angeles_pickup_locations(locations)
    
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
    locations = filter_los_angeles_pickup_locations(locations)
    
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
    if not location or not is_los_angeles_pickup_location(location):
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
    all_locations = filter_los_angeles_pickup_locations(all_locations)
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
    locations = filter_los_angeles_pickup_locations(locations)
    
    locations.sort(key=lambda x: x.get("order", 0))
    
    return {
        "locations": locations,
        "available_for_pickup": True,
        "pickup_only": product.get("pickup_only", False)
    }

# ============ DATABASE EXPORT/IMPORT ROUTES ============

import json
from fastapi.responses import Response

@api_router.get("/admin/export-database")
async def export_database(user: User = Depends(require_admin)):
    """Export all database collections to JSON (admin only)"""
    try:
        export_data = {
            "export_version": "1.0",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "collections": {}
        }
        
        # List of collections to export
        collections_to_export = [
            "users",
            "products",
            "categories",
            "product_collections",
            "orders",
            "site_settings",
            "stripe_settings",
            "email_settings",
            "shipping_settings",
            "pickup_locations",
            "custom_builders",
            "homepage_sections"
        ]
        
        for collection_name in collections_to_export:
            try:
                collection = db[collection_name]
                documents = await collection.find({}, {"_id": 0}).to_list(10000)
                export_data["collections"][collection_name] = documents
                logging.info(f"Exported {len(documents)} documents from {collection_name}")
            except Exception as e:
                logging.warning(f"Could not export {collection_name}: {str(e)}")
                export_data["collections"][collection_name] = []
        
        # Convert to JSON string
        json_str = json.dumps(export_data, indent=2, default=str)
        
        # Return as downloadable file
        return Response(
            content=json_str,
            media_type="application/json",
            headers={
                "Content-Disposition": "attachment; filename=printqueen3d_database_export.json"
            }
        )
    except Exception as e:
        logging.error(f"Database export error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

class ImportRequest(BaseModel):
    data: Dict
    overwrite: bool = False  # If true, clear existing data before import

@api_router.post("/admin/import-database")
async def import_database(import_request: ImportRequest, user: User = Depends(require_admin)):
    """Import database from JSON export (admin only)"""
    try:
        data = import_request.data
        overwrite = import_request.overwrite
        
        if "collections" not in data:
            raise HTTPException(status_code=400, detail="Invalid export format: missing 'collections' key")
        
        import_results = {}
        
        for collection_name, documents in data["collections"].items():
            # Older exports saved product collections under the wrong name
            if collection_name == "collections":
                collection_name = "product_collections"
            if not documents:
                import_results[collection_name] = {"status": "skipped", "count": 0, "reason": "empty"}
                continue
            
            try:
                collection = db[collection_name]
                
                # Special handling for users - don't overwrite existing admin
                if collection_name == "users":
                    for doc in documents:
                        # Check if user already exists
                        existing = await collection.find_one({"email": doc.get("email")})
                        if existing:
                            # Update existing user (but preserve their password if they have one)
                            if existing.get("hashed_password") and not doc.get("hashed_password"):
                                doc["hashed_password"] = existing["hashed_password"]
                            await collection.update_one(
                                {"email": doc.get("email")},
                                {"$set": doc}
                            )
                        else:
                            await collection.insert_one(doc)
                    import_results[collection_name] = {"status": "merged", "count": len(documents)}
                    continue
                
                # For settings collections (single document), use upsert
                if collection_name in ["site_settings", "stripe_settings", "email_settings", "shipping_settings"]:
                    for doc in documents:
                        doc_id = doc.get("id", collection_name)
                        await collection.update_one(
                            {"id": doc_id},
                            {"$set": doc},
                            upsert=True
                        )
                    import_results[collection_name] = {"status": "upserted", "count": len(documents)}
                    continue
                
                # For other collections
                if overwrite:
                    # Clear existing data
                    await collection.delete_many({})
                    
                # Insert documents (skip duplicates based on 'id' field)
                inserted = 0
                updated = 0
                for doc in documents:
                    doc_id = doc.get("id")
                    if doc_id:
                        existing = await collection.find_one({"id": doc_id})
                        if existing:
                            if overwrite:
                                await collection.update_one({"id": doc_id}, {"$set": doc})
                                updated += 1
                        else:
                            await collection.insert_one(doc)
                            inserted += 1
                    else:
                        await collection.insert_one(doc)
                        inserted += 1
                
                import_results[collection_name] = {
                    "status": "success", 
                    "inserted": inserted, 
                    "updated": updated
                }
                
            except Exception as e:
                logging.error(f"Error importing {collection_name}: {str(e)}")
                import_results[collection_name] = {"status": "error", "error": str(e)}
        
        return {
            "message": "Import completed",
            "results": import_results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Database import error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@api_router.get("/admin/export-database-info")
async def get_export_info(user: User = Depends(require_admin)):
    """Get info about what will be exported (admin only)"""
    try:
        collections_info = {}
        
        collections_to_check = [
            "users", "products", "categories", "product_collections", "orders",
            "site_settings", "stripe_settings", "email_settings", 
            "shipping_settings", "pickup_locations", "custom_builders",
            "homepage_sections"
        ]
        
        for collection_name in collections_to_check:
            try:
                count = await db[collection_name].count_documents({})
                collections_info[collection_name] = count
            except:
                collections_info[collection_name] = 0
        
        return {
            "collections": collections_info,
            "total_documents": sum(collections_info.values())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/maintenance/startup-tasks")
async def run_startup_tasks_from_admin(user: User = Depends(require_admin)):
    """Run one-time maintenance tasks manually instead of on every cold start."""
    started_at = datetime.now(timezone.utc)
    await run_startup_maintenance_tasks()
    completed_at = datetime.now(timezone.utc)
    return {
        "status": "completed",
        "started_at": started_at.isoformat(),
        "completed_at": completed_at.isoformat(),
        "duration_seconds": round((completed_at - started_at).total_seconds(), 3)
    }


# ============ SITEMAP ============

@api_router.get("/sitemap.xml")
async def sitemap():
    """Dynamic sitemap listing static pages, published products, and collections"""
    base = "https://www.printqueen3d.com"
    today = datetime.now(timezone.utc).date().isoformat()

    def sitemap_date(document):
        value = document.get("updated_at") or document.get("created_at")
        if isinstance(value, datetime):
            return value.date().isoformat()
        if isinstance(value, str) and value:
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00")).date().isoformat()
            except ValueError:
                return value[:10]
        return today

    def sitemap_url(loc, lastmod=None, changefreq="weekly", priority="0.7"):
        return (
            "<url>"
            f"<loc>{escape(loc, quote=True)}</loc>"
            f"<lastmod>{escape(lastmod or today, quote=True)}</lastmod>"
            f"<changefreq>{escape(changefreq, quote=True)}</changefreq>"
            f"<priority>{escape(priority, quote=True)}</priority>"
            "</url>"
        )

    static_paths = [
        "/", "/shop", "/design-your-own", "/personalize", "/about", "/contact",
        "/corporate-bulk-orders", "/materials", "/refund-policy", "/product-care",
        "/privacy-policy", "/terms-of-service", "/shipping-policy"
    ]
    xml_urls = [
        sitemap_url(
            f"{base}{path}",
            today,
            "daily" if path in ("/", "/shop") else "monthly",
            "1.0" if path == "/" else "0.8" if path in ("/shop", "/design-your-own") else "0.6"
        )
        for path in static_paths
    ]

    products = await db.products.find(
        {"published": True},
        {"_id": 0, "id": 1, "updated_at": 1, "created_at": 1}
    ).to_list(1000)
    xml_urls += [
        sitemap_url(f"{base}/products/{product['id']}", sitemap_date(product), "weekly", "0.8")
        for product in products
    ]

    collections = await db.product_collections.find(
        {},
        {"_id": 0, "id": 1, "name": 1, "updated_at": 1, "created_at": 1}
    ).to_list(1000)
    xml_urls += [
        sitemap_url(f"{base}/shop?collection={collection['id']}", sitemap_date(collection), "weekly", "0.8")
        for collection in collections
        if "design your own" not in (collection.get("name") or "").lower()
    ]

    xml_items = "".join(xml_urls)
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{xml_items}</urlset>'
    return Response(content=xml, media_type="application/xml")


def get_allowed_origins():
    configured_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000')
    default_origins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://printqueen3d.com',
        'https://www.printqueen3d.com',
    ]
    origins = [origin.strip() for origin in configured_origins.split(',') if origin.strip()]
    return sorted(set(origins + default_origins))


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=get_allowed_origins(),
    allow_origin_regex=r"https://printqueen3d2026-(frontend|backend)-[a-z0-9]+-nandis-projects-cc28225b\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def migrate_content_overrides_20260707():
    """One-time migration: persist the content visitors currently see into the
    database, so the silent override layers (backend wording rewriter + frontend
    hero/featured ladders) can be removed without changing the live site.

    Self-guarded via a flag doc; never re-runs after the first successful pass.
    """
    if await db.migrations.find_one({"id": "content_overrides_20260707"}):
        return

    sections_config = await db.homepage_sections.find_one({"id": "homepage_sections"}, {"_id": 0})
    if sections_config:
        sections = merge_default_sections(sections_config.get("sections", []))
        for section in sections:
            content = refresh_3d_printing_wording(section.get("content") or {})
            section_id = section.get("id")
            if section_id == "hero":
                if not content.get("headline") or content.get("headline") in (
                    "Custom 3D Printed Creations", "Custom 3D Creations Made Just for You"
                ):
                    content["headline"] = "Create Something Uniquely Yours"
                subheadline = content.get("subheadline") or ""
                if not subheadline or subheadline == "Bringing Your Ideas to Life" or "premium materials" in subheadline.lower():
                    content["subheadline"] = (
                        "Professionally 3D printed custom creations for personalized gifts, "
                        "business branding, NFC products, home decor, keepsakes, and one-of-a-kind designs."
                    )
                if not content.get("button_text") or content.get("button_text") == "Shop Now":
                    content["button_text"] = "Start Custom Order"
                if not content.get("button_link") or content.get("button_link") in ("/products", "#design-your-own"):
                    content["button_link"] = "/design-your-own"
            elif section_id == "featured":
                if content.get("headline") == "Featured Products":
                    content["headline"] = "Best Sellers"
                if content.get("subheadline") == "Our most popular items":
                    content["subheadline"] = "Customer favorites made to personalize, gift, and use every day."
            section["content"] = content
        await db.homepage_sections.update_one(
            {"id": "homepage_sections"},
            {"$set": {"sections": sections}}
        )

    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if settings:
        rewritten = refresh_3d_printing_wording({key: value for key, value in settings.items() if key != "id"})
        if rewritten:
            await db.site_settings.update_one({"id": "site_settings"}, {"$set": rewritten})

    await db.migrations.insert_one({
        "id": "content_overrides_20260707",
        "applied_at": datetime.now(timezone.utc).isoformat()
    })
    logging.info("Applied content override migration: content_overrides_20260707")

async def migrate_nfc_backpack_customization_fields_20260708():
    """One-time Backpack field migration.

    After this runs, the product editor remains the source of truth. Do not
    repeatedly seed these fields or admin product edits will be overwritten.
    """
    migration_id = "nfc_backpack_customization_fields_20260708"
    if await db.migrations.find_one({"id": migration_id}):
        return

    backpack_payload = next(
        (
            product
            for product in nfc_keychain_product_payloads()
            if product.get("id") == "nfc-keychain-emergency-contact"
        ),
        None
    )
    if backpack_payload:
        await db.products.update_one(
            {"id": "nfc-keychain-emergency-contact"},
            {
                "$set": {
                    "customization_fields": backpack_payload.get("customization_fields", []),
                    "product_page_section_title": backpack_payload.get("product_page_section_title", ""),
                    "product_page_section_text": backpack_payload.get("product_page_section_text", ""),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )

    await db.migrations.insert_one({
        "id": migration_id,
        "applied_at": datetime.now(timezone.utc).isoformat()
    })
    logging.info("Applied one-time NFC Backpack customization migration: %s", migration_id)

async def ensure_indexes():
    """Create indexes for the fields we filter on. Idempotent — Mongo no-ops
    existing indexes, so this is safe to run from explicit maintenance.
    Plain (non-unique) indexes only, so duplicate data can never crash startup.
    """
    await db.users.create_index("email")
    await db.users.create_index("id")
    await db.user_sessions.create_index("session_token")
    await db.products.create_index("id")
    await db.products.create_index("published")
    await db.products.create_index("collection_ids")
    await db.orders.create_index("user_id")
    await db.orders.create_index("id")
    await db.payment_transactions.create_index("session_id")
    await db.product_collections.create_index("id")
    await db.pickup_locations.create_index("id")

_startup_maintenance_lock = asyncio.Lock()

async def run_startup_maintenance_tasks():
    """Run setup work explicitly instead of blocking every serverless wake-up."""
    async with _startup_maintenance_lock:
        await ensure_indexes()
        await seed_admin_user()
        await seed_email_settings()
        await seed_stripe_settings()
        await seed_nfc_builder()
        await migrate_content_overrides_20260707()
        await migrate_nfc_backpack_customization_fields_20260708()

@app.on_event("startup")
async def startup_event():
    """Keep serverless cold starts fast for customer traffic."""
    if env_flag("RUN_STARTUP_MAINTENANCE_ON_BOOT", False):
        await run_startup_maintenance_tasks()
    else:
        logging.info(
            "Skipping startup maintenance on boot; run /api/admin/maintenance/startup-tasks "
            "or set RUN_STARTUP_MAINTENANCE_ON_BOOT=true for one deploy if needed."
        )

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
