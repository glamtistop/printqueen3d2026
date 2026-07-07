# PLAN: Server-Side Checkout Price Verification

**Rank: 1 of 5 — do this first.** Real-money risk: the server currently charges whatever total the browser sends.

## Goal

`POST /api/orders` and `POST /api/checkout/session` in `backend/server.py` must verify prices against the database before Stripe is charged. A tampered request (e.g., `total: 0.50` for a $59.98 cart) must be rejected with HTTP 400. Legitimate orders — including customized products whose price is higher than the base product price — must continue to work exactly as they do today.

## Context you need before touching anything

- Cart items are built in `frontend/src/pages/ProductDetailPage.js` (`handleAddToCart`). **Critical:** for customized products, the frontend adds add-on charges into `item.price` *before* adding to cart (see `adjustedProduct = { ...product, price: product.price + addOnTotal }`). So `item.price >= db_price` is legitimate and common. `item.price < db_price` is always fraud or a bug.
- Add-on sources that raise `item.price` above the DB base price (all in ProductDetailPage.js):
  - `standAddOnPrices` map: businessCardHolder 10, squareReaderHolder 15, glitterFinish 5, matchingNfcKeychain 10
  - Display insert "Both Circle and Square +$5" → +5
  - `customization.glitter` → +3, `customization.resinOverlay` → +5, `customization.nfcKeychainResinFinish` → +5
  - Per-field `price_adjustments` from the product's `customization_fields` (admin-editable, stored in the product document)
- Totals math in `frontend/src/pages/CheckoutPage.js`: `total = subtotal + tax + shipping + rushOrderAmount`, where tax = `subtotal * 0.0925` (hardcoded), shipping comes from `/api/shipping-settings` (free when `free_shipping_enabled` and subtotal ≥ `free_shipping_threshold`; else selected option price; fallback 12.95), rush = `rush_order_price` from the same settings when `rush_order: true`.
- Money is floats everywhere. Compare in **cents as ints** with a tolerance of ±2 cents to absorb rounding.

## Exact files to touch

1. `backend/server.py` — all logic changes.
2. No frontend changes required.

## Implementation order

1. In `backend/server.py`, near `amount_to_cents()` (~line 370), add:
   ```python
   CHECKOUT_TAX_RATE = 0.0925  # must match the rate in frontend CheckoutPage.js
   MAX_ADDON_SURCHARGE_PER_ITEM = 200.0  # max customization upcharge accepted above DB base price

   def to_cents(amount) -> int:
       return int(round(float(amount or 0) * 100))
   ```
2. Add an async helper `verify_order_pricing(order_data) -> Optional[str]` (returns an error string, or None if valid):
   - Fetch every product in one query: `db.products.find({"id": {"$in": [i.product_id for i in items]}})`.
   - For each item:
     - Product must exist and have `published: True`. If not → `"Product {id} is not available"`.
     - `to_cents(item.price) >= to_cents(product["price"])` must hold (customizations only ever add). If not → error.
     - `to_cents(item.price) - to_cents(product["price"]) <= to_cents(MAX_ADDON_SURCHARGE_PER_ITEM)` must hold → error otherwise.
     - `item.quantity` must be an int 1–100 → error otherwise.
   - Recompute `subtotal_cents = sum(to_cents(item.price) * item.quantity)`. Must match `to_cents(order_data.subtotal)` within 2 cents.
   - Recompute tax: `tax_cents = round(subtotal_cents * CHECKOUT_TAX_RATE)`. Must match `to_cents(order_data.tax_amount)` within 2 cents.
   - Recompute shipping: load `db.shipping_settings.find_one({"id": "shipping_settings"})`.
     - If `order_data.fulfillment_type == "pickup"` → expected shipping 0.
     - Else if `free_shipping_enabled` and `subtotal_cents >= to_cents(free_shipping_threshold)` → expected 0.
     - Else expected shipping must equal the price of one of the **enabled** `shipping_options` (the customer picks among them), or 1295 if the options list is empty. Compare against `to_cents(order_data.shipping_amount)`.
   - Rush: if `order_data.rush_order` is true, `rush_cents = to_cents(settings.rush_order_price or 25)`, and rush must be enabled in settings; else `rush_cents = 0`. (Frontend sends `rush_order_amount`; verify it equals `rush_cents` within 2 cents.)
   - Grand total: `subtotal_cents + tax_cents + shipping_cents + rush_cents` must match `to_cents(order_data.total)` within 5 cents (accumulated rounding).
3. In `create_order` (`@api_router.post("/orders")`), call the helper first; on error `raise HTTPException(status_code=400, detail=error)`. Keep everything after unchanged.
4. In `create_checkout_session`, after loading the order, re-verify only the item base prices (step 2's per-item checks) against current DB prices — admins may change prices between order creation and payment. If any item's stored price is now below the current DB base price minus 2 cents… **do NOT reject** (the customer saw the old price); instead just log a warning. Only reject at session time if the original order failed verification fields entirely (`order.get("total", 0) <= 0`).
5. Add a log line for every rejection: `logging.warning(f"Order price verification failed for user {user.id}: {error}")`.

## Edge cases a weaker model would miss

- **Do not compare `item.price == product.price`.** Customized items legitimately cost more than the DB base price (see Context). Floor + cap, don't equality-check.
- **`price_prefix: "Starting at"` products** (most NFC/custom items) still have a numeric `price` — the floor check works, but never use `compare_at_price` for verification (it's the crossed-out marketing price).
- **Tax mismatch trap:** the admin `stripe_settings.tax_rate` field exists but is **not** what the frontend charges — the frontend hardcodes 9.25%. Verify against `CHECKOUT_TAX_RATE = 0.0925`, not the DB field, or every legitimate order will be rejected. (Unifying these is a separate task.)
- **Free-shipping threshold compares pre-tax subtotal**, not total. Threshold is currently 150.0 in the DB.
- **Pickup orders have `shipping_amount` 0 but may include rush.** Rush applies to both fulfillment types.
- **Floats:** `0.1 + 0.2` problems are real here; only compare cents ints with tolerance.
- **The shipping settings doc exists** (created 2026-07-05) but code must still handle a missing doc (fall back to: threshold 150, flat 12.95, rush 25) because a fresh database won't have it.
- **Don't validate `product_image`, `variant`, or `customization` contents** — they're descriptive, not priced, and blocking on them breaks legitimate orders.

## Acceptance criteria

Run backend locally (`cd backend && .venv/bin/uvicorn server:app --port 8001`), then with an authenticated session token `$TOK`:

1. **Legit order passes:** build an order via the real UI (add product, checkout) — completes to the Stripe redirect exactly as before.
2. **Tampered total rejected:** `curl -X POST localhost:8001/api/orders -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" -d '{"items":[{"product_id":"nfc-connect-duo","product_name":"x","quantity":1,"price":0.01}],"total":0.01,"subtotal":0.01,"tax_amount":0,"shipping_amount":0}'` → HTTP 400.
3. **Undercut item price rejected:** same as (2) but with plausible totals math on a price below the DB price → HTTP 400.
4. **Customized (higher) price passes:** item price = DB price + 15, totals consistent → HTTP 200.
5. **Wrong tax rejected:** correct subtotal, `tax_amount: 0` on a nonzero cart → HTTP 400.
6. `python3 -c "import ast; ast.parse(open('backend/server.py').read())"` passes; a full UI checkout with pickup AND one with shipping+rush both succeed end-to-end.
