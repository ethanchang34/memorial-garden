# Implementation work log

Updated: 2026-11-09

## Current stopping point

M0's code work is done (PRs #7–#14 merged) and the first M1 slice (sign-in and profile) is in review; `main` is protected (changes go through PRs with passing checks). Remaining M0 items are the checklists below. Hosted accounts exist: Supabase project `qihwhgxpfvwvnuobgfbq` with the `profiles` migration applied, Google OAuth wired into Supabase, Cloudflare Pages deploying `main` to `memorial-garden-2ub.pages.dev` (public; `memorial-garden.pages.dev` is someone else's site), and Sentry projects `web` and `api`.

## Done

- pnpm workspace for `apps/web`, `apps/api`, and `packages/shared`.
- Web shell organized as `app/`, `features/`, `components/`, `lib/`, `locales/`, `styles/`; Playwright tests in `apps/web/e2e/`.
- Hono API split into `index.ts` (Worker entry + Sentry), `app.ts` (routes, testable), `routes/`. `pnpm build` bundles the Worker with a Wrangler dry run.
- `profiles` migration with RLS, a `private` schema for internal functions, a safe default display name, and `set_time_zone()` enforcing the 7-day limit. 25 pgTAP tests. Applied to the hosted project; do not edit it.
- Shared Zod schemas (display name, locale, memorial dates) and `Intl` date formatting (`packages/shared/src/dates.ts`, `useDateFormat()` in web), with unit tests.
- Responsive foundation: `can-hover:`/`touch:` variants, safe-area utilities, `dvh`; Playwright checks no horizontal scroll and 44px targets at every DESIGN §7.1 viewport.
- CI: format, lint, typecheck, build, unit, database, and e2e tests, `pnpm audit`; gitleaks; Semgrep pinned and failing on findings. Local gitleaks pre-commit hook (lefthook).
- Cozy shadcn-style UI kit (`components/ui/`: Button, Dialog/bottom sheet, Tooltip, Toaster) themed by role tokens in `styles/global.css`; React Router with a not-found page; `/dev/ui` component preview (dev and test builds only); CI uploads `ui-screenshots`.
- `AGENTS.md` holds agent rules (CLAUDE.md imports it).
- Env vars follow Supabase's current key names: `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.

## Next steps

### Sign in and your profile (PR in review)

Built: Google sign-in/sign-out (sign-out goes to the home page), header account menu (display name only), `/settings/profile` display-name editor with the display-name rules (DESIGN §2), time zone sent after sign-in, and two migrations: `public_display_names(user_ids)` and `display_name_rules` (shared rules enforced by a check constraint), with pgTAP tests. Web code reaches Supabase only through `adapters/supabase` via `useServices()`; Playwright fakes Supabase in `e2e/fixtures.ts`.

After merge (owner):

- [ ] Approve the "Deploy migrations" run (Actions tab → run → **Review deployments**); it applies `20261109000000_public_display_names.sql` and `20261109000100_display_name_rules.sql`.
- [ ] Check the Google accounts you'll test with are under Google Auth Platform → Audience → Test users.
- [ ] Sign in at http://localhost:5173 (`pnpm dev`, with `apps/web/.env.local` holding `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`) and at https://memorial-garden-2ub.pages.dev.
- [ ] Supabase → Table Editor → `profiles`: your row shows "First L." and your time zone.
- [ ] Rename yourself at `/settings/profile`; the header updates.

### After that

1. **Design deep dive** (before the M1 memorial page and garden scene, where art direction gets locked in): study reference sites with Playwright screenshots (memorial sites, cozy games, calm apps), research design principles with sources, write `docs/VISUAL_DIRECTION.md` (references, mood, tokens, layouts per screen size, art route), then update tokens, refresh the home page, and prototype one garden scene for review.
2. Rest of M1 (ROADMAP).

Done earlier: cozy UI kit (restyle by changing role tokens in `apps/web/src/styles/global.css` and variants in `components/ui/*`; review at `/dev/ui` or the `ui-screenshots` CI artifact); migration deploy workflow (`.github/workflows/deploy-migrations.yml`; see SETUP.md).

### You

**On your laptop:** done (pull and install, gitleaks hook, Playwright browser with `pnpm test:e2e` passing, `/dev/ui` checked).

**In a browser** (any device):

- [ ] Art style: decided during the design deep dive (or share an asset pack or reference site anytime) and recorded in `docs/ASSETS.md`.
- [ ] Shortlist names in `docs/NAMING.md` and run the clearance checks, including a **USPTO trademark search**. Decide by the start of M6, before buying the domain.

Already done: Supabase redirect URLs (`http://localhost:5173/**`, `https://memorial-garden-2ub.pages.dev/**`), Cloudflare Pages variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Production and Preview), the `production` environment (main only, required reviewer `ethanchang34`) with `SUPABASE_DB_URL` (verified by a dry run: "Remote database is up to date"), auto-delete merged branches, secret scanning with push protection, Dependabot alerts and security updates, `main` ruleset (PR required, no force pushes or deletion, `quality`/`database`/`e2e`/`gitleaks`/`semgrep` required).

### Reminders

- When adding Turnstile, Stripe, or Cloudflare Web Analytics, extend the CSP in `apps/web/public/_headers`.
- R2 (M1) needs a card on file; the $5 billing alert is already set under Notifications.
- At launch, publish the Google OAuth app, add the production domain to Supabase's redirect URLs, and remove `X-Robots-Tag: noindex` from `apps/web/public/_headers` (see the NAMING.md rename checklist).

## Environment notes

- pnpm 11 requires explicit approval for package install scripts. `esbuild`, `lefthook`, and `workerd` are approved in `pnpm-workspace.yaml`. pnpm also rejects packages newer than its minimum release age; pick an older version instead of adding an exception.
- Supabase CLI 3 targets the local database by default; use `--remote` (check `--help`) for the hosted project.
- The local Supabase stack publishes ports on all interfaces by default; SETUP.md explains how to limit Docker to localhost.
- No real credentials or secret values are in the repo.
