# CLAUDE.md

Context for AI coding sessions on this repo.

- Read `docs/DESIGN.md` before making changes. Its decisions log (§2) is settled unless the user says otherwise.
- Work milestone by milestone from `docs/ROADMAP.md`, and check items off when done.
- Provider SDKs (Supabase, Stripe, R2/S3, Cloudflare) may be imported only in `adapters/` folders. `core/` stays pure.
- The coin ledger is append-only. Never write balance logic on the client, and never UPDATE/DELETE `coin_ledger`.
- Every new table gets RLS policies and tests in the same change.
- Secrets go in `.env.local` (gitignored) and never in code.
- Every UI change must work well from 320px phones to large desktop windows (DESIGN §7.1): mobile-first, touch equivalents for every hover, 44px touch targets, no horizontal scroll. Verify at the listed test viewports.
- Respect `prefers-reduced-motion`, and keep everything keyboard-accessible.
