# Implementation work log

Updated: 2026-11-05

## Current stopping point

M0 is in progress. Branch `fix/m0-setup-review` fixes issues found reviewing the M0 scaffold (`94d884f`). No hosted accounts (Supabase, Google, Cloudflare, Sentry) exist yet.

## Done

- pnpm workspace for `apps/web`, `apps/api`, and `packages/shared`.
- React/Vite/Tailwind web shell organized as `app/`, `features/`, `components/`, `lib/`, `locales/`, `styles/`.
- Hono API split into `index.ts` (Worker entry + Sentry), `app.ts` (routes, testable), `routes/`. The Worker now bundles (`pnpm build` runs a Wrangler dry run); it previously failed because `@sentry/cloudflare` was missing.
- `profiles` migration with RLS, a `private` schema for internal functions, a safe default display name, and `set_time_zone()` enforcing the 7-day limit. 25 pgTAP tests pass via `pnpm db:test`.
- Shared Zod schemas for display name and locale, matching the database rules, with unit tests.
- CI: format, lint, typecheck, build, unit tests, database tests, `pnpm audit`; gitleaks; Semgrep pinned and failing on findings.
- `AGENTS.md` holds agent rules (CLAUDE.md imports it).

## Next work

1. Merge the open Dependabot PRs, then rebase this branch on `main` and regenerate the lockfile.
2. Gitleaks pre-commit hook; turn on GitHub secret scanning and push protection.
3. Account setup from `SETUP.md`: Supabase project, Google OAuth, Cloudflare Pages, Sentry.
4. Playwright mobile/desktop projects and the responsive foundation.
5. Choose and record the first licensed art pack/style.
6. Before M1 notes, add a safe public profile projection so content can show `display_name` without exposing private profile fields.
7. When adding Turnstile, Stripe, or Cloudflare Web Analytics, extend the CSP in `apps/web/public/_headers`.

## Environment notes

- pnpm 11 requires explicit approval for package install scripts. Only `esbuild` and `workerd` are approved in `pnpm-workspace.yaml`.
- The local Supabase stack publishes ports on all interfaces by default; SETUP.md explains how to limit Docker to localhost.
- No real credentials or secret values are in the repo.
