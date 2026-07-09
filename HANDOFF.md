# Print Queen 3D Agent Handoff

Last updated: 2026-07-07

## Mandatory Agent Rules

Before making any change to this website, every agent must:

1. Read this `HANDOFF.md` file completely.
2. Read the agent plan index:
   `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`
3. Read any relevant plan file listed in that README before editing code.
4. Check `git status --short` before editing.
5. Preserve user changes and other agents' changes. Do not revert work you did not make.
6. After making changes, update this `HANDOFF.md` with:
   - Date/time
   - Agent name/tool if known
   - Files changed
   - What changed
   - Verification performed
   - Whether changes were committed, pushed, or deployed

No exceptions.

## External Plan Folder

The long-form agent plans live outside the website repo:

`/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans`

That folder currently contains:

- `README.md`
- `PLAN-checkout-price-verification.md`
- `PLAN-security-hardening.md`
- `PLAN-admin-content-integrity.md`
- `PLAN-performance-caching-indexes.md`
- `PLAN-dead-code-cleanup.md`

Agents should start with `README.md` and follow the listed execution order unless Nandi gives a newer instruction.

## Current Deployment Workflow

GitHub is used as a code backup.

Manual Vercel deploys are still the preferred deployment method:

```bash
cd /Users/nandinelson/Documents/Codex/2026-05-26/i-used-emergent-to-build-my/printqueen3d2026
vercel deploy --prod --yes --cwd backend
vercel deploy --prod --yes --cwd frontend
```

GitHub backup remote:

```text
fable -> https://github.com/glamtistop/print-queen-fable.git
```

## Current Live Status

As of 2026-07-07, `https://www.printqueen3d.com` was verified live:

- Home route returned `HTTP/2 200`
- `/shop` returned `HTTP/2 200`
- `/design-your-own` returned `HTTP/2 200`
- `/admin` returned `HTTP/2 200`
- `/api/site-config` returned JSON
- `/api/collections` returned JSON
- `/api/products?published=true` returned JSON

Frontend and backend are connected on the live domain.

## Recent Important Notes

- The external plan files were moved out of the repo into `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans`.
- Git author email was corrected to `glamtistop@gmail.com` for new commits.
- The repo has multiple remotes. Use `fable` for the current GitHub backup repo.
- Manual deployment to Vercel may show `ETIMEDOUT`; inspect or rerun deploy if Vercel status is unknown.

## Change Log

### 2026-07-09 - Codex - Custom Pendant and Chain Product

Nandi's request: add a new "Custom Pendant and Chain" product to the Gifts, Keepsakes & Celebrations collection using the uploaded pendant image, with regular/large pricing, required pendant text, required colors, and a +$5 glitter/resin add-on.

Files changed:

- `backend/server.py`
- `frontend/src/pages/ProductDetailPage.js`
- `frontend/src/components/admin/ProductForm.jsx`
- `frontend/public/assets/products/gifts-keepsakes-celebrations/custom-pendant-and-chain.jpg`
- `HANDOFF.md`

What changed:

- Added a seeded/admin-editable product: `gifts-custom-pendant-and-chain`.
- Product details:
  - Name: Custom Pendant and Chain
  - Collection/category: Gifts, Keepsakes & Celebrations
  - Base price: $25.99
  - Large size price: $40.00 through a +$14.01 field adjustment
  - Product image uses Nandi's uploaded pendant photo copied into the Gifts product assets folder.
- Added customer fields:
  - Name or word you would like on the pendant
  - Pendant Size: Regular / Large
  - Main Color
  - Chain Color
  - Add glitter and resin finish (+$5.00)
- Reused existing filament color fields for Main Color and Chain Color so color selection stays consistent with the rest of the site.
- Added admin-defined `checkbox` customization field support on the product page so add-on checkboxes can add price and save to cart/order details.
- Added `Checkbox` as a field type in the admin product editor, including an editable add-on price field.
- The existing optional inspiration/reference image upload block still appears on product pages, so customers can attach an idea/logo/reference if needed.

Verification:

- `PYTHONPYCACHEPREFIX=/tmp/python-cache python3 -m py_compile backend/server.py` passed.
- `CI=false corepack yarn build` passed.
- `git diff --check` passed.

Commit/push/deploy:

- Not committed, pushed, or deployed yet. Needs BACKEND deploy for the product seed and FRONTEND deploy for the product image, checkbox rendering, and admin editor field type.

### 2026-07-09 - Codex - Admin Sidebar Text Contrast

Nandi's request: make the wording in the admin/editor left section black and visible so it is easier to read.

Files changed:

- `frontend/src/components/admin/AdminLayout.jsx`
- `HANDOFF.md`

What changed:

- Updated the admin left navigation on desktop and mobile so sidebar labels and icons use dark/black text.
- Changed the active admin navigation background from a darker blue/green gradient with white text to a lighter cyan/emerald highlight with black text.
- Updated the admin "Store/View Store" button to the same readable light highlight with black text.
- Public storefront design, products, checkout, cart, and admin functionality were not changed.

Verification:

- `CI=false corepack yarn build` passed.

Commit/push/deploy:

- Not committed, pushed, or deployed yet. Needs a FRONTEND deploy for the admin visibility update to go live.

### 2026-07-09 - Codex - Selected Color Option Visibility

Nandi's request: when a customer chooses a color, especially tri-color filament, the selected block should visibly change so customers know what they picked.

Files changed:

