# PLAN: Performance — MongoDB Indexes, Site-Config Caching, Shop Fetch Hygiene

**Rank: 4 of 5.** Backend queries are unindexed collection scans; the frontend fetches `/api/site-config` 2–3× per page view and refires four API calls on every search keystroke.

## Goal

Cut redundant database and network work with zero behavioral or visual change: add Mongo indexes at startup, cache site-config client-side per page load, fetch static shop data once, and debounce search.

## Exact files to touch

1. `backend/server.py` — indexes + one aggregation.
2. `frontend/src/lib/siteConfig.js` — new tiny module.
3. `frontend/src/components/Navbar.js`, `frontend/src/components/SiteFooter.js`, `frontend/src/pages/LandingPage.js` — use the module.
4. `frontend/src/pages/ProductsPage.js` — effect split + debounce.

## Implementation order

**Backend (do first, independent):**
1. In `server.py`'s `startup_event()`, add:
   ```python
   async def ensure_indexes():
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
   ```
   Call it first inside `startup_event()`. `create_index` is idempotent — safe on every cold start.
2. Replace the N+1 loop in `get_all_customers` (`/api/admin/customers`) with one aggregation:
   ```python
   pipeline = [
       {"$group": {"_id": "$user_id", "total_orders": {"$sum": 1}, "total_spent": {"$sum": {"$ifNull": ["$total", 0]}}}}
   ]
   stats = {row["_id"]: row for row in await db.orders.aggregate(pipeline).to_list(10000)}
   ```
   Then build the same response shape as today from `users` + `stats.get(usr["id"])` (0/0 when absent). The response JSON must be byte-shape identical (same keys).

**Frontend:**
3. Create `frontend/src/lib/siteConfig.js`:
   ```js
   let cached = null;
   let inFlight = null;

   export const fetchSiteConfig = ({ fresh = false } = {}) => {
     if (cached && !fresh) return Promise.resolve(cached);
     if (inFlight && !fresh) return inFlight;
     inFlight = fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-config`, fresh ? { cache: 'no-store' } : undefined)
       .then((response) => response.json())
       .then((data) => { cached = data; inFlight = null; return data; })
       .catch((error) => { inFlight = null; throw error; });
     return inFlight;
   };
   ```
   This caches for the lifetime of one page load (module state resets on full reload), so admin edits still appear on refresh.
4. `Navbar.js`: in `fetchNavigation`, replace the `fetch(...)` with `const data = await fetchSiteConfig();` (import the module). Keep the fallbackNavLinks catch path.
5. `SiteFooter.js`: same replacement inside its `fetchConfig` (only runs when no `siteConfig` prop was passed).
6. `LandingPage.js`: in `fetchPageData`, replace the site-config fetch entry in the `Promise.all` with `fetchSiteConfig({ fresh: true })` — the homepage should always show the latest hero/marquee, and this primes the cache so Navbar/Footer reuse it.
7. `ProductsPage.js` — split the combined effect. Today: `useEffect(() => { fetchCategories(); fetchShopContent(); fetchProducts(); }, [selectedCategory, selectedCollection, searchQuery]);`
   Replace with:
   ```js
   useEffect(() => { fetchCategories(); fetchShopContent(); }, []);
   useEffect(() => { fetchProducts(); }, [selectedCategory, selectedCollection]);
   useEffect(() => {
     const timer = setTimeout(() => { fetchProducts(); }, 300);
     return () => clearTimeout(timer);
   }, [searchQuery]);
   ```
   Note: `fetchProducts` reads `searchQuery` from closure — with the split above, ESLint (react-hooks/exhaustive-deps) will warn; the existing codebase already carries such warnings (build does not fail on them locally). Keep the existing `productRequestRef` race-guard logic in `fetchProducts` untouched — it is what prevents out-of-order responses from clobbering results.

## Edge cases a weaker model would miss

- **Do NOT set `unique=True` on any index** — if the live data ever contains a duplicate (it has before: duplicated pickup locations existed until 2026-07-06), startup would crash the API. Plain indexes only.
- **Startup runs on every serverless cold start** — `ensure_indexes` must be cheap and idempotent (it is; Mongo no-ops existing indexes).
- The debounce effect **also fires on mount** with `searchQuery = ''`, causing one duplicate initial `fetchProducts`. Guard it: `if (searchQuery === '' && productRequestRef.current === 0) return;` is fragile — instead track first render: `const didMountSearch = useRef(false); useEffect(() => { if (!didMountSearch.current) { didMountSearch.current = true; return; } const timer = ...}, [searchQuery]);`
- `fetchShopContent` in ProductsPage.js also fetches site-config via axios — switch it to `fetchSiteConfig()` too, or you've only fixed half the duplication on the shop page.
- The site-config module cache means an admin editing content and clicking from admin → homepage via client-side routing could see stale nav for that one session. That is acceptable; a full refresh always fetches fresh (module state resets). Do not add TTL complexity.
- `SiteFooter` receives `siteConfig` as a prop from LandingPage/ProductsPage/MarketingPages already — the module only matters for pages that don't pass it. Don't remove the prop path.
- Keep `LandingPage`'s marquee/hero rendering reading from the SAME response object as before — the shape returned by `fetchSiteConfig` is identical to the previous `await response.json()`.

## Acceptance criteria

1. Backend log or `db.command`: after startup, `db.products.index_information()` shows the new indexes (verify with a one-off python snippet using pymongo).
2. Open the homepage with browser DevTools → Network: exactly **one** request to `/api/site-config` (was 2–3).
3. On `/shop`, type a 5-character search quickly: Network shows **one** `/api/products?...search=` request (after ~300ms), not five, and zero repeat requests to `/api/collections` or `/api/site-config`.
4. Admin → Customers loads with the same data as before (spot-check one customer's totals) and returns in one network round-trip time even with many users.
5. Change the marquee text in Site Editor → save → full-refresh the homepage → new text appears (cache doesn't survive reload).
6. `npm start` compiles with no NEW eslint errors; site clicks through: home → shop → filter by collection → product → cart with no console errors.
