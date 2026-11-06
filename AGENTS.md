# AGENTS.md

Context for AI coding sessions on this repo (Codex, Claude Code, and other agents).

## Rules

- Read `docs/DESIGN.md` before making changes. Its decisions log (§2) is settled unless the user says otherwise.
- Work milestone by milestone from `docs/ROADMAP.md`, and check items off when done.
- Provider SDKs (Supabase, Stripe, R2/S3, Cloudflare) may be imported only in `adapters/` folders. `core/` stays pure.
- Follow Clean Architecture boundaries in DESIGN §3.1: dependencies point inward; domain/application code owns policy, ports define external needs, and delivery layers translate requests into use-case calls. Keep coin-balance and other business rules out of UI components.
- The coin ledger is append-only. Never write balance logic on the client, and never UPDATE/DELETE `coin_ledger`.
- Every new table gets RLS policies and pgTAP tests (`supabase/tests/database/`) in the same change.
- Every migration grants API access explicitly (`grant ... to authenticated` / `anon`) for each table and function it adds, and its tests check those grants. The hosted project does not expose new tables automatically, but the local stack does, so a missing grant passes locally and fails in production.
- Never edit a migration that has been applied to a hosted Supabase project; add a new one instead.
- Secrets go in `.env.local` / `.dev.vars` (gitignored) and never in code. CI runs gitleaks, Semgrep, and `pnpm audit`, and they must pass. A gitleaks pre-commit hook also runs locally; never bypass it (`--no-verify`, `LEFTHOOK=0`).
- Render user content as plain text, never as raw HTML. Validate all API input with Zod.
- Every UI change must work well from 320px phones to large desktop windows (DESIGN §7.1): mobile-first, touch equivalents for every hover, 44px touch targets, no horizontal scroll. Verify at the listed test viewports.
- Prefer the approved libraries in DESIGN §7.2 over hand-rolled components or animations. Follow the "rules for adding a library" there, and match the cozy art direction in §7.0.
- One memorial = one page = one garden with one gravestone. Never render multiple graves in one scene.
- Never add loot boxes, ads, or guilt-driven messaging (Tenet 1).
- No hard-coded interface strings: all user-facing text goes through i18next (`apps/web/src/locales/en`).
- Show users by `display_name` only, never their full Google name or email.
- Every admin action writes an `admin_actions` audit row; never UPDATE/DELETE that table.
- Respect `prefers-reduced-motion`, and keep everything keyboard-accessible.
- Dev servers bind to localhost only. Never commit a `0.0.0.0` host.

## Layout

```
apps/web/src/
  app/          app shell, providers, i18n setup
  features/     one folder per feature (home, memorial, notes, ...)
  components/   shared UI (components/ui = shadcn primitives)
  core/         pure domain logic, no framework or provider imports
  adapters/     Supabase and other provider clients
  lib/          small framework-free helpers
  locales/      i18next resources
  styles/       global CSS and theme tokens
apps/api/src/
  index.ts      Worker entry (middleware, Sentry)
  app.ts        route composition, testable without the Worker runtime
  routes/       one file per route group
  adapters/     Stripe, R2, Supabase service clients
packages/shared/src/   Zod schemas and types shared by web and api, one file per topic
supabase/migrations/   SQL migrations
supabase/tests/database/   pgTAP tests
```

Tests sit next to the code they cover (`*.test.ts`).

## Before you finish

Run these from the repository root; all must pass:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm build && pnpm test
pnpm db:start && pnpm db:test   # requires Docker
```

Update `docs/WORK_LOG.md` with the current stopping point.
