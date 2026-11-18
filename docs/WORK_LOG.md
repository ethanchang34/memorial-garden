# Implementation work log

Updated: 2026-11-11

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
2. [x] Garden scene on the memorial page, with the four owner fixes done (PR "Garden fixes"):
   - Path centered on the stone.
   - Full width at 80% of the viewport height (minimum 288px), no frame; the name and years heading stays below. The view is fitted to the screen shape (`features/garden/view.ts`): the stone, vase and candle always stay in view, more sky shows on phones, and more garden shows on wide screens.
   - Tree canopy framing the top (`features/garden/canopy.ts`): seeded boughs, twigs and three depth layers of leaves, each with a lit half, midrib, side veins, and the occasional blemish; on wide screens it parts around the stone.
   - Night keyframe (22:30–04:00, evening 21:00 and again at dawn). Fireflies: evening 5–8, night 12–16 and brighter, counted when the page loads. Each flashes on its own rhythm (some double-flash), drifts while lit, and moves while dark (`Fireflies.tsx`, CSS in `global.css`). Reduced motion: still, dim glow. They avoid the stone face. Dark pauses shortened after owner review (lit 1.3–3 s, dark 0.7–1.6 s).
   - Owner tuning: boughs arc gently from the corners, ~10% fewer leaves, no blurred leaf shadow (it read as a halo), stone wall removed (a proper cat bed comes with the cat).
   - Bushes redrawn (`hedges.ts`): two rows of overlapping rounded clumps, each with a shadow edge, a sunlit rim scaled to the light level, and small leaf-tip flecks; the back row is hazier. Leaves a gap behind the stone. The ground light patches were removed (they weren't tied to the canopy; real dapples can come with lighting polish).
   - Falling leaves at every time of day: 3–4 leaves drift and sway down from the canopy, then reappear elsewhere (`FallingLeaves.tsx`); hidden with reduced motion.
   - One-screen memorial page (DESIGN §6.1): code-drawn keepsakes on the garden edges on desktop (photo stack and framed life story on the left, notes and voice memos on the right) that lift on hover, and a translucent bottom toolbar of the same icons on phones. Each opens a drawer over the garden (`components/ui/drawer.tsx`, on Radix Dialog): a side drawer up to 40% of the width on desktop, a bottom sheet up to 70% of the height on phones. Escape or × closes it and focus returns to the object. Lists page with wide ‹ › arrows (`components/ui/pager.tsx`, 6 per page). Counts and lists are empty until notes, photos and memos exist; the life story drawer shows the name, years and epitaph.
     Still placeholders: the slot system (objects with attachment points), real flowers in the vase, moss.
3. [x] Light a candle (PR #48; migration `20261112000000_candles` applied). Visitors press and hold the candle beside the stone (or hold Space/Enter; a screen-reader click lights at once). Without an account the app first runs Turnstile (only shows a widget if Cloudflare asks), signs in anonymously with the token, and saves the browser time zone; the header still says "Sign in". `light_candle()` allows one candle per visitor per memorial per day (visitor's local day), only on shared memorials; each candle resets the shared 3-day timer, and the cluster grows in soft tiers to 15 with a glow that widens with each candle (`features/garden/candleSlots.ts`, `CandleCluster.tsx`). `candle_state()` gives the lit count, when they go out, and whether you lit one today. CSP allows `https://challenges.cloudflare.com` (script and frame). Reduced motion: flames hold still.
4. [x] Notes (PR #49; migration `20261113000000_notes` applied). The Notes drawer lists notes newest first (6 per page) as paper cards with the author's display name, date and an "edited · date" label; your own notes have a gold tab and "You". Signed-in members write, edit and delete their own notes (up to 2000 characters, shared rules in `packages/shared/src/notes.ts`); signed-out visitors and anonymous candle-lighters see "Sign in to leave a note". The owner can hide and show any note ("Hidden by the family"); hidden notes leave the count and disappear for visitors. Limits enforced in the database: 10 notes an hour, 5 on an account's first day, banned members refused, shared memorials only (or your own draft). Deferred to M2: paper styles, All/Mine toggle, timeline scrubber, reports, Turnstile on notes (needs the API Worker; the Google account and database limits cover the core-loop test), and keeping an anonymous visitor's candles when they sign in with Google (needs Supabase manual identity linking).
5. [x] Cleaning the stone (PR #51; migration `20261114000000_cleanings` applied). Moss, lichen and dirt build up on the stone and the ground at its base, counted from the last cleaning (or from when the memorial was shared): faint after about a week, heaviest at 60 days, never covering the name and dates. The pattern is seeded by the memorial, so each stone looks the same on every visit (`core/weathering.ts`, `features/garden/moss.ts`, `StoneWeathering.tsx`). Visitors tap the stone (or "Clean the stone"), confirm, and a wipe animation clears it. No account needed: the same Turnstile and anonymous sign-in as candles (`core/visitor.ts`). `clean_stone()` allows one cleaning per visitor per memorial per local day, only on shared memorials; `stone_state()` gives when the dirt started and whether you cleaned today. Owners previewing a draft see moss but can't clean yet. On phones the candle hint steps aside while the stone needs cleaning. Reduced motion: no wipe streak.

### Before the core-loop test (owner's order, 2026-11-17)

1. [x] Edit a memorial and write the life story (PR #57; migration `20261117000000_memorial_editing`). Owners get an "Edit memorial" link under the name, which opens `/m/<slug>/edit` with the create form filled in (name, dates with their precision, epitaph). A draft's address follows its name, so fixing a typo before sharing fixes the URL too; a shared memorial keeps its address. The life story drawer shows the story in paragraphs; the owner writes and edits it there (up to 10,000 characters, shared rules in `packages/shared/src/lifeStory.ts`), and an empty story invites them to write one.
2. [x] Share button and link previews:
   - [x] Share button (PR #58): under the name on every shared memorial. On phones (and computers with a system share menu) it opens the share sheet with the name, a short line and the link; otherwise a dialog shows the link with Copy link. Publishing a draft now opens that dialog ("Your garden is shared") instead of a toast.
   - [x] Link previews (PR #59): a Cloudflare Pages Function (`functions/m/[slug].ts`, deployed with the site, no separate Worker) fills the page's title, description and preview image when a shared memorial's link is fetched, e.g. "Rosa Martínez (1932 – 2024)" with the epitaph. It looks the memorial up with the public key (only shared memorials are visible), caches for 5 minutes, and falls back to the plain page on any problem. The image (`apps/web/public/og-garden.jpg`) is one golden-hour garden with a blank stone; redraw it with `OG_IMAGE=1 pnpm exec playwright test e2e/og-image.spec.ts --project desktop` in `apps/web`. Per-memorial images (name on the stone) can come later.
3. [ ] Incense.
4. [ ] Flower extras: Undo, "Flowers from Alex" credit, a message on a flower.
5. [ ] Report button on notes.

### Before building further: core-loop test

Build only the core loop (one memorial page with the garden, a note, lighting a candle, cleaning the stone), make one real memorial, share it with 5–10 people, watch whether they come back, then decide. Read competitor reviews for complaints first.

### Next: slot and object system

Turn the `/dev/art` still life into reusable parts: scene slots, objects with attachment points (vase mouth, candle wick), parts (flowers, flame), four-layer drawing for vessels, scene lighting applied to all of it, then the honeyed orchard keyframes blended by local time.

- Garden gestures are decided (DESIGN §6.3): candle cluster up to 15, 3 vases of 5 with visitor-chosen flower types, incense up to 3, shared refresh per type, one of each per visitor per day, no account for gestures (anonymous sign-in), calico cat by default.
- [x] Vase and flowers (PR #55; migration `20261116000000_flowers` applied): visitors tap the vase, pick a rose, tulip, daisy or poppy, and place it; it grows in at once and sways gently (still with reduced motion). Up to 3 vases of 5, grouped left of the stone (vase 2 appears when vase 1 is full, then vase 3); one flower per visitor per memorial per local day; each flower refreshes the shared 14-day bloom, and the next one after it fades starts a fresh bouquet. No account needed (same anonymous sign-in as candles). Flowers are lit by the time of day (`features/garden/flowers.ts`, `FlowerVases.tsx`). The vase is matte now, with a clay grain. Deferred: Undo toast, a message on a flower, the "Flowers from Alex" credit.
- Sky-inspired candle ritual: hold to light, spreading glow, rising embers (VISUAL_DIRECTION, Sky reference).

### After that

1. Rest of M1 (ROADMAP), starting with the memorial page and garden scene once the visual direction is decided.

Done earlier: cozy UI kit (restyle by changing role tokens in `apps/web/src/styles/global.css` and variants in `components/ui/*`; review at `/dev/ui` or the `ui-screenshots` CI artifact); migration deploy workflow (`.github/workflows/deploy-migrations.yml`; see SETUP.md).

### You

**On your laptop:** done (pull and install, gitleaks hook, Playwright browser with `pnpm test:e2e` passing, `/dev/ui` checked).

**In a browser** (any device):

- [x] Made yourself an admin (`profiles.is_admin = true`).
- [x] Death date: settled as required, but it can be just the year or "Around"; birth date can also be "Not sure".

- [ ] Work through the **Owner testing checklist** below on the live site, especially the core loop: light a candle, write and hide notes, and clean the stone. Tell me anything that looks or feels wrong. Do this before the core-loop test with 5–10 people.
- [ ] Art style: decided during the design deep dive (or share an asset pack or reference site anytime) and recorded in `docs/ASSETS.md`.
- [ ] Shortlist names in `docs/NAMING.md` and run the clearance checks, including a **USPTO trademark search**. Decide by the start of M6, before buying the domain.
- [x] Keep an anonymous visitor's candles when they sign in with Google (DESIGN §6.3). You turned on **Allow manual linking**; a visitor who has lit a candle or cleaned the stone now links Google to the same account (`linkIdentity`) and gets their Google name and photo (migration `20261115000000_linked_identities`). If that Google account already has an account here, the app signs in to it instead.

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
- [ ] The memorial page garden matches your local time of day (morning, day, golden hour, evening, night); refresh after the hour changes.
- [ ] The garden fills the width and most of the screen on your phone and computer, with the path centered on the stone, the tree canopy across the top, and a few leaves falling.
- [ ] In the evening (around 9 pm) a few fireflies blink; late at night (after 10:30 pm) more of them, brighter, blinking and moving between flashes. With Reduce Motion on (phone accessibility settings), they hold still.
- [ ] On a computer, the photos, life story, notes and voice memos objects sit on the garden's left and right edges and lift when you hover over them. Photos, notes and voice memos pull out on a string from that side (items sway and stop when you point at them); the ‹ › arrows move along it. The life story opens a drawer. Escape or × closes either.
- [ ] On a phone, the same four open from the bottom toolbar: one note or photo per screen on the string, swipe or use the arrows to move along; the life story opens as a sheet. Tap a note to read it in full; edit, delete and hide are there.
- [ ] On a shared memorial in a private window: press and hold the candle until the ring fills; a flame appears, the label says "Your candle is lit", and the header still says "Sign in". A quick tap does nothing. Holding again the same day does nothing; the next day you can add another.
- [ ] Notes: signed out, the Notes drawer asks you to sign in; after signing in, write a note with a blank line in it, edit it (shows "edited"), then delete it. On your own memorial, hide a note from a second account and check it disappears in a private window.
- [ ] Light candles from two browsers (or a phone and a computer): the cluster shows both, and the glow spreads.
- [ ] In a private window, holding the candle or confirming "Clean the stone" shows the flame or starts the wipe right away, with no pause.
- [ ] Editing: on your own memorial, tap "Edit memorial" under the name, change the epitaph and save. Open the Life story drawer, write a few paragraphs, save, and check a private window shows them. On a draft, fix the name and see the address change with it.
- [ ] Share: on your phone, tap Share under the name; the share sheet opens with the link. On a computer, Share shows the link and Copy link works.
- [ ] Link preview: text yourself a shared memorial's link (iMessage, WhatsApp, or Slack). The preview shows the name, years, epitaph and a garden picture. A draft's link shows the plain site preview.
- [ ] Flowers: in a private window, tap the vase, pick a flower, and place it; it grows in right away and the header still says "Sign in". The same day the vase says "You placed a flower today". Check it looks right in the morning and at night.
- [ ] Linking: in a private window, light a candle, then Sign in with a Google account that has never used the site. You come back signed in with that Google name, and the candle still shows "Your candle is lit". Doing the same with your usual Google account just signs you in to it.
- [ ] Cleaning: a memorial shared more than a week ago shows moss on the stone (a newer one stays clean until then). In a private window, tap the stone, choose "Clean the stone", and the moss wipes away; the header still says "Sign in". Trying again the same day explains you've already cleaned it today; "Not now" leaves the stone as it is.
- [ ] Locally (`pnpm dev`): `/dev/art` animation (swaying flowers, flickering flame, drifting petal), `/dev/palettes`, `/dev/directions`.

### Reminders

- `pnpm-workspace.yaml` ignores audit advisory GHSA-fc5q-39xc-vjpf (picomatch ReDoS, no patched version yet; only reached through `@sentry/cloudflare` → `vite` at build time, not in the Worker bundle). Remove the `auditConfig` entry once picomatch ships a fix.
- When adding Turnstile, Stripe, or Cloudflare Web Analytics, extend the CSP in `apps/web/public/_headers`.
- R2 (M1) needs a card on file; the $5 billing alert is already set under Notifications.
- At launch, publish the Google OAuth app, add the production domain to Supabase's redirect URLs, and remove `X-Robots-Tag: noindex` from `apps/web/public/_headers` (see the NAMING.md rename checklist).

## Environment notes

- Dependabot skips major `@types/node` updates so types match the Node 22 runtime; bump them together with `.nvmrc` and CI.

- pnpm 11 requires explicit approval for package install scripts. `esbuild`, `lefthook`, and `workerd` are approved in `pnpm-workspace.yaml`. pnpm also rejects packages newer than its minimum release age; pick an older version instead of adding an exception.
- Supabase CLI 3 targets the local database by default; use `--remote` (check `--help`) for the hosted project.
- The local Supabase stack publishes ports on all interfaces by default; SETUP.md explains how to limit Docker to localhost.
- No real credentials or secret values are in the repo.
