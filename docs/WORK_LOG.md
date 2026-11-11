# Implementation work log

Updated: 2026-11-10

## Current stopping point

M0's code work is done and the first M1 slice (sign-in and profile) is live; the design deep dive is in review; `main` is protected (changes go through PRs with passing checks). Remaining M0 items are the checklists below. Hosted accounts exist: Supabase project `qihwhgxpfvwvnuobgfbq` with the `profiles` migration applied, Google OAuth wired into Supabase, Cloudflare Pages deploying `main` to `memorial-garden-2ub.pages.dev` (public; `memorial-garden.pages.dev` is someone else's site), and Sentry projects `web` and `api`.

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

### Done: sign in and your profile

Google sign-in/sign-out (sign-out goes home without flashing the old page), header account menu (display name only), `/settings/profile`, display-name rules in shared code and the database, time zone sent after sign-in, `public_display_names(user_ids)`. Both migrations are applied to the hosted project. Web code reaches Supabase only through `adapters/supabase` via `useServices()`; Playwright fakes Supabase in `e2e/fixtures.ts`.

### Done: visual direction

Layered paper garden with composable objects; honeyed orchard palette; time of day computed at page load and blended between keyframes; code-drawn SVG art (animals from a pack or AI-assisted vectors); moss only on and around the memorial stone. Recorded in DESIGN §2, §6.3, §6.4, §7.0, §7.2 and `docs/VISUAL_DIRECTION.md`. Dev previews: `/dev/directions`, `/dev/palettes`, `/dev/art` (dev and test builds only).

### Decided (pending test): monetization

Build free, pay once to share ($20 to start, test $29); visitors never pay; no coins. See `docs/MONETIZATION.md` (model, competitor pricing, cost model, data-model changes). DESIGN coin sections are marked superseded; ROADMAP M4 rewritten. Confirm price and willingness to pay in the core-loop test. After that, plan funeral-home outreach with a capped free-share pilot (MONETIZATION.md, Outreach); the cap is to be decided together.

### Core loop progress

1. [x] Memorials: drafts, create form, memorial page, Your gardens (PR #29; migration applied). Publishing is admin-only until checkout.
2. [x] Garden scene on the memorial page: honeyed orchard blended by local time at page load (`core/timeOfDay.ts`, `features/garden/`), name and years engraved on the stone, empty vase and unlit candle. Still placeholders: the slot system (objects with attachment points), real flowers in the vase, moss.
3. [ ] Light a candle (anonymous sign-in + Turnstile; owner prep: enable anonymous sign-ins in Supabase, create a Turnstile site).
4. [ ] Notes.
5. [ ] Cleaning the stone.

### Before building further: core-loop test

Build only the core loop (one memorial page with the garden, a note, lighting a candle, cleaning the stone), make one real memorial, share it with 5–10 people, watch whether they come back, then decide. Read competitor reviews for complaints first.

### Next: slot and object system

Turn the `/dev/art` still life into reusable parts: scene slots, objects with attachment points (vase mouth, candle wick), parts (flowers, flame), four-layer drawing for vessels, scene lighting applied to all of it, then the honeyed orchard keyframes blended by local time.

- Garden gestures are decided (DESIGN §6.3): candle cluster up to 15, 3 vases of 5 with visitor-chosen flower types, incense up to 3, shared refresh per type, one of each per visitor per day, no account for gestures (anonymous sign-in), calico cat by default.
- Make the vase matte (owner feedback: too shiny).
- Sky-inspired candle ritual: hold to light, spreading glow, rising embers (VISUAL_DIRECTION, Sky reference).

### After that

1. Rest of M1 (ROADMAP), starting with the memorial page and garden scene once the visual direction is decided.

Done earlier: cozy UI kit (restyle by changing role tokens in `apps/web/src/styles/global.css` and variants in `components/ui/*`; review at `/dev/ui` or the `ui-screenshots` CI artifact); migration deploy workflow (`.github/workflows/deploy-migrations.yml`; see SETUP.md).

### You

**On your laptop:** done (pull and install, gitleaks hook, Playwright browser with `pnpm test:e2e` passing, `/dev/ui` checked).

**In a browser** (any device):

- [x] Made yourself an admin (`profiles.is_admin = true`).
- [x] Death date: settled as required, but it can be just the year or "Around"; birth date can also be "Not sure".

- [ ] Art style: decided during the design deep dive (or share an asset pack or reference site anytime) and recorded in `docs/ASSETS.md`.
- [ ] Shortlist names in `docs/NAMING.md` and run the clearance checks, including a **USPTO trademark search**. Decide by the start of M6, before buying the domain.

Already done: Supabase redirect URLs (`http://localhost:5173/**`, `https://memorial-garden-2ub.pages.dev/**`), Cloudflare Pages variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Production and Preview), the `production` environment (main only, required reviewer `ethanchang34`) with `SUPABASE_DB_URL` (verified by a dry run: "Remote database is up to date"), auto-delete merged branches, secret scanning with push protection, Dependabot alerts and security updates, `main` ruleset (PR required, no force pushes or deletion, `quality`/`database`/`e2e`/`gitleaks`/`semgrep` required).

### Owner testing checklist (test when convenient; building continues meanwhile)

On https://memorial-garden-2ub.pages.dev unless noted:

- [ ] Sign in with Google; the header shows your display name (no photo).
- [ ] Profile settings: rejected names (`Free $$$`, `Admin`, an emoji) show the right message; a valid name saves and the header updates.
- [ ] Sign out from Profile settings lands on the home page with no flash of the settings page.
- [ ] Create a memorial from the home page: try Year, Around, and Not sure; the stone shows e.g. "1932 – 2024" or "c. 1890 – 1952".
- [ ] A third draft is refused with the 2-draft message.
- [ ] Your gardens (account menu) lists drafts; "Share this garden" publishes (you are admin).
- [ ] Open a shared memorial in a private window (signed out): it shows without the draft notice or Share button; a draft's link shows "This path leads nowhere".
- [ ] On a phone: the form and memorial page fit without sideways scrolling.
- [ ] The memorial page garden matches your local time of day (morning, day, golden hour, evening); refresh after the hour changes.
- [ ] Locally (`pnpm dev`): `/dev/art` animation (swaying flowers, flickering flame, drifting petal), `/dev/palettes`, `/dev/directions`.

### Reminders

- When adding Turnstile, Stripe, or Cloudflare Web Analytics, extend the CSP in `apps/web/public/_headers`.
- R2 (M1) needs a card on file; the $5 billing alert is already set under Notifications.
- At launch, publish the Google OAuth app, add the production domain to Supabase's redirect URLs, and remove `X-Robots-Tag: noindex` from `apps/web/public/_headers` (see the NAMING.md rename checklist).

## Environment notes

- pnpm 11 requires explicit approval for package install scripts. `esbuild`, `lefthook`, and `workerd` are approved in `pnpm-workspace.yaml`. pnpm also rejects packages newer than its minimum release age; pick an older version instead of adding an exception.
- Supabase CLI 3 targets the local database by default; use `--remote` (check `--help`) for the hosted project.
- The local Supabase stack publishes ports on all interfaces by default; SETUP.md explains how to limit Docker to localhost.
- No real credentials or secret values are in the repo.
