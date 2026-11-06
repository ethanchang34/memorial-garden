# Implementation work log

Updated: 2026-11-06

## Current stopping point

M0 is in progress. Code foundation is merged (PR #7). Hosted accounts exist: Supabase project `qihwhgxpfvwvnuobgfbq` with the `profiles` migration applied, Google OAuth wired into Supabase, Cloudflare Pages deploying `main` to `memorial-garden.pages.dev` (currently behind Cloudflare Access), and Sentry projects `web` and `api`.

## Done

- pnpm workspace for `apps/web`, `apps/api`, and `packages/shared`.
- React/Vite/Tailwind web shell organized as `app/`, `features/`, `components/`, `lib/`, `locales/`, `styles/`.
- Hono API split into `index.ts` (Worker entry + Sentry), `app.ts` (routes, testable), `routes/`. `pnpm build` bundles the Worker with a Wrangler dry run.
- `profiles` migration with RLS, a `private` schema for internal functions, a safe default display name, and `set_time_zone()` enforcing the 7-day limit. 25 pgTAP tests pass via `pnpm db:test`. Applied to the hosted project; do not edit it.
- Shared Zod schemas for display name and locale, matching the database rules, with unit tests.
- CI: format, lint, typecheck, build, unit tests, database tests, `pnpm audit`; gitleaks; Semgrep pinned and failing on findings.
- `AGENTS.md` holds agent rules (CLAUDE.md imports it).
- Env vars follow Supabase's current key names: `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.

## Next work

1. GitHub settings: secret scanning + push protection; branch protection on `main` requiring the CI checks.
2. Workflow that applies new migrations on merge (secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` in GitHub; optional `production` environment with required reviewer).
3. ~~Gitleaks pre-commit hook~~ (done).
4. ~~Playwright mobile/desktop projects and the responsive foundation~~ (done).
5. shadcn/ui + Motion + Lucide + Sonner, restyled. (`Intl` date formatting done.)
6. Choose and record the first licensed art pack/style.
7. Before M1 notes, add a safe public profile projection so content can show `display_name` without exposing private profile fields.
8. When adding Turnstile, Stripe, or Cloudflare Web Analytics, extend the CSP in `apps/web/public/_headers`.
9. At launch, remove Cloudflare Access from the production site.

## Environment notes

- pnpm 11 requires explicit approval for package install scripts. Only `esbuild` and `workerd` are approved in `pnpm-workspace.yaml`.
- Supabase CLI 3 targets the local database by default; use `--remote` (check `--help`) for the hosted project.
- The local Supabase stack publishes ports on all interfaces by default; SETUP.md explains how to limit Docker to localhost.
- No real credentials or secret values are in the repo.
