# Roadmap

Each milestone is shippable on its own. Check items off as you go.

**Before each milestone, complete its prerequisites in [SETUP.md](SETUP.md)** (accounts, keys, local tools).

## M0 — Project setup
- [ ] pnpm monorepo: `apps/web` (Vite + React + TS + Tailwind), `apps/api` (Hono), `packages/shared`
- [ ] ESLint + Prettier + TypeScript strict
- [ ] Supabase project (free) + local Supabase CLI; first migration (`profiles`)
- [ ] Google OAuth configured in Supabase + Google Cloud console
- [ ] Cloudflare Pages connected to the GitHub repo (auto-deploy on push to `main`)
- [ ] GitHub Actions CI: lint, typecheck, test
- [ ] Design tokens (palette, fonts) in Tailwind config
- [ ] Install shadcn/ui + Motion + Lucide + Sonner; restyle the base components to the cozy look (DESIGN §7.0)
- [ ] Create `docs/ASSETS.md` (asset source + license log); pick a first art pack or style
- [ ] Responsive foundation: breakpoints, container queries, `hover`/`pointer` media utilities, Playwright mobile + desktop projects

## M1 — Memorials (no money)
- [ ] `memorials` (incl. nullable `owner_id`, `visibility`, `kind`, `tradition`), `stone_styles`, `memorial_photos`, `timeline_events` tables + RLS
- [ ] Create-memorial wizard (incl. optional tradition); memorial page = one garden scene with one gravestone
- [ ] Free classic stone style + slot template
- [ ] R2 photo upload through signed URLs (API route)
- [ ] Browse + search by name (memorial cards linking to each garden)
- [ ] Link-preview (OG tags) function for `/m/:slug`

## M2 — Notes
- [ ] `notes` table + RLS + rate limit
- [ ] Filing-cabinet note stack: hover lift, date tooltip, All/Mine toggle, "mine" tabs
- [ ] Owner hide/unhide; report button
- [ ] Turnstile on submit
- [ ] Memory prompts in the note composer (`memory_prompts`, ~30 seeded)

## M3 — Weathering & cleaning
- [ ] `last_cleaned_at`, `cleanings`, `clean_memorial()` function
- [ ] Grime overlay textures + seeded pattern + wipe animation (visible ~day 7, max ~day 60)

## M4 — Coins & decorations
- [ ] `coin_ledger`, `coin_packs`, `payments`, `daily_rewards`, `decoration_types`, `memorial_slots`, `decorations`
- [ ] `claim_daily_reward()`, `place_decoration()`, `renew_decoration()` (75%, giver only) with locking + tests
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
- [ ] Admin report queue (incl. ownership requests for orphaned memorials)
- [ ] Account deletion: orphan memorials (`owner_id` → NULL)
- [ ] Terms of Service, Privacy Policy, takedown form
- [ ] Weekly DB backup Action
- [ ] Domain + Stripe live mode
- [ ] Accessibility pass (keyboard, contrast, reduced motion)
- [ ] Tradition review with people from each tradition (DESIGN §6.12)
- [ ] Responsive pass on real devices (iOS Safari, Android Chrome) + all test viewports in DESIGN §7.1

## Later
- Family caretakers + invite links + automatic owner handoff (DESIGN §6.13)
- Follow + anniversary/birthday reminder emails (pick an email provider)
- Pet memorials + `/pets` section
- Private/invite-only memorials (`visibility` column already exists), ownership transfer
- Evening (dark) theme, seasonal decorations
- Email notifications ("Someone left flowers for Grandma")
- Speech-to-text captions for voice memos
