# Print Queen 3D — Work Plans

Execute in this order. Each plan is self-contained: goal, exact files, steps, edge cases, and acceptance criteria. Run one plan per session, review with `git diff`, then push to GitHub to deploy.

| Order | Plan | What it fixes |
|-------|------|---------------|
| 1 | [PLAN-checkout-price-verification.md](PLAN-checkout-price-verification.md) | Server verifies prices before Stripe charges (blocks price tampering) |
| 2 | [PLAN-security-hardening.md](PLAN-security-hardening.md) | CORS lockdown, reject unsigned Stripe webhooks, login throttle |
| 3 | [PLAN-admin-content-integrity.md](PLAN-admin-content-integrity.md) | Admin editor becomes the single source of truth (removes silent content overrides) |
| 4 | [PLAN-performance-caching-indexes.md](PLAN-performance-caching-indexes.md) | MongoDB indexes, site-config caching, search debounce |
| 5 | [PLAN-dead-code-cleanup.md](PLAN-dead-code-cleanup.md) | Remove dead pages, orphan UI components, unused npm packages |