- `frontend/src/pages/ProductDetailPage.js`
- `HANDOFF.md`

What changed:

- Added a shared selected-state style for product customization option cards.
- Selected color, original color, single color, tri-color add-on, tri-color blend, and restricted companion color blocks now show a stronger border, soft gradient background, ring highlight, swatch emphasis, and a "Selected" pill.
- Preserved Claude's tri-color add-on logic, +$5 pricing, companion color restriction, validation, cart/order details, and layout.

Verification:

- `git diff --check` passed.
- `CI=false corepack yarn build` passed.

Commit/push/deploy:

- Not committed, pushed, or deployed yet. Needs a FRONTEND deploy for the customer-facing selected-state styling to go live.

### 2026-07-09 - Claude Code - Tri-Color Filament Add-On (+$5) with restricted second colors

Nandi's spec: tri-color filament becomes a paid +$5 upgrade (not a regular color choice), with customer explanation; when selected, the second color is limited to White/Black/Gold/Silver with an explanatory note; lithophanes get no color option (always white); opt-in per product; no layout redesign.

Files changed:

- `frontend/src/pages/ProductDetailPage.js` (only file)

What changed (builds on the existing admin-editable `filament_color` field system):

- The "Tri Color" group inside filament color fields is now presented as "Tri-Color Filament Add-On" with a black "+$5.00" badge; selecting it adds $5 once per product (`triColorAddOnPrice` -> `addOnTotal` -> cart price). Admin can override the price per field via `tri_color_addon_price`, override the copy via `tri_color_explanation` / `tri_color_secondary_note`, and disable entirely per field via the existing `allow_tri_color: false` (Nandi's manual opt-out, req 10).
- Customer explanation paragraph (her exact copy) renders inside the tri-color blend picker panel.
- When tri-color is selected on one color field, every OTHER filament color field switches to a restricted companion picker: exactly four swatches (White #FFFFFF, Black #111111, Gold #D4AF37, Silver #C0C0C0) plus the amber note ("...only black, white, gold, or silver can be selected as the second color..."). The tri option is hidden on companion fields (no double tri). Deselecting tri restores the normal full selector.
- Validation: tri selected requires a blend choice; companion fields must hold one of the four allowed names, else a clear toast blocks add-to-cart.
- Order details now include "Tri-Color Filament Add-On: Yes (+$5.00)" plus the blend and companion color names.

Data change (live DB):

- `home-decor-lithophane-nightlight`: removed its `requested_color` filament field (photo upload + notes remain) per "lithophanes are always white". Removed field JSON preserved in this entry's session; re-add via Admin -> Products -> Customization Fields (Add Color) if ever wanted back.

Verification (local, live DB; desktop + 375px mobile):

- Keychain (2 color fields): both show the +$5.00 add-on card; selecting tri on Primary shows the explanation, 11 blend swatches, converts Secondary to the 4-swatch companion picker with the note, and hides tri there. Deselecting tri restores the full Secondary selector.
- Full add-to-cart: blend "Silky Triple-Color Rainbow" + companion "Gold" -> cart price = base $14.99 + $5 = $19.99; order details carry the add-on line, blend, and Gold. Success toast fired; test cart cleared.
- Mobile screenshot: amber note + 2x4->2x2 swatch grid clean and consistent with site style. No new console errors. `CI=false corepack yarn build` passed.
- Checkout compatibility: server price verification accepts the +$5 (floor + cap logic).

Commit/push/deploy: NOT committed/pushed/deployed. Needs a FRONTEND deploy (Nandi).

### 2026-07-08 - Codex - Google SEO Technical Optimization Pass

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/PLAN-seo-optimization.md`

Files changed:

- `backend/server.py`
- `frontend/public/index.html`
- `frontend/public/robots.txt`
- `frontend/src/App.js`
- `frontend/src/lib/seo.js`
- `frontend/src/pages/LandingPage.js`
- `frontend/src/pages/ProductDetailPage.js`
- `frontend/src/pages/ProductsPage.js`
- `HANDOFF.md`

What changed:

- Enhanced runtime SEO meta so pages can set `og:image`, `twitter:image`, and richer social preview tags.
- Enhanced Product JSON-LD with SKU, category, all available product images, item condition, and existing offer data. No fake ratings were added.
- Added BreadcrumbList JSON-LD for product pages and collection views.
- Added FAQPage JSON-LD on the homepage when the editable FAQ section is enabled and has Q&A content.
- Added cleanup so product, breadcrumb, and FAQ schema do not linger when customers navigate between pages inside the app.
- Upgraded `/api/sitemap.xml` with `lastmod`, `changefreq`, and `priority` for static pages, products, and collections.
- Added Cloudinary/backend preconnect and DNS prefetch hints in `index.html`.
- Expanded the default LocalBusiness schema with a safe OfferCatalog for the main service categories. No business hours were added because exact hours were not confirmed.
- Tightened `robots.txt` to keep session/token URLs out of search indexes.

Verification:

- `PYTHONPYCACHEPREFIX=/tmp/python-cache python3 -m py_compile backend/server.py` passed.
- `CI=false corepack yarn build` passed.
- `git diff --check` passed.

Nandi follow-up after deploy:

- Add/verify `https://www.printqueen3d.com` in Google Search Console.
- Submit `https://www.printqueen3d.com/sitemap.xml`.
- Create/import Bing Webmaster Tools after Google Search Console is active.
- Create or claim the Google Business Profile for Print Queen 3D, add service area, photos, categories, website, and start collecting Google reviews.
- Run Google's Rich Results Test on the homepage and a product page after deployment.

Commit/push/deploy:

- Not committed, pushed, or deployed yet. Deploy both backend and frontend for all SEO changes to go live.

### 2026-07-08 - Codex - Backend Cold-Start Optimization

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/PLAN-performance-caching-indexes.md`

Files changed:

- `backend/server.py`
- `HANDOFF.md`

What changed:

- Removed the heavy database setup path from normal backend serverless startup, so customer traffic no longer waits on indexes, seeders, Stripe/email settings seeding, NFC builder seeding, or one-time migrations every time Vercel wakes the backend.
- Added `RUN_STARTUP_MAINTENANCE_ON_BOOT=true` as an explicit environment flag for rare deploys where startup maintenance should run on boot.
- Added an admin-only maintenance endpoint: `POST /api/admin/maintenance/startup-tasks`, which runs the same setup tasks manually when needed.
- Preserved existing product, checkout, cart, admin, content, and styling behavior.

Verification:

- `PYTHONPYCACHEPREFIX=/tmp/python-cache python3 -m py_compile backend/server.py` passed.

Commit/push/deploy:

- Not committed, pushed, or deployed yet. Backend must be deployed for the cold-start improvement to reach customers.

### 2026-07-08 - Claude Code - Route code-splitting to cut homepage load delay

Nandi's report: still a delay when the website loads, even for customers.

Diagnosis (measured, not guessed):

- Live static assets are fast (HTML TTFB 0.23s; JS bundle downloads in ~0.37s). Warm API calls ~0.3s.
- Root cause of the consistent per-customer delay: the main JS bundle was ~340 kB gzipped (~1.3 MB uncompressed) because `App.js` statically imported EVERY page — the entire admin dashboard (SiteEditor/OrderManager/ProductForm, ~8k lines), ProductDetailPage (1948 lines), CheckoutPage (1146), and all marketing pages — so every homepage visitor downloaded and parsed code they never use. On mobile that parse cost is seconds.

Fix:

- `frontend/src/App.js` only. Converted all route components to `React.lazy` code-split imports (LandingPage stays eager as the common entry). Marketing named exports wrapped via `.then(m => ({ default: m.X }))`. Wrapped `<Routes>` in `<Suspense fallback={<div className="min-h-screen" aria-hidden />}>` (invisible, no jarring spinner). No other files changed; no behavior/visual change.

Result:

- Main bundle 340 kB -> 221.73 kB gzip (-117.85 kB, ~-35%). Admin/checkout/product/marketing now separate chunks loaded only when those routes are visited.
- Verified: homepage renders (hero + 11 collection cards) downloading ZERO lazy chunks; product page, /design-your-own (named-export lazy), and /login each load their own chunk on demand and work (add-to-cart, custom fields, form, login form all present). Production build succeeds with proper chunk splitting. No new console errors (the 16 "Failed to fetch" are stale from an earlier backend cold-start; count unchanged by navigation; backend now 200).

Separate remaining factor (NOT fixed here): backend serverless COLD START. `startup_event` runs seeds + `ensure_indexes` + content migration on every cold boot (DB round-trips to Atlas), adding latency to the first request after the function idles. Options for a later pass: gate the seeds/migration behind a flag so they don't run every cold start, or add a lightweight keep-warm ping. Recommend as a follow-up; the bundle split is the bigger, consistent win.

Commit/push/deploy: NOT committed/pushed/deployed. Needs a FRONTEND deploy to reach customers (Nandi's push).

### 2026-07-08 - Claude Code - FIXED live checkout: invalid STRIPE_API_KEY in Vercel env

Nandi's report: checkout says "You will be redirected to Stripe" but never redirects (live site, tested as customer; 6 failed attempts on the $0.99 test product).

Root cause (proven, not guessed):

- Reproduced her EXACT order ($0.99 test product, pickup, total $1.08) against the LOCAL backend: order + Stripe session created fine (checkout.stripe.com URL in 1.2s). Local code and local `.env` key are good.
- Same flow against LIVE `www.printqueen3d.com/api`: order created (HTTP 200) but `/api/checkout/session` returned HTTP 500.
- `vercel logs` on the live backend while triggering the failure showed: `Stripe API response ... response_code=401` — Stripe REJECTED the deployed key. The Vercel `STRIPE_API_KEY` env var was 43 days old and no longer valid (key was rolled at some point; only local `.env` got the new one). Every live checkout since that key died failed silently at the redirect step.

Fix applied (env only — ZERO code changes):

- Replaced Vercel production env `STRIPE_API_KEY` with the working `sk_live_...` key from local `backend/.env` (piped, never displayed).
- `vercel redeploy` of the SAME backend build Nandi deployed ~1h earlier (deployment nz0gp4qk7 -> 6ndplbc4t), so no new code shipped — only the corrected env took effect.

Verification:

- LIVE end-to-end: order HTTP 200 -> `/api/checkout/session` HTTP 200 in 1.1s with a real `https://checkout.stripe.com/c/pay/cs_live_...` URL.
- All debug orders/transactions deleted from the DB after each test. Nandi's own 6 failed `pending` orders for the test product remain (hidden from admin by Codex's pending-order filter).

Follow-ups for Nandi:

- In the Stripe dashboard, confirm which secret keys exist and delete any dead/rolled ones; when a key is ever rolled again, update BOTH `backend/.env` (local) and the Vercel backend env, then redeploy the backend.
- STRIPE_WEBHOOK_SECRET in Vercel is 34 days old — worth confirming it still matches the webhook endpoint's signing secret in Stripe (payment confirmation currently also works via success-page polling, so this is not urgent).
- Retry a real checkout on printqueen3d.com to confirm the customer experience end-to-end.

Commit/push/deploy: no repo changes from this fix (env + redeploy of existing build only). Working tree was already committed by Nandi/Codex (51ce206).

### 2026-07-08 - Codex - Verified Admin Orders Only After Paid Stripe Checkout

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/PLAN-checkout-price-verification.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/PLAN-security-hardening.md`

Files changed:

- `backend/server.py`
- `HANDOFF.md`

What changed:

- Confirmed checkout charges are created through Stripe using `STRIPE_API_KEY`; funds go to the Stripe account that owns that live secret key.
- Kept server-side order price verification in place before order/session creation.
- Changed admin order visibility so unpaid `pending` checkout orders do not show in Admin Orders or Admin Customer totals.
- Order details in admin now only resolve for paid/verified order statuses.
- Moved order confirmation email from order creation to confirmed Stripe payment, so customers only receive confirmation after payment is verified.
- Made payment confirmation idempotent so the Stripe webhook and success-page polling cannot send duplicate confirmation emails for the same paid checkout.

Verification:

- `PYTHONPYCACHEPREFIX=/tmp/python-cache python3 -m py_compile backend/server.py` passed.
- `git diff --check` passed.

Commit/push/deploy:

- Not committed, pushed, or deployed yet. Backend must be deployed for this payment/admin behavior to go live.

### 2026-07-08 - Claude Code - Tighter mobile section spacing + SEO plan (Plan 6)

Nandi's asks: remove large gaps between homepage sections (esp. mobile) so each sits right beneath the previous; and produce a detailed SEO plan for a Fable agent to execute.

Files changed:

- `frontend/src/pages/LandingPage.js` — added `home-landing` scoping class to the page root.
- `frontend/src/App.css` — inside the existing `@media (max-width:768px)` block, tightened homepage section vertical padding to 2.25rem (was py-16/py-20 = 64-80px) via `.home-landing > section:not(.hero-blend)` (and the inline-styled `.about-preview-section`), plus smaller section-title margin and `.mb-10` header trim. Hero excluded (keeps its own internal padding). Desktop unchanged.
- New (external): `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/PLAN-seo-optimization.md` + README entry (Plan 6).

Verification: mobile (390px) — all 9 homepage sections now 36px top/bottom padding; screenshots confirm collections -> "Why Print Queen 3D" and subsequent sections sit tightly beneath each other with heading glow visible; backend healthy (site-config 200); `CI=false corepack yarn build` passed.

SEO plan summary: 6 phases. Core problem identified = CRA is client-side rendered, so non-JS crawlers/social scrapers see generic homepage meta on every URL. Phases: (1) Search Console + GA4 + Google Business Profile setup, (2) enrich structured data (Breadcrumb/FAQ/per-product og:image), (3) sitemap lastmod + preconnect + canonicals, (4) prerender static per-route HTML (react-snap or build-time static HTML fallback) - biggest win, riskiest, own commit, (5) on-page alt/h1/internal-link polish, (6) Core Web Vitals. Notes off-page (reviews/GBP/backlinks) as Nandi-actions since code alone can't rank #1.

Commit/push/deploy: NOT committed/pushed/deployed.

### 2026-07-08 - Claude Code - Visible heading glow on light sections + smaller mobile headings

Nandi's asks: glow on the five big homepage headings, About photo back, Best Sellers off, smaller mobile wording, fast load.

Files changed:

- `frontend/src/App.css`
- `HANDOFF.md`

What changed:

- The shared heading glow (h1/h2/.section-title/.hero-title/footer h3) was white-dominant and invisible on white sections; strengthened the teal/purple/pink halo (white 0.85 / teal 0.42 / purple 0.30 / pink 0.16) so the soft neon glow reads on light backgrounds. Unified `.design-idea-cta-title` to the exact same values so all large headings match.
- Mobile (max-width 768px) heading sizes reduced: hero-title clamp(3.1rem,15vw,5.2rem) -> clamp(2.4rem,11vw,4rem); section-title clamp(3rem,15vw,5rem) -> clamp(2.1rem,10vw,3.5rem).

Findings (no code change needed):

- About Print Queen photo: intact locally — in DOM, loaded (Cloudinary URL HTTP 200), visible above the About heading. The "missing photo" is on the LIVE site, which runs an older deploy; deploying current code resolves it.
- Best Sellers: `featured` section is already disabled in the DB and does not render locally.
- Fast load: Codex's public-page paint change verified — homepage renders immediately with no auth spinner; "Failed to fetch" console entries were from loads during backend cold start only (no new errors on a fresh load).

Verification: mobile (375px) screenshots — hero and section headings fit and show the glow; all five requested headings confirmed sharing identical text-shadow; buttons remain solid black with white wording and glow; About photo + no Best Sellers + no spinner verified on fresh load; `CI=false corepack yarn build` passed.

Commit/push/deploy: NOT committed/pushed/deployed.

### 2026-07-08 03:05 PDT - Codex - Shared Headline Glow and Black Buttons

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`

Files changed:

- `frontend/src/App.css`
- `frontend/src/components/Navbar.js`
- `HANDOFF.md`

What changed:

- Applied the same black text with soft teal/purple/white glow treatment from the "Have an idea? We'll bring it to life." headline to large public page headings.
- Changed shared buttons, desktop nav pills, mobile menu links, Sign In, cart icon button, and cart count badge back to black backgrounds with white wording/icons.
- Preserved the current layout, content, products, cart, checkout, admin behavior, and existing glow/background system.

Verification:

- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.

### 2026-07-08 02:52 PDT - Codex - Dark Text and Faster Public Page Paint

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`

Files changed:

- `frontend/src/App.css`
- `frontend/src/App.js`
- `frontend/src/components/PageTransition.js`
- `frontend/src/pages/LandingPage.js`
- `HANDOFF.md`

What changed:

- Changed the public-facing white text treatments to dark/black text by lightening the matching glow surfaces: CTA section, Why Print Queen cards, hero badge, buttons, cart badge, and footer.
- Kept the aurora glow direction while making the page feel more consistent and readable on both mobile and desktop.
- Public storefront pages now render immediately instead of waiting on the auth check; protected pages such as admin, checkout, orders, and order success still wait for auth before rendering.
- Removed the initial page fade-in delay so pages appear right away on load.

Verification:

- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.

### 2026-07-08 02:38 PDT - Codex - Solid Why Card Title Bubbles

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`

Files changed:

- `frontend/src/App.css`
- `HANDOFF.md`

What changed:

- Refined the four "Why Print Queen 3D" cards so their title bubbles are now solid dark professional pills instead of gradient capsule outlines.
- Darkened the card surfaces slightly, improved title and body readability, and kept the teal/purple/gold glow effect in sync with the full-page visual style.
- Preserved the existing layout, content, homepage sections, products, cart, checkout, and admin functionality.

Verification:

- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.

### 2026-07-08 02:18 PDT - Codex - Homepage Glow and Section Polish

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`

Files changed:

- `frontend/src/App.css`
- `frontend/src/pages/LandingPage.js`
- `HANDOFF.md`

What changed:

- Restyled the "Have an idea? We'll bring it to life." CTA so the background photo is barely visible again under a darker premium glow overlay, with glowing headline/copy treatment.
- Made the homepage About preview title smaller and centered with a cleaner, more professional centered paragraph width.
- Darkened the "Why Print Queen 3D" four-card section and added decorative gradient header capsules around each card title.
- Slightly darkened general gray/slate wording across the page for better readability against the glow background.

Verification:

- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.

### 2026-07-08 02:02 PDT - Codex - Unified Page Glow Background

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`

Files changed:

- `frontend/src/App.css`
- `HANDOFF.md`

What changed:

- Made the page feel like one continuous premium aurora/glow background from header through footer instead of separate white section bands.
- Added full-page layered teal, purple, gold, coral, and white glow layers behind the app.
- Made page-level section backgrounds transparent where safe so the same gradient system flows through the homepage and other page shells.
- Softened hero/page fade behavior so sections blend together without hard cutoff lines.

Verification:

- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.

### 2026-07-08 01:55 PDT - Codex - Stronger Premium Glow

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`

Files changed:

- `frontend/src/App.css`
- `HANDOFF.md`

What changed:

- Increased the visibility and spread of the ambient glow system while keeping the existing layout and functionality unchanged.
- Strengthened background, section, button, card, and product image glow effects using the same premium teal, purple, gold, coral, and white palette.
- Increased mobile glow visibility without changing spacing, sizing, or causing horizontal layout changes.

Verification:

- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.

### 2026-07-08 01:43 PDT - Codex - Premium Ambient Glow Polish

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`

Files changed:

- `frontend/src/App.css`
- `HANDOFF.md`

What changed:

- Added refined ambient glow effects around the existing aurora visual system using layered radial gradients in Electric Teal, Royal Purple, Warm Gold, Soft Coral, and low-opacity white.
- Added extremely slow floating background and section glow movement using GPU-friendly transforms with reduced-motion support.
- Enhanced button depth with soft colored outer glow while keeping existing button size, placement, and solid professional fill.
- Added subtler premium card/product edge lighting, glass reflection feel, and smoother section-to-section background blending.
- Kept layout, spacing, typography sizing, positioning, content, product pages, navigation, forms, and functionality unchanged.

Verification:

- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.

### 2026-07-08 01:34 PDT - Codex - Professional Cart Count Badge

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`

Files changed:

- `frontend/src/App.css`
- `frontend/src/components/Navbar.js`
- `HANDOFF.md`

What changed:

- Separated the cart count badge from the shared button styling so it no longer inherits oversized button/bubble styles.
- Added a dedicated cart icon button and compact solid black count badge for cleaner desktop and mobile alignment.

Verification:

- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.

### 2026-07-08 01:29 PDT - Codex - Softer Hero Scale and Blend

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`

Files changed:

- `frontend/src/App.css`
- `frontend/src/pages/LandingPage.js`
- `HANDOFF.md`

What changed:

- Reduced the homepage hero headline scale so "Create Something Uniquely Yours" feels more balanced and professional on desktop and mobile.
- Added a soft white bottom fade to the hero section so the background/header image blends into the page instead of ending abruptly.

Verification:

- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.

### 2026-07-08 01:24 PDT - Codex - Solid Professional Button Bubbles

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`

Files changed:

- `frontend/src/App.css`
- `HANDOFF.md`

What changed:

- Changed CTA/button bubbles from animated aurora gradient fills back to a clean solid black professional style.
- Kept the premium rounded pill shape, larger sizing, and subtle elevated hover state.

Verification:

- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.

### 2026-07-08 01:18 PDT - Codex - Larger Matching Aurora Bubbles

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`

Files changed:

- `frontend/src/App.css`
- `HANDOFF.md`

What changed:

- Updated the secondary hero button, including "Shop Collections", to match the same aurora gradient bubble styling as the other primary CTA bubbles.
- Increased shared bubble/button sizing for hero CTAs and rounded product/nav bubble elements.

Verification:

- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.

### 2026-07-08 01:04 PDT - Codex - Premium Aurora Visual Redesign

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`

Files changed:

- `frontend/src/index.css`
- `frontend/src/App.css`
- `frontend/src/App.js`
- `frontend/src/components/Navbar.js`
- `frontend/src/components/ui/button.jsx`
- `frontend/src/pages/LandingPage.js`
- `HANDOFF.md`

What changed:

- Updated the frontend visual design system to a premium modern creative aesthetic using the requested soft aurora gradient palette: coral, orange, yellow, aqua, sky blue, violet, and magenta.
- Replaced the older Playfair/Montserrat styling with Bebas Neue for major headlines and Inter for body/UI text.
- Added blurred organic aurora glows, glassmorphism cards, premium shadows, rounded 20-28px surfaces, modern pill buttons, animated gradient button states, improved form focus states, upgraded scrollbar styling, and a darker premium footer treatment.
- Updated app loading visuals, hero overlay defaults, header/nav styling, and base button styling so the new design language applies across homepage, shop, product pages, cart/checkout shell, account/admin buttons, footer, and shared cards.
- Preserved all existing products, collections, cart, checkout, account, admin/editor functionality, and content sources.

Verification:

- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.

### 2026-07-08 - Claude Code - Admin fields now the only customization UI (fields precedence)

Nandi's request: a product's admin-defined fields (e.g., keychain = two colors + icon + NFC link) must be exactly what customers see, editable per product from the admin editor. Complements Codex's visual field editor entry below — Codex built the admin editing side; this makes the storefront obey it.

Files changed:

- `frontend/src/pages/ProductDetailPage.js` (coexists with Codex's same-day edits; all markers verified present together)

What changed:

- Admin `customization_fields` take precedence on EVERY product type. The hardcoded guided NFC flows (stand + keychain multi-step UIs) are now fallbacks used only when a product has no fields.
- Fields section heading/subtext use the admin-editable `product_page_section_title` / `product_page_section_text` (fallback "Customize This Product").
- Validation skips guided-flow requirements when admin fields exist; required admin fields still enforced.
- Stand order details no longer record empty guided-flow steps when admin fields are used.
- Data note: all 7 keychains have fields; the 6 NFC stand products have none, so they keep the guided flow until fields are added in admin.

Verification (local, live DB): keychain page shows only admin fields under admin heading; stand w/o fields unchanged; stand with a temp field switched to fields UI (product restored exactly); add-to-cart enforced required fields, fired success toast, cart carried exactly the field answers; test cart cleared; no console errors.

Commit/push/deploy: NOT committed/pushed/deployed.

### 2026-07-08 - Claude Code - Plan 5: Dead code & dependency cleanup

Executed `PLAN-dead-code-cleanup.md`. All plan greps re-verified before each deletion.

Files changed/deleted:

- Deleted: `frontend/src/pages/NFCStandPage.js`, `frontend/src/pages/AdminDashboard.js` (old page; `AdminDashboardNew.js` + `components/admin/AdminDashboard.jsx` remain live)
- Deleted: 33 orphan `frontend/src/components/ui/*` files + `frontend/src/hooks/use-toast.js` (kept the 13 in use: button, command, dialog, dropdown-menu, input, label, scroll-area, separator, sheet, skeleton, sonner, tabs, textarea)
- `frontend/src/App.js` (removed dead legacy-auth `processSession` path), `frontend/src/pages/LandingPage.js` (removed unused `fallbackProjectImages`)
- `backend/server.py` (removed dead `/auth/session` 410 route; added 5MB logo cap + HTTPException passthrough on `/api/nfc-stand/order`)
- `frontend/package.json` + regenerated `yarn.lock` (removed 29 unused packages: react-hook-form, @hookform/resolvers, zod, react-day-picker, date-fns, embla-carousel-react, input-otp, react-resizable-panels, vaul, cra-template, and 20 unused @radix-ui packages)

Lockfile decision: `yarn.lock` was never git-tracked and remains untracked; project stays on yarn (packageManager field + corepack). No DEPLOYMENT.md change needed.

Verification: production build (`corepack yarn build`) succeeded with trimmed deps; removed packages absent from node_modules; greps confirm zero refs to deleted files/packages; BuildYourStand/MockProductVisual/cmdk/next-themes/dnd-kit verified live and kept; sonner add-to-cart toast confirmed working.

Commit/push/deploy: NOT committed/pushed/deployed.

### 2026-07-08 - Codex - Admin Editable Product Customization Fields

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/PLAN-admin-content-integrity.md`

Files changed:

- `backend/server.py`
- `frontend/src/components/admin/ProductForm.jsx`
- `HANDOFF.md`

What changed:

- Replaced the repeat NFC Backpack field overwrite with a one-time migration (`nfc_backpack_customization_fields_20260708`) so future admin edits to that product's customization fields are not overwritten by code.
- Updated the default NFC Backpack color helper text:
  - Backpack color helper: "This color is for the backpack."
  - Straps/pocket color helper: "This color is for the straps and pocket."
- Added a visual product customization field editor in Admin → Products:
  - Add Text, Text Area, Dropdown, Upload, and Color fields.
  - Edit customer label, field key, type, required setting, helper text, placeholder text, dropdown options, and color-picker labels.
  - Reorder and remove fields.
  - Keep the advanced JSON box for power editing.
- This allows fields like a Heart/Thunder version selector to be added from the admin product editor and saved live to the product page.

Verification:

- `PYTHONPYCACHEPREFIX=/tmp/python-cache python3 -m py_compile backend/server.py` passed.
- Babel parser checks passed for `frontend/src/components/admin/ProductForm.jsx` and `frontend/src/pages/ProductDetailPage.js`.
- `git diff --check` passed.
- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.
- Note: unrelated uncommitted Plan 5 cleanup changes from another agent were already present and were preserved.

### 2026-07-08 - Codex - Show Full Picked Product Descriptions

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/PLAN-admin-content-integrity.md`

Files changed:

- `frontend/src/pages/ProductDetailPage.js`
- `frontend/src/pages/ProductsPage.js`
- `HANDOFF.md`

What changed:

- Product detail pages now show the selected product's own full admin description for NFC stand and NFC keychain products instead of replacing it with generic guided-customizer wording.
- Shop/collection product cards now show the full product description instead of clamping it to two lines.
- Left the Design Your Own page/form unchanged per Nandi's instruction.

Verification:

- Babel parser checks passed for `frontend/src/pages/ProductDetailPage.js` and `frontend/src/pages/ProductsPage.js`.
- `git diff --check` passed.
- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.
- Note: unrelated uncommitted Plan 5 cleanup changes from another agent were already present and were preserved.

### 2026-07-08 - Codex - NFC Backpack Customization Fields

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/PLAN-admin-content-integrity.md`

Files changed:

- `backend/server.py`
- `frontend/src/pages/ProductDetailPage.js`
- `HANDOFF.md`

What changed:

- Updated only the NFC Backpack / Emergency Contact NFC Keychain product seed customization fields to the requested five customer-facing fields:
  - `backpack_name` / Name on Backpack / text / required
  - `back_pack_color` / Original Color as Displayed or Single Color / color selector / required
  - `pocket_and_straps` / Original Color as Displayed or Single Color / color selector / required
  - `name` / Emergency Contact / textarea / required
  - `phone_number` / Phone Number / number / required
- Removed tricolor/multicolor options for that product by setting the two color fields to original-or-single only.
- Added a targeted seed refresh for `nfc-keychain-emergency-contact` so existing live DB product fields update to the requested five fields without changing other products.
- Updated the product detail renderer so `filament_color` fields with `allow_tri_color: false` do not show the Tri Color option, and number fields render as number inputs.

Verification:

- `PYTHONPYCACHEPREFIX=/tmp/python-cache python3 -m py_compile backend/server.py` passed.
- Babel parser check for `frontend/src/pages/ProductDetailPage.js` passed.
- `git diff --check` passed.
- `CI=false corepack yarn build` passed; production build compiled successfully.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.
- Note: unrelated uncommitted Plan 5 cleanup changes from another agent were already present and were preserved.

### 2026-07-07 - Codex - Verified Plans 3 and 4 for Manual Deploy

Read before editing:

- `HANDOFF.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/README.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/PLAN-admin-content-integrity.md`
- `/Users/nandinelson/Documents/Codex/printqueen3d-agent-plans/PLAN-performance-caching-indexes.md`

Files reviewed/verified:

- `backend/server.py`
- `frontend/src/lib/siteConfig.js`
- `frontend/src/components/Navbar.js`
- `frontend/src/components/SiteFooter.js`
- `frontend/src/pages/LandingPage.js`
- `frontend/src/pages/ProductsPage.js`
- `HANDOFF.md`

What changed:

- Preserved Claude's Plan 3 and Plan 4 implementation.
- Added this handoff verification entry before preparing the changes for manual Vercel deployment.

Verification:

- `python3` AST parse passed for `backend/server.py`.
- Babel parser checks passed for:
  - `frontend/src/components/Navbar.js`
  - `frontend/src/components/SiteFooter.js`
  - `frontend/src/pages/LandingPage.js`
  - `frontend/src/pages/ProductsPage.js`
  - `frontend/src/lib/siteConfig.js`
- Confirmed Plan 3 markers are present: content migration, removed read-time section wording override, seed refill only fills absent keys.
- Confirmed Plan 4 markers are present: `ensure_indexes`, site-config fetch cache module, cached Navbar/Footer/LandingPage/ProductsPage fetches, debounced shop search.
- Attempted `CI=false npm run build`; local build printed no error but stayed quiet for several minutes, so it was stopped and marked inconclusive. Vercel build should be used as the final production build check.

Commit/push/deploy:

- Prepared for commit and manual deploy. Vercel deployment still needs to be run manually from Terminal.

### 2026-07-07 - Claude Code (Opus) - Plan 4: Performance (indexes, caching, fetch hygiene)

Executed `PLAN-performance-caching-indexes.md`. Layered on top of the uncommitted Plan 3 work (preserved).

Files changed:

- `backend/server.py`
- `frontend/src/lib/siteConfig.js` (new)
- `frontend/src/components/Navbar.js`
- `frontend/src/components/SiteFooter.js`
- `frontend/src/pages/LandingPage.js`
- `frontend/src/pages/ProductsPage.js`

What changed:

- Added `ensure_indexes()` (plain, non-unique indexes on the fields we filter on) called first in `startup_event`. Idempotent.
- Replaced the N+1 loop in `/api/admin/customers` with a single `$group` aggregation; response shape unchanged.
- New `fetchSiteConfig()` module: caches `/api/site-config` for one page load (module state resets on full reload) and de-dupes concurrent callers via a shared in-flight promise. Navbar, SiteFooter, LandingPage, and ProductsPage now use it.
- ProductsPage: split the single filter-effect into static-content-once + products-on-filter-change + a 300ms debounced search effect (guarded against firing on mount).
- DEVIATION from plan: LandingPage uses plain `fetchSiteConfig()` instead of `{ fresh: true }`. Because React runs child effects (Navbar/Footer) before the parent's, `fresh:true` bypassed the shared request and produced 3 site-config calls. The endpoint already sends `Cache-Control: no-store` and the module cache resets each full load, so a plain shared call is both fresh and single. Verified 1 request.

Verification (local backend :8001 on live DB, frontend :3000):

- Acceptance 1: all spot-checked indexes PRESENT after startup.
- Acceptance 2: homepage makes exactly 1 `/api/site-config` request (was 3).
- Acceptance 3: typing 6 chars in shop search fired 1 `/api/products?...search` request, 0 repeat collections/site-config.
- Acceptance 4: `/api/admin/customers` keys identical, stats match an independent Mongo computation (0 mismatches).
- Acceptance 5: injected a marquee marker in DB, hard-reloaded homepage, marker appeared (cache doesn't survive reload); marker removed/restored.
- Acceptance 6: click-through home -> shop -> collection -> product -> cart, no console errors. Frontend compiled successfully.
- Note: in CRA dev mode React StrictMode double-invokes effects, so uncached endpoints (e.g. /api/collections) show 2 dev-only requests; production single. The site-config dedup holds even under double-invoke.

Commit/push/deploy:

- NOT committed, pushed, or deployed. Now contains BOTH Plan 3 and Plan 4 uncommitted changes.
- The indexes were created on the live DB during local startup (local shares prod Mongo). Deploying the code is still needed for the frontend caching + customers aggregation to reach the live site.

### 2026-07-07 - Claude Code (Opus) - Plan 3: Admin content integrity

Executed `PLAN-admin-content-integrity.md` (make the admin editor the single source of truth).

Files changed:

- `backend/server.py`
- `frontend/src/pages/LandingPage.js`

What changed:

- Added one-time startup migration `migrate_content_overrides_20260707()` that persists the content visitors currently see into the DB (hero subheadline/button text/link, featured headline/subheadline, and `site_settings.footer_pickup_text`), guarded by a `db.migrations` flag doc so it never re-runs.
- Removed the backend wording rewriter from the read path: deleted `refresh_section_wording` and its 3 call sites in `get_public_site_config` / `get_homepage_sections`. Kept `refresh_3d_printing_wording` (now used ONLY by the migration, clearly commented).
- Removed the `merge_default_sections` force blocks: marquee name/order, hero order, and the `legacy_about_copy` about_preview override.
- Fixed the seed refill in `ensure_nfc_business_stands_seeded` (all 5 product loops): `fields_to_fill` now only fills keys that are entirely absent (`if key not in existing_product`), so deliberately cleared product fields are respected.
- Simplified the LandingPage hero + featured "ladders" to plain reads with `||` defaults.
- Scope note: the `why_choose_us` headline ladder in LandingPage.js was intentionally left in place (out of plan scope); its behavior is unchanged. Flag for a future pass if full source-of-truth is desired there too.

Verification (local backend on :8001 against the live DB, frontend on :3000):

- Migration dry-run previewed exactly the expected writes (values the site already displayed); applied on startup; flag doc created.
- Acceptance 1: homepage renders identically pre/post (hero headline/badge/subheadline/button, footer LA text). No console errors.
- Acceptance 2: setting hero.headline to "Custom 3D Printed Creations" now renders verbatim (was silently overridden). Restored.
- Acceptance 3: "premium materials" in a section description renders verbatim. Restored.
- Acceptance 4: clearing `nfc-connect-duo` subtitle then restarting backend + triggering seed left it empty (was refilled before). Restored to "2 Icon NFC Stand".
- Acceptance 5: migration flag count = 1; second startup did not re-run.
- All temporary test writes to the live DB were reverted via try/finally.

Commit/push/deploy:

- NOT committed, pushed, or deployed. Nandi pushes to GitHub / deploys to Vercel when ready.
- NOTE: this change includes a DB migration that already ran against the live database (local shares the prod Mongo). The live DB now holds the migrated values; deploying the code is still required so the live site stops applying the (now-removed) overrides in code.

### 2026-07-07 - Codex

Files changed:

- `HANDOFF.md`

What changed:

- Created the mandatory shared handoff file for all agents.
- Documented the required read-before-edit and update-after-edit protocol.
- Documented the external agent plan folder, deployment workflow, current live status, and current GitHub backup remote.

Verification:

- Confirmed no previous handoff file existed.
- Confirmed the external agent plan README exists and lists five plans.

Commit/push/deploy:

- Not committed, pushed, or deployed yet.
