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
