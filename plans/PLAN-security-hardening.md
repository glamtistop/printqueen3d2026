# PLAN: Security Hardening — CORS, Stripe Webhook, Sessions

**Rank: 2 of 5.** Three narrow, independent fixes in `backend/server.py`. No frontend changes. No visual changes.

## Goal

1. Stop trusting every `*.vercel.app` site with credentialed CORS.
2. Stop accepting unsigned Stripe webhooks.
3. Scope checkout-status lookups to the session owner and slow down login brute-forcing.

## Exact files to touch

- `backend/server.py` only.
- `DEPLOYMENT.md` — one doc note (step 5).

## Context you need

- CORS is configured at the bottom of `server.py`: `get_allowed_origins()` + `app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origin_regex=r"https://.*\.vercel\.app", ...)`. With `allow_credentials=True`, that regex lets ANY stranger's vercel.app deployment make cookie-authenticated requests to this API.
- Vercel preview/production URLs for this project look like: `https://printqueen3d2026-frontend-<hash>-nandis-projects-cc28225b.vercel.app` and the same with `-backend-`.
- The Stripe webhook (`stripe_webhook`, search `@api_router.post("/webhook/stripe")`) currently falls back to `json.loads(body)` when `STRIPE_WEBHOOK_SECRET` is unset — meaning anyone can POST `{"type":"checkout.session.completed", ...}` and mark orders paid.
- **Safety valve that makes the webhook change low-risk:** payment confirmation does NOT depend on the webhook. `GET /api/checkout/status/{session_id}` (used by the order-success page polling) queries Stripe directly and marks orders paid. If the webhook secret is missing in prod and the webhook starts rejecting, customers' orders still get confirmed via polling.
- Production is deployed with env vars documented in `DEPLOYMENT.md`; `STRIPE_WEBHOOK_SECRET` is listed there and believed set — but verify in the Vercel dashboard before deploying this change.

## Implementation order

1. **CORS regex.** Replace `allow_origin_regex=r"https://.*\.vercel\.app"` with:
   ```python
   allow_origin_regex=r"https://printqueen3d2026-(frontend|backend)-[a-z0-9]+-nandis-projects-cc28225b\.vercel\.app"
   ```
   Leave `get_allowed_origins()` (localhost + printqueen3d.com domains) untouched.
2. **Webhook.** In `stripe_webhook`, replace the `else: event = json.loads(...)` fallback with:
   ```python
   else:
       logging.error("STRIPE_WEBHOOK_SECRET is not configured; rejecting unsigned webhook")
       raise HTTPException(status_code=400, detail="Webhook signing is not configured")
   ```
   Keep the signed path exactly as is.
3. **Checkout status ownership.** In `get_checkout_status`, after loading the transaction, add:
   ```python
   if transaction.get("user_id") and transaction["user_id"] != user.id and not user.is_admin:
       raise HTTPException(status_code=404, detail="Payment transaction not found")
   ```
   (404, not 403, to avoid confirming the session id exists.)
4. **Login throttle.** In `email_password_login`, before each of the two `raise HTTPException(status_code=401, ...)` lines, add `await asyncio.sleep(1)` (add `import asyncio` at the top of the file with the other imports). This makes bulk brute-forcing ~1 req/sec per connection without any new dependency. Do NOT add `slowapi` or an in-memory limiter — the backend runs serverless, per-instance memory won't hold state.
5. **DEPLOYMENT.md**: under the backend env list, add a line: `STRIPE_WEBHOOK_SECRET is now required — unsigned webhooks are rejected.`

## Edge cases a weaker model would miss

- **Do not remove `allow_credentials=True`** — the whole session system uses cookies.
- **Do not switch the session cookie to `SameSite=Lax` as part of this task.** It looks tempting (the frontend proxies `/api` same-origin through Vercel rewrites, so Lax would work on printqueen3d.com), but local dev calls the backend cross-port and the deployed frontend previews call the backend project cross-origin directly. Changing SameSite breaks preview-deployment logins. Leave `set_session_cookie` alone.
- **Regex anchoring:** Starlette's `allow_origin_regex` uses `re.fullmatch`-like matching via `compile(...).match` + `fullmatch` semantics differ by version — write the regex WITHOUT `^`/`$` anchors exactly as shown above (Starlette applies `fullmatch`). Test with a curl preflight (see acceptance) rather than assuming.
- **The webhook rejection must come BEFORE parsing the body as JSON**, otherwise a malformed unsigned body would produce a 400 "Invalid payload" that masks the misconfiguration signal in logs.
- `asyncio.sleep` in the login path must be `await`ed inside the async function — a bare `time.sleep(1)` would block the event loop for all concurrent requests.
- The webhook route also uses `require_stripe_key()` — keep it; it's unrelated to signing.

## Acceptance criteria

Local backend running on :8001.

1. **CORS allow:** `curl -s -o /dev/null -w "%{http_code} %header{access-control-allow-origin}\n" -X OPTIONS localhost:8001/api/products -H "Origin: https://printqueen3d2026-frontend-abc123-nandis-projects-cc28225b.vercel.app" -H "Access-Control-Request-Method: GET"` → 200 with the origin echoed back.
2. **CORS deny:** same command with `Origin: https://evil-site.vercel.app` → NO `access-control-allow-origin` header in the response.
3. **Unsigned webhook rejected:** with `STRIPE_WEBHOOK_SECRET` unset in the local `.env` (temporarily), `curl -X POST localhost:8001/api/webhook/stripe -d '{"type":"checkout.session.completed","data":{"object":{"id":"x"}}}' -H "Content-Type: application/json"` → HTTP 400. Restore `.env` after.
4. **Checkout status scoping:** user A cannot read a session id belonging to user B (returns 404); the owner still gets their status.
5. **Login:** wrong password takes ≥1s to return 401; correct password logs in immediately; the site's normal login flow in the browser still works.
6. Full checkout in the browser still completes (proves polling path unaffected).
