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
