# PLAN: Dead Code & Dependency Cleanup

**Rank: 5 of 5.** Purely maintainability: ~1,300 lines of dead code, ~38 unused UI components, and ~10 removable npm packages. Do this LAST — it touches many files and every other plan's diffs are cleaner without a cleanup rebase under them.

## Goal

Remove code that nothing references, without touching anything reachable. Every deletion below was verified unreferenced on 2026-07-07, but **re-verify each with the given grep before deleting** — the owner edits code between sessions.

## Exact files to touch / delete

### A. Dead pages (delete files + verify)
1. `frontend/src/pages/NFCStandPage.js` (~830 lines). Verify first:
   `grep -rn "NFCStandPage" frontend/src --include="*.js" --include="*.jsx" | grep -v "pages/NFCStandPage.js"` → must output nothing.
2. `frontend/src/pages/AdminDashboard.js` (~390 lines — the OLD admin page; the live one is `AdminDashboardNew.js`). Verify:
   `grep -rn "from '.*pages/AdminDashboard'" frontend/src` → must output nothing. **Trap:** `components/admin/AdminDashboard.jsx` is a DIFFERENT, LIVE file (imported by AdminDashboardNew.js). Only delete the one under `pages/`.

### B. Dead legacy auth path
3. In `frontend/src/App.js`: delete the `processSession` function and the `if (hash.includes('session_id='))` branch in the mount effect (keep `checkAuth()` as the unconditional call). The endpoint it calls returns HTTP 410 permanently.
4. In `backend/server.py`: delete the `@api_router.post("/auth/session")` route (`process_session`) — it only raises 410.

### C. Dead constants in LandingPage.js
5. Delete `fallbackProjectImages` (verify: `grep -n "fallbackProjectImages" frontend/src -r` → only the definition).

### D. KEEP — things that look dead but are NOT
- `frontend/src/components/BuildYourStand.jsx` and the backend route `/api/nfc-stand/order`: BuildYourStand renders on any product whose `custom_builder` field equals `"nfc-stand-builder"` (admin-settable; see ProductDetailPage.js `product.custom_builder === 'nfc-stand-builder'`). **Keep both**, but add an upload size cap to the route (see F).
- `frontend/src/components/MockProductVisual.js` — used as image fallback on homepage cards.
- `components/ui/sonner.jsx` (and its `next-themes` dependency), `ui/command.jsx` (and `cmdk`) — both live via Toaster/CommandPalette.
- `@dnd-kit/*` — used by admin SiteEditor and CustomBuilderManager.

### E. Unused npm dependencies + their orphan ui components
6. Delete these ui files (each is only imported by other unused ui files or nothing — verify each with `grep -rn "ui/<name>" frontend/src --include="*.js" --include="*.jsx" | grep -v "components/ui/"` → nothing):
   `accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, calendar, card, carousel, checkbox, collapsible, context-menu, drawer, form, hover-card, input-otp, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, select, slider, switch, table, toggle, toggle-group, tooltip, toast, toaster` (all under `frontend/src/components/ui/`). **Trap:** `use-toast.js` in `frontend/src/hooks/` is imported by `toaster.jsx` only — delete it with them. **Keep:** `button, dialog, dropdown-menu, input, label, scroll-area, separator, sheet, skeleton, sonner, command, tabs, textarea`.
7. Then remove from `frontend/package.json` dependencies: `react-hook-form, @hookform/resolvers, zod, react-day-picker, date-fns, embla-carousel-react, input-otp, react-resizable-panels, vaul, cra-template`, plus these Radix packages: `react-accordion, react-alert-dialog, react-aspect-ratio, react-avatar, react-checkbox, react-collapsible, react-context-menu, react-hover-card, react-menubar, react-navigation-menu, react-popover, react-progress, react-radio-group, react-select, react-slider, react-switch, react-toast, react-toggle, react-toggle-group, react-tooltip` (all prefixed `@radix-ui/`). **Keep** `@radix-ui/react-dialog, react-dropdown-menu, react-label, react-scroll-area, react-separator, react-slot, react-tabs` and everything else not listed.
8. Run `cd frontend && npm install` to regenerate the lockfile, then `npm run build` — the build MUST succeed. If it fails naming a removed package, restore that package and its ui file; do not force it.

### F. Small backend guard while here
9. In `/api/nfc-stand/order` (server.py), after `logo_contents = await logo.read()`, add:
   ```python
   if len(logo_contents) > 5 * 1024 * 1024:
       raise HTTPException(status_code=400, detail="Logo must be 5MB or smaller")
   ```
   (It currently stores unlimited base64 in Mongo; documents cap at 16MB.)

### G. Optional (ask the owner first — do NOT delete unprompted)
- Emergent scaffolding: `test_result.md`, `backend_test.py`, `auth_testing.md`, `test_reports/`, `tests/__init__.py`, `.emergent/`. Historical artifacts; harmless but noisy.
- `frontend/public/assets/homepage/custom-3d-prints.png`, `payment-stands.png`, `nfc-keychain.png`, `printqueen-hero-products.png` — in `legacyHeroImages` (filtered from rendering) but conceivably referenced by DB content the admin set. Before deleting any, check the live DB: no `site_settings.hero_images`, section `image_url`/`background_image_url`, product `images`, or collection image fields contain the filename.

## Edge cases a weaker model would miss

- **Two files named AdminDashboard** — only `pages/AdminDashboard.js` is dead (see A2).
- `components.json` (shadcn config) references the ui directory — leave the file; it doesn't import anything.
- CRA builds only what's imported, so this cleanup does NOT shrink the production bundle — do not claim bundle-size wins in the commit message; the win is install time, `npm audit` surface, and reader clarity.
- Removing `cra-template` is safe (it's scaffolding used only at project creation) but do not touch `react-scripts` or `@craco/craco`.
- After deleting `toast.jsx`/`toaster.jsx`/`use-toast.js`, confirm nothing imports `@/hooks/use-toast` or `../hooks/use-toast`: `grep -rn "use-toast" frontend/src` → nothing. All app toasts use `sonner` (different system).
- `frontend/yarn.lock` AND package-lock may both exist after npm install; the project historically used yarn but yarn is not installed on this machine. Regenerate whichever lockfile exists; if both end up present, keep `package-lock.json` and delete `yarn.lock` to avoid Vercel picking the stale one. **Then verify the Vercel frontend project's install command doesn't reference yarn** (frontend deploy config uses `yarn build` per DEPLOYMENT.md — if the lockfile switches to npm, update DEPLOYMENT.md build command to `npm run build`).
- Do all of section E in ONE commit separate from sections A–D, so a build regression can be reverted without losing the dead-page cleanup.

## Acceptance criteria

1. `npm run build` succeeds in `frontend/` with no new errors.
2. `grep -rn "NFCStandPage\|pages/AdminDashboard'" frontend/src` → no matches.
3. Full click-through with zero console errors: home → shop → collection filter → product page (one NFC stand, one keychain, one home décor) → add to cart with customizations → cart → checkout step 3 → admin: every tab opens (Products, Orders, Site Editor save works, Custom Builders).
4. Toasts still appear (add-to-cart success toast, admin save toast).
5. `npm ls react-hook-form` (and each removed package) reports "empty" / not found.
6. Deployed preview (owner pushes) renders identically to before at /, /shop, /design-your-own, one product page.
