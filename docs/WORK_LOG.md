# Implementation work log

Updated: 2026-11-06

## Current stopping point

M0's code work is done (PRs #7–#14 merged); `main` is protected (changes go through PRs with passing checks). Remaining M0 items are the checklists below. Hosted accounts exist: Supabase project `qihwhgxpfvwvnuobgfbq` with the `profiles` migration applied, Google OAuth wired into Supabase, Cloudflare Pages deploying `main` to `memorial-garden-2ub.pages.dev` (public; `memorial-garden.pages.dev` is someone else's site), and Sentry projects `web` and `api`.

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

### Code (an agent can do these)

1. ~~shadcn/ui + cozy restyle~~ (done). To restyle from a reference site, change the role tokens in `apps/web/src/styles/global.css` and the variants in `components/ui/*`; review at `/dev/ui` or the `ui-screenshots` CI artifact.
2. ~~Migration deploy workflow~~ (done): `.github/workflows/deploy-migrations.yml`, approval-gated in the `production` environment; see SETUP.md.
3. **Public profile projection** before M1 notes: a view or function that exposes only `id` and `display_name`, so other users' content can show names without reading private profile fields.

### You

**On your laptop:** done (pull and install, gitleaks hook, Playwright browser with `pnpm test:e2e` passing, `/dev/ui` checked).

**In a browser** (any device):

- [ ] Cloudflare Pages → Settings → Variables and Secrets: the publishable key should be named `VITE_SUPABASE_PUBLISHABLE_KEY` (rename it if it still says `VITE_SUPABASE_ANON_KEY`); add `VITE_SENTRY_DSN` (Production only); redeploy. Not urgent: nothing reads these until M1 sign-in.
- [ ] Pick a first art style or asset pack and record it in `docs/ASSETS.md` (or share a reference site for the restyle).

Already done: Supabase redirect URLs (`http://localhost:5173/**`, `https://memorial-garden-2ub.pages.dev/**`), the `production` environment with `SUPABASE_DB_URL`, auto-delete merged branches, secret scanning with push protection, Dependabot alerts and security updates, `main` ruleset (PR required, no force pushes or deletion, `quality`/`database`/`e2e`/`gitleaks`/`semgrep` required).

### Then M1 (memorials)

Start with Google sign-in in the web app and sending the browser time zone to `set_time_zone()`, then the `memorials` tables (ROADMAP M1).

### Reminders

- When adding Turnstile, Stripe, or Cloudflare Web Analytics, extend the CSP in `apps/web/public/_headers`.
- R2 (M1) needs a card on file; the $5 billing alert is already set under Notifications.
- At launch, publish the Google OAuth app and add the production domain to Supabase's redirect URLs.

## Environment notes

- pnpm 11 requires explicit approval for package install scripts. `esbuild`, `lefthook`, and `workerd` are approved in `pnpm-workspace.yaml`. pnpm also rejects packages newer than its minimum release age; pick an older version instead of adding an exception.
- Supabase CLI 3 targets the local database by default; use `--remote` (check `--help`) for the hosted project.
- The local Supabase stack publishes ports on all interfaces by default; SETUP.md explains how to limit Docker to localhost.
- No real credentials or secret values are in the repo.
