# CLAUDE.md

Context for AI coding sessions on this repo.

- Read `docs/DESIGN.md` before making changes. Its decisions log (§2) is settled unless the user says otherwise.
- Work milestone by milestone from `docs/ROADMAP.md`, and check items off when done.
- Provider SDKs (Supabase, Stripe, R2/S3, Cloudflare) may be imported only in `adapters/` folders. `core/` stays pure.
- Follow Clean Architecture boundaries in DESIGN §3.1: dependencies point inward; domain/application code owns policy, ports define external needs, and delivery layers translate requests into use-case calls. Keep coin-balance and other business rules out of UI components.
- The coin ledger is append-only. Never write balance logic on the client, and never UPDATE/DELETE `coin_ledger`.
- Every new table gets RLS policies and tests in the same change.
- Secrets go in `.env.local` (gitignored) and never in code. CI runs gitleaks, Semgrep, and `pnpm audit`, and they must pass.
- Render user content as plain text, never as raw HTML. Validate all API input with Zod.
- Every UI change must work well from 320px phones to large desktop windows (DESIGN §7.1): mobile-first, touch equivalents for every hover, 44px touch targets, no horizontal scroll. Verify at the listed test viewports.
- Prefer the approved libraries in DESIGN §7.2 over hand-rolled components or animations. Follow the "rules for adding a library" there, and match the cozy art direction in §7.0.
- One memorial = one page = one garden with one gravestone. Never render multiple graves in one scene.
- Never add loot boxes, ads, or guilt-driven messaging (Tenet 1).
- No hard-coded interface strings: all user-facing text goes through i18next (`locales/en`).
- Show users by `display_name` only, never their full Google name or email.
- Every admin action writes an `admin_actions` audit row; never UPDATE/DELETE that table.
- Respect `prefers-reduced-motion`, and keep everything keyboard-accessible.
