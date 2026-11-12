# Roadmap

Each milestone is shippable on its own. Check items off as you go.

**Before each milestone, complete its prerequisites in [SETUP.md](SETUP.md)** (accounts, keys, local tools).

## M0 — Project setup

- [x] pnpm monorepo: `apps/web` (Vite + React + TS + Tailwind), `apps/api` (Hono), `packages/shared`
- [x] ESLint + Prettier + TypeScript strict
- [x] Local Supabase CLI (`pnpm db:start`); first migration (`profiles`) with RLS + pgTAP tests
- [x] Hosted Supabase project (free); `profiles` migration applied with `supabase db push --remote`
- [x] GitHub Actions workflow that applies new migrations on merge to `main` (approval-gated `production` environment)
- [x] Google OAuth configured in Supabase + Google Cloud console
- [x] Cloudflare Pages connected to the GitHub repo (auto-deploy on push to `main`)
- [x] GitHub Actions CI: format, lint, typecheck, build, unit + DB tests, gitleaks, Semgrep, `pnpm audit`
- [x] Dependabot
- [x] gitleaks pre-commit hook (lefthook, installed by `pnpm install`)
- [x] GitHub secret scanning + push protection, Dependabot alerts; `main` ruleset requiring PRs and all CI checks
- [x] Security headers (`_headers` file); Sentry wired in web + api (no-op until a DSN is set)
- [x] Sentry projects created (`web`, `api`)
- [ ] Sentry DSNs set (web: Cloudflare Pages; api: when the Worker is deployed)
- [x] Design tokens (palette, fonts) in the Tailwind theme
- [x] i18next setup: all interface text in `locales/en`; `Intl` date formatting (`packages/shared/src/dates.ts`, `useDateFormat()` in web) for flexible-precision memorial dates, lifespans, and timestamps
- [x] shadcn/ui-style components (Button, Dialog/bottom sheet, Tooltip, Toaster) + Motion + Lucide + Sonner, restyled to the cozy look (DESIGN §7.0); `/dev/ui` preview; React Router with a not-found page
- [x] Create `docs/ASSETS.md` (asset source + license log)
- [ ] Pick a first art pack or style and record it in `docs/ASSETS.md`
- [x] Responsive foundation: Tailwind breakpoints (match DESIGN §7.1), container queries, `can-hover:`/`touch:` variants, safe-area utilities, `dvh`; Playwright mobile + desktop projects with a no-horizontal-scroll and 44px-target check at every test viewport (runs in CI)

## M1 — Memorials (no money)

- [x] `memorials` table with drafts (2 per owner), slugs, flexible-precision dates, RLS + pgTAP; `publish_memorial()` (admin-only until the share checkout exists)
- [x] Create-memorial form (name, dates with precision, epitaph), memorial page `/m/:slug`, Your gardens `/memorials`
- [ ] `stone_styles`, `memorial_photos`, `timeline_events`; `tradition` on memorials
- [ ] Create-memorial wizard (incl. optional tradition, flexible-precision dates, duplicate-match warning with `pg_trgm`); memorial page = one garden scene with one gravestone
- [ ] Free classic stone style + slot template
- [ ] R2 photo upload through signed URLs (API route); public photos served from a Cloudflare-proxied `media.` custom domain
- [ ] Browse + search by name (memorial cards linking to each garden)
- [ ] Share screen after publishing + Share button (native share sheet on phones)
- [ ] Home page: hero, Find someone, Recently tended, New gardens, How it works, Your gardens
- [x] Time-of-day lighting: honeyed orchard keyframes (morning, day, golden hour, evening, night) blended by local time at page load
- [ ] Setting to pin a time-of-day look
- [ ] Slot and object system: scene slots, objects with attachment points, parts; code-drawn vase, flowers, and candle as the first objects
- [ ] Link-preview + SEO Worker for `/m/:slug` (title, description, OG image, structured data), `sitemap.xml`, `robots.txt`
- [x] Sign in with Google / sign out; account menu with display name only
- [x] Profiles: editable display name (default "First L.") at `/settings/profile`; browser time zone sent to `set_time_zone()` after sign-in; `public_display_names()` for showing other users' names

## M2 — Notes

