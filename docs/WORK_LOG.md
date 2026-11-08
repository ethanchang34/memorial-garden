# Implementation work log

Updated: 2026-11-06

## Current stopping point

M0 is nearly done; PRs #7–#11 are merged and `main` is protected (changes go through PRs with passing checks). Hosted accounts exist: Supabase project `qihwhgxpfvwvnuobgfbq` with the `profiles` migration applied, Google OAuth wired into Supabase, Cloudflare Pages deploying `main` to `memorial-garden.pages.dev` (behind Cloudflare Access), and Sentry projects `web` and `api`.

## Done

- pnpm workspace for `apps/web`, `apps/api`, and `packages/shared`.
- Web shell organized as `app/`, `features/`, `components/`, `lib/`, `locales/`, `styles/`; Playwright tests in `apps/web/e2e/`.
- Hono API split into `index.ts` (Worker entry + Sentry), `app.ts` (routes, testable), `routes/`. `pnpm build` bundles the Worker with a Wrangler dry run.
- `profiles` migration with RLS, a `private` schema for internal functions, a safe default display name, and `set_time_zone()` enforcing the 7-day limit. 25 pgTAP tests. Applied to the hosted project; do not edit it.
- Shared Zod schemas (display name, locale, memorial dates) and `Intl` date formatting (`packages/shared/src/dates.ts`, `useDateFormat()` in web), with unit tests.
- Responsive foundation: `can-hover:`/`touch:` variants, safe-area utilities, `dvh`; Playwright checks no horizontal scroll and 44px targets at every DESIGN §7.1 viewport.
- CI: format, lint, typecheck, build, unit, database, and e2e tests, `pnpm audit`; gitleaks; Semgrep pinned and failing on findings. Local gitleaks pre-commit hook (lefthook).
- `AGENTS.md` holds agent rules (CLAUDE.md imports it).
- Env vars follow Supabase's current key names: `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.

## Next steps

### Code (an agent can do these)

1. **shadcn/ui + cozy restyle** (finishes M0).
   - Install shadcn/ui (Radix + Tailwind) with Lucide, Sonner, Vaul, and Motion. Map shadcn's theme variables to the existing `@theme` tokens in `apps/web/src/styles/global.css`; don't add a second palette.
   - Restyle Button, Dialog, Sheet/Drawer (bottom sheet on small screens), Tooltip, and Sonner toasts to DESIGN §7.0: 12–16px radii, soft shadows, warm neutrals, rounded type, slow soft motion, `prefers-reduced-motion` respected, 44px targets.
   - Add a dev-only component preview route and Playwright screenshots at phone and desktop sizes for review.
   - Keep the look in tokens (colors, radii, shadows, fonts in `@theme`) and component variants (`components/ui/*`), not scattered classes, so a later restyle from a reference site is mostly a token change.
2. **Migration deploy workflow**: GitHub Action that runs `supabase db push --remote` when `supabase/migrations/` changes on `main`, plus a manual "Run workflow" button. Needs the GitHub secrets below. Do before M1's first new migration.
3. **Public profile projection** before M1 notes: a view or function that exposes only `id` and `display_name`, so other users' content can show names without reading private profile fields.

### You

**On your laptop** (when you're back):

- [ ] `git pull` and `pnpm install` (picks up the merged PRs and installs the gitleaks pre-commit hook).
- [ ] `gitleaks version` works; if not, `brew install gitleaks`. Commits are blocked without it.
- [ ] Once: `pnpm --filter @memorial-garden/web exec playwright install chromium`, then `pnpm test:e2e` should show 11 passed, 9 skipped.

**In a browser** (any device):

- [ ] Cloudflare Pages → Settings → Variables and Secrets: the publishable key should be named `VITE_SUPABASE_PUBLISHABLE_KEY` (rename it if it still says `VITE_SUPABASE_ANON_KEY`); add `VITE_SENTRY_DSN` (Production only); redeploy. Not urgent: nothing reads these until M1 sign-in.
- [ ] Supabase → Authentication → URL Configuration: add the redirect URL `https://memorial-garden.pages.dev/**`. Needed before M1 sign-in.
- [ ] GitHub → Settings → Advanced Security: turn on **Push protection**, **Dependabot alerts**, and **Dependabot security updates**.
- [ ] GitHub → Settings → Rules → Rulesets → "Require Pull Request": add `e2e` to the required status checks.
- [ ] GitHub → Settings → Secrets and variables → Actions: add `SUPABASE_ACCESS_TOKEN` (supabase.com/dashboard/account/tokens) and `SUPABASE_DB_PASSWORD` for the migration workflow. Optional `production` environment with yourself as required reviewer. Needed before M1's first new migration.
- [ ] Pick a first art style or asset pack and record it in `docs/ASSETS.md` (or share a reference site for the restyle).

Already done: auto-delete merged branches, secret scanning, `main` ruleset (PR required, no force pushes or deletion, `quality`/`database`/`gitleaks`/`semgrep` required).

### Then M1 (memorials)

Start with Google sign-in in the web app and sending the browser time zone to `set_time_zone()`, then the `memorials` tables (ROADMAP M1).

### Reminders

- When adding Turnstile, Stripe, or Cloudflare Web Analytics, extend the CSP in `apps/web/public/_headers`.
- R2 (M1) needs a card on file; the $5 billing alert is already set under Notifications.
- At launch, remove Cloudflare Access from the production site and publish the Google OAuth app.

## Environment notes

- pnpm 11 requires explicit approval for package install scripts. `esbuild`, `lefthook`, and `workerd` are approved in `pnpm-workspace.yaml`. pnpm also rejects packages newer than its minimum release age; pick an older version instead of adding an exception.
- Supabase CLI 3 targets the local database by default; use `--remote` (check `--help`) for the hosted project.
- The local Supabase stack publishes ports on all interfaces by default; SETUP.md explains how to limit Docker to localhost.
- No real credentials or secret values are in the repo.
