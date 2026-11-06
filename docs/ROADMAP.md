# Roadmap

Each milestone is shippable on its own. Check items off as you go.

**Before each milestone, complete its prerequisites in [SETUP.md](SETUP.md)** (accounts, keys, local tools).

## M0 — Project setup

- [x] pnpm monorepo: `apps/web` (Vite + React + TS + Tailwind), `apps/api` (Hono), `packages/shared`
- [x] ESLint + Prettier + TypeScript strict
- [x] Local Supabase CLI (`pnpm db:start`); first migration (`profiles`) with RLS + pgTAP tests
- [x] Hosted Supabase project (free); `profiles` migration applied with `supabase db push --remote`
- [ ] GitHub Actions workflow that applies new migrations on merge to `main`
- [x] Google OAuth configured in Supabase + Google Cloud console
- [x] Cloudflare Pages connected to the GitHub repo (auto-deploy on push to `main`)
- [x] GitHub Actions CI: format, lint, typecheck, build, unit + DB tests, gitleaks, Semgrep, `pnpm audit`
- [x] Dependabot
- [x] gitleaks pre-commit hook (lefthook, installed by `pnpm install`)
- [ ] GitHub secret scanning + push protection turned on
- [x] Security headers (`_headers` file); Sentry wired in web + api (no-op until a DSN is set)
- [x] Sentry projects created (`web`, `api`)
- [ ] Sentry DSNs set (web: Cloudflare Pages; api: when the Worker is deployed)
- [x] Design tokens (palette, fonts) in the Tailwind theme
- [x] i18next setup: all interface text in `locales/en`; `Intl` date formatting (`packages/shared/src/dates.ts`, `useDateFormat()` in web) for flexible-precision memorial dates, lifespans, and timestamps
- [ ] Install shadcn/ui + Motion + Lucide + Sonner; restyle the base components to the cozy look (DESIGN §7.0)
- [ ] Create `docs/ASSETS.md` (done) (asset source + license log); pick a first art pack or style
- [x] Responsive foundation: Tailwind breakpoints (match DESIGN §7.1), container queries, `can-hover:`/`touch:` variants, safe-area utilities, `dvh`; Playwright mobile + desktop projects with a no-horizontal-scroll and 44px-target check at every test viewport (runs in CI)

## M1 — Memorials (no money)

- [ ] `memorials` (incl. nullable `owner_id`, `visibility`, `kind`, `tradition`), `stone_styles`, `memorial_photos`, `timeline_events` tables + RLS
- [ ] Create-memorial wizard (incl. optional tradition, flexible-precision dates, duplicate-match warning with `pg_trgm`); memorial page = one garden scene with one gravestone
- [ ] Free classic stone style + slot template
- [ ] R2 photo upload through signed URLs (API route); public photos served from a Cloudflare-proxied `media.` custom domain
- [ ] Browse + search by name (memorial cards linking to each garden)
- [ ] Share screen after publishing + Share button (native share sheet on phones)
- [ ] Home page: hero, Find someone, Recently tended, New gardens, How it works, Your gardens
- [ ] Time-of-day lighting (4 looks, smooth transitions, setting to pin a look)
- [ ] Link-preview + SEO Worker for `/m/:slug` (title, description, OG image, structured data), `sitemap.xml`, `robots.txt`
- [ ] Profiles: editable display name (default "First L."); send the browser time zone to `set_time_zone()` after sign-in

## M2 — Notes

- [ ] `notes` table + RLS + rate limit; author edit ("edited" label) + delete
- [ ] Filing-cabinet note stack: hover lift, date tooltip, All/Mine toggle, "mine" tabs
- [ ] Owner hide/unhide; report button
- [ ] Turnstile on submit
- [ ] New-account limits (first 24h)
- [ ] Owner notification bell (`notifications` table, triggers, Realtime or polling)
- [ ] Memory prompts in the note composer (`memory_prompts`, ~30 seeded)

## M3 — Weathering & cleaning

- [ ] `last_cleaned_at`, `cleanings`, `clean_memorial()` function
- [ ] Grime overlay textures + seeded pattern + wipe animation (visible ~day 7, max ~day 60)

## M4 — Coins & decorations

- [ ] `coin_ledger`, `coin_packs`, `payments`, `daily_rewards`, `decoration_types`, `memorial_slots`, `decorations`
- [ ] `claim_daily_reward()` (user's local day, time-zone change limited to once every 7 days), `place_decoration()`, `renew_decoration()` (75%, giver only) with locking + tests
- [ ] Stripe Checkout for packs + webhook (test mode) with idempotency
- [ ] Slot hover/glow, confirm dialog, fill animations, expiry fade
- [ ] Coin balance always in header; pack picker + recent transactions
- [ ] Premium stone styles: `memorial_unlocks`, `unlock_stone_style()`, live preview, 2–3 premium styles
- [ ] Cultural decorations + stone motifs (DESIGN §6.12); free visitation stones

## M5 — Voice memos

- [ ] Recorder UI (MediaRecorder), 60s cap, preview
- [ ] Quota (3 free) + paid extra/extended through coins
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