- [ ] `notes` table + RLS + rate limit; author edit ("edited" label) + delete
- [ ] Filing-cabinet note stack: hover lift, date tooltip, All/Mine toggle, "mine" tabs
- [ ] Owner hide/unhide; report button (notes and display names)
- [ ] Display name change limit (5/day per user) enforced in the database, with pgTAP tests
- [ ] Turnstile on submit
- [ ] New-account limits (first 24h)
- [ ] Owner notification bell (`notifications` table, triggers, Realtime or polling)
- [ ] Memory prompts in the note composer (`memory_prompts`, ~30 seeded)

## M3 — Weathering & cleaning

- [ ] `last_cleaned_at`, `cleanings`, `clean_memorial()` function
- [ ] Grime overlay textures + seeded pattern + wipe animation (visible ~day 7, max ~day 60)

## M4 — Decorations & sharing checkout

Model: [MONETIZATION.md](MONETIZATION.md) (no coins).

- [ ] `decoration_types`, `memorial_slots`, `decorations` (candle cluster to 15, 3 vases of 5, incense to 3; shared expiry per type) + RLS + pgTAP
- [ ] Placing sheet: live preview, flower type choice, Undo toast; press-and-hold candles; 1 per visitor per memorial per day enforced in the database
- [ ] Anonymous gestures: Supabase anonymous sign-in behind Turnstile, per-network caps, conversion to a real account keeps credit
- [ ] Cat bed: calico default, coat patterns chosen by the owner
- [ ] Drafts: `memorials.status = draft` (owner-only), draft caps
- [ ] Share checkout: Stripe Checkout per memorial + verified, idempotent webhook (`memorial_purchases`, `payments.kind = memorial_share`); publish on payment; 14-day refund unpublishes only on request or chargeback
- [ ] Hardship codes (hashed, admin-issued, single use)
- [ ] Price shown before building ("Building is free; sharing is a one-time $20")
- [ ] Premium stone styles and scenes, included in the fee; live preview
- [ ] Cultural decorations + stone motifs (DESIGN §6.12); free visitation stones

## M5 — Voice memos

- [ ] Recorder UI (MediaRecorder), 60s cap, preview
- [ ] Quota (3 per visitor per memorial) + per-memorial cap
- [ ] Signed R2 upload/playback; owner hide
- [ ] Download button for memo author + memorial owner only

## M6 — Donations, moderation, launch prep

- [ ] Donation checkout
- [ ] Admin (behind Cloudflare Access): report queue (incl. ownership requests), user lookup + suspend/ban/coin adjust, payments + refunds, catalog editor, support inbox, stats dashboard
- [ ] `admin_actions` audit log (append-only) for every admin action
- [ ] Contact form (`support_requests` + Cloudflare Email Workers forwarding) + Help/FAQ page
- [ ] 4–6 guides under `/guides` (MDX)
- [ ] Account deletion: orphan memorials (`owner_id` → NULL)
- [ ] Terms of Service, Privacy Policy, DMCA/takedown page (DESIGN §8.7–8.8); lawyer review
- [ ] Register a DMCA designated agent (US Copyright Office)
- [ ] Turn on Cloudflare CSAM Scanning Tool + write the NCMEC reporting procedure
- [ ] Cloudflare WAF managed rules, rate limiting rule, Bot Fight Mode
- [ ] Supabase security advisor: zero errors
- [ ] Cloudflare Web Analytics
- [ ] `docs/INCIDENT.md` incident plan
- [ ] Check employer outside-activities policy
- [ ] Weekly DB backup Action (keep 8) + first practice restore
- [ ] Final name + domain decided and cleared ([NAMING.md](NAMING.md)), including a USPTO trademark search; rename checklist done; `noindex` header removed
- [ ] Domain + Stripe live mode
- [ ] Accessibility pass (keyboard, contrast, reduced motion)
- [ ] Tradition review with people from each tradition (DESIGN §6.12)
- [ ] Responsive pass on real devices (iOS Safari, Android Chrome) + all test viewports in DESIGN §7.1

## Later

- Family caretakers + invite links + automatic owner handoff (DESIGN §6.13)
- Follow + anniversary/birthday reminder emails (pick an email provider)
- Pet memorials + `/pets` section
- Private/invite-only memorials (`visibility` column already exists), ownership transfer
- Ambient sound (birdsong, wind) + sound effects, off by default
- Weekly email digest for owners
- Evening (dark) theme, seasonal decorations
- Email notifications ("Someone left flowers for Grandma")
- Speech-to-text captions for voice memos
