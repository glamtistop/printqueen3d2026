# PLAN: Make the Admin Editor the Single Source of Truth (retire silent content overrides)

**Rank: 3 of 5.** Today, three hidden code layers silently rewrite or refill content the owner edits in the admin. The owner types a headline; the site shows something else; nobody knows why. This plan retires those layers WITHOUT changing what visitors currently see.

## Goal

After this change: what the admin editor saves is exactly what the site renders. Current visible copy must not change — the migration writes today's *effective* (post-override) text into the database before the override code is deleted.

## The three override layers (all must go)

1. **Backend wording rewriter** — `refresh_3d_printing_wording()` + `refresh_section_wording()` in `backend/server.py` (search those names). Applied on every read of `/api/site-config` and `/api/admin/homepage-sections`, silently replacing strings like "premium materials" → "quality PLA and PETG materials" and old pickup-city lists → "Los Angeles, California".
2. **Frontend legacy ladders** — in `frontend/src/pages/LandingPage.js`, the hero block (search `heroHeadline`, `heroSubheadline`, `heroBadge`, `heroPrimaryText`, `heroPrimaryLink`) replaces specific saved values (e.g. saved headline `"Custom 3D Printed Creations"` renders as `"Create Something Uniquely Yours"`). Similar ternaries exist for the categories headline/subheadline (search `'Shop by Collection'`) and featured headline (search `'Best Sellers'`), plus the `about_preview` legacy-copy override inside `merge_default_sections` in `server.py` (search `legacy_about_copy`).
3. **Seed refill of cleared fields** — in `ensure_nfc_business_stands_seeded()` (server.py), `fields_to_fill` treats `"" / [] / None` as "missing" and restores hardcoded seed values. If the admin deliberately clears a product's subtitle/badge/description, the next cold start puts it back.

## Exact files to touch

1. `backend/server.py` — migration function + delete override call sites.
2. `frontend/src/pages/LandingPage.js` — delete the ladders.

## Implementation order

**Phase A — persist current effective content (one-time migration, run on startup):**
1. In `server.py`, write `async def migrate_content_overrides_20260707():` guarded by a flag doc: `db.migrations.find_one({"id": "content_overrides_20260707"})` — if present, return immediately.
2. Inside, for the homepage sections doc (`db.homepage_sections`, id `homepage_sections`), if it exists: run its sections through `merge_default_sections` **and** `refresh_section_wording` (the current read path), then additionally apply the frontend ladder rules so the DB ends up holding what visitors currently see:
   - hero section: if `content.headline` in `{"", "Custom 3D Printed Creations", "Custom 3D Creations Made Just for You"}` → set to `"Create Something Uniquely Yours"`. If `content.subheadline` is empty, equals `"Bringing Your Ideas to Life"`, or matches `premium materials` (case-insensitive) → set to the long default from LandingPage (copy the exact string). If `button_text` in `{"", "Shop Now"}` → `"Start Custom Order"`. If `button_link` in `{"", "/products", "#design-your-own"}` → `"/design-your-own"`.
   - categories section: if headline in `{"What Would You Like to Personalize Today?", "Shop by Category"}` → `"Shop by Collection"`; same treatment for the subheadline pair in LandingPage.
   - featured section: if headline == `"Featured Products"` → `"Best Sellers"`; if subheadline == `"Our most popular items"` → the replacement string in LandingPage.
   - Save the transformed sections back with `$set`, then insert the migration flag doc.
3. Also migrate site_settings: run the full `site_settings` doc through `refresh_3d_printing_wording` and save.
4. Call the migration from `startup_event()` (after the existing seeds).

**Phase B — delete the overrides (only after Phase A is in the same deploy):**
5. In `get_public_site_config` and `get_homepage_sections`, remove the `refresh_section_wording(...)` calls. Keep `merge_default_sections` (it fills genuinely-missing keys for NEW sections — that's a feature).
6. In `merge_default_sections`, delete the `legacy_about_copy` block, and the forced marquee `name`/`order` reassignment lines (`section["name"] = "Top Announcement Marquee"` etc.).
7. Delete `refresh_3d_printing_wording` and `refresh_section_wording` function definitions.
8. In LandingPage.js, replace each ladder with a plain read, e.g. `const heroHeadline = heroContent.headline || 'Create Something Uniquely Yours';` — keep the `||` default (used only when the field is absent), delete the "if it equals X show Y" logic. Same for subheadline, badge (keep the `hasEditableHeroBadge` handling for the badge/description split — that's shape-compat, not an override... simplify only the value-matching parts), buttons, categories headline/subheadline, featured headline/subheadline.
9. **Seed refill fix:** in `ensure_nfc_business_stands_seeded`, change every `fields_to_fill` comprehension from `if key not in existing_product or existing_product.get(key) in [None, "", []]` to `if key not in existing_product`. Apply to all five product loops (nfc stands, keychains, home décor, toys, gifts). Leave the `$addToSet` collection linking as is.

## Edge cases a weaker model would miss

- **Order matters absolutely:** deleting the overrides without first persisting the effective text (Phase A) visibly changes the live homepage — the DB still holds pre-override legacy copy on several sections. Both phases must ship together, migration running first at startup.
- The migration must transform using the *same* rules being deleted — copy the exact replacement strings from `refresh_3d_printing_wording`'s dict and LandingPage's ternaries; do not paraphrase them.
- `merge_default_sections` **must stay** — it's how newly-added default sections (e.g. `how_it_works`, `faq`, added 2026-07-06) appear for existing databases. Only the wording-rewrite and about/marquee force-blocks go.
- The `marquee` forced-order removal means a saved marquee order other than 1 will now be respected — that is the intent, but confirm the live DB's marquee has order 1 before deploy (it does as of 2026-07-06) so nothing moves.
- The seed-refill change means a *fresh, empty* database still gets full products (all keys absent → all filled). Only deliberate clearing is respected now.
- `wording_migrated_home_decor_20260629` in `get_collections` is a separate, already-flagged migration — leave it.
- There is no `db.migrations` collection yet; Mongo creates it on first insert — no setup needed. Add `"migrations"` is NOT needed in the export list (internal bookkeeping).
- LandingPage's `legacyHeroImages` filtering and `fallbackHeroImage` are image fallbacks, not text overrides — out of scope, don't touch.

## Acceptance criteria

1. Before/after screenshot of the full homepage at 1280px and 375px are pixel-equivalent for all text content (manual visual compare is fine).
2. In Admin → Site Editor, set the hero headline to exactly `Custom 3D Printed Creations`, save, reload the homepage → it must now display `Custom 3D Printed Creations` (pre-change behavior: it silently displayed "Create Something Uniquely Yours").
3. Type `premium materials` into any homepage section description, save, view homepage → the words `premium materials` appear verbatim.
4. In Admin → Products, clear the `subtitle` of `nfc-connect-duo`, save, restart the backend, reload the product page → subtitle stays empty (pre-change: seed restored it on restart).
5. `db.migrations` contains `{"id": "content_overrides_20260707"}` after first startup; second startup does not re-run (check logs).
6. A brand-new empty DB (optional check): starting the backend still seeds full products and default sections.
