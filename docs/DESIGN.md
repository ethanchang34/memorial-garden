# Memorial Garden — Design Doc

> Working name. Rename freely. Status: **Draft v2** (2026-11-03, open questions resolved)

## 1. Overview

An online cemetery where anyone can create a memorial for someone who has died, and visitors can leave notes and voice memos and place decorations (flowers, candles, incense, lights) at the gravestone. Visitors keep the stone clean of the moss and grime that slowly builds up on it. The site is free to use. Revenue comes from **coins**, an in-site currency that buys decorations and extra voice memos, and from **donations** to the site.

### Goals
- A calm, beautiful, light and neutral interface that works well on phones.
- Grieving is always free: creating memorials, writing notes, visiting, and cleaning cost nothing.
- Paid items are optional *gestures*, never pressure.
- Easy to extend: new decoration types, themes, and features without rewrites.
- Portable: changing hosting providers means swapping adapters, not rewriting the app.
- About $1/month to run at launch (just the domain).

### Non-goals (v1)
- Native mobile apps.
- Payouts to families (Stripe Connect).
- Private, invite-only memorials (possible later; see §12).
- Proof-of-death verification.

---

## 2. Decisions log

| Topic | Decision |
|---|---|
| Daily coin | Visiting any memorial **earns** 1 coin, once per user per day (UTC). |
| Donations | Go to **the site** (a Stripe Checkout tip jar). No donations to families in v1. |
| Weathering | Purely cosmetic. **Anyone can clean for free**, once per user per memorial per day. |
| Moderation | Notes and memos are **public immediately**. The owner can hide them, anyone can report, and reports go to an admin queue. |
| Decoration lifetime | Decorations **fade**: when they expire, the slot is empty again. |
| Slot sharing | **One decoration per slot**, credited to the giver ("Flowers from Alex · Nov 3"). |
| Memorial creation | Any signed-in user. Limited memorials per account, plus reporting. |
| Sign-in | **Google only** (through Supabase Auth). |
| Voice memos | **3 free** memos per user per memorial, up to **60s** each. Extra memos, or memos up to **3 min**, cost coins. |
| Payments | **Stripe**, selling coin packs (no single-coin purchases). |
| Hosting | **Cloudflare Pages** (static site) + Supabase + Cloudflare R2 + a small amount of Hono server code. Vercel rejected (see §9). |
| Portability | Provider code is isolated in `src/adapters/`. |
| Name | **Memorial Garden** (working name is final for now). Domain TBD. |
| Weathering speed | Moss is **visible after about 1 week** uncleaned and reaches **maximum grime at about 60 days**. |
| Decoration renewal | The giver can **renew before it fades at 75% of the price**. This resets the timer to the full lifetime and keeps the slot. |
| Owner perks | **None.** Owners pay the same as everyone else. |
| Orphaned memorials | If the owner deletes their account, the memorial **stays up without an owner**, and an admin can reassign it to a family member who asks. |
| Decoration prices | Initial values in §5 are accepted. They're stored in the database, so they can be tuned after launch. |
| Voice memo downloads | **The memo's author and the memorial owner** can download. Everyone else can only play. |
| Coin balance UI | **Always visible in the header** when signed in. Clicking it opens the pack picker. |
| Private memorials | **After launch.** The `memorials.visibility` column ships in v1 (always `public`). |

---

## 3. Architecture

```
            ┌───────────────────────────────┐
 Browser ──▶│ Cloudflare Pages (static SPA) │  React + Vite + TS + Tailwind
            └──────────────┬────────────────┘
                           │ supabase-js (anon key + user JWT)
          ┌────────────────┼──────────────────────────────┐
          ▼                ▼                              ▼
   Supabase Auth     Supabase Postgres              Server functions (Hono)
   (Google OAuth)    tables + RLS + SQL funcs       - Stripe checkout + webhook
                     (coin ledger, decorations)     - R2 signed upload/download URLs
                                                    - OG/link-preview meta for /m/:slug
                                                          │
                                                          ▼
                                                   Cloudflare R2 (S3 API)
                                                   photos, voice memos
```

### Stack
| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query | Static output, free hosting, suits a highly interactive UI |
| Animation | Framer Motion | Note lift on hover, decoration fills |
| DB / Auth | Supabase (Postgres, RLS, Auth) | Free tier, plain Postgres underneath |
| Server code | Hono (TypeScript) on Cloudflare Workers / Pages Functions | Runs unchanged on Workers, Deno, Node, Bun, Lambda |
| Storage | Cloudflare R2 | Free up to 10GB, no download fees, S3-compatible |
| Payments | Stripe Checkout + webhooks | Cheapest card processing, hosted checkout (no card data touches us) |
| Bot protection | Cloudflare Turnstile | Free CAPTCHA on note/memo/report submissions |
| Testing | Vitest (unit), Playwright (e2e), pgTAP or SQL tests (RLS + functions) | |

### Portability (adapters)
App code imports only from `src/core/` and from the interfaces below. Each provider gets one adapter file.

```ts
// src/adapters/types.ts
interface AuthProvider {
  getUser(): Promise<User | null>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  onChange(cb: (u: User | null) => void): () => void;
}
interface StorageProvider {          // implemented server-side (needs secrets)
  createUploadUrl(key: string, contentType: string, maxBytes: number): Promise<string>;
  createDownloadUrl(key: string, ttlSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}
interface PaymentProvider {          // server-side
  createCoinCheckout(userId: string, packId: string): Promise<{ url: string }>;
  createDonationCheckout(amountCents: number, userId?: string): Promise<{ url: string }>;
  verifyWebhook(req: Request): Promise<PaymentEvent>; // throws if signature is invalid
}
```

Rules:
- Secrets and endpoints live in environment variables only (`.env.local`, never committed).
- The database schema lives in `supabase/migrations/*.sql` (version-controlled and reproducible on any Postgres).
- `src/core/` (coin math, weathering math, decoration expiry) imports **no** provider SDKs, so it's pure and unit-testable.

### Repo layout (planned)
```
/
├─ apps/web/                 React SPA
│  └─ src/{core,adapters,features,components,styles}
├─ apps/api/                 Hono server functions
│  └─ src/{routes,adapters}
├─ supabase/migrations/      SQL: tables, RLS, functions
├─ packages/shared/          shared types + zod schemas
└─ docs/
```
(Use pnpm workspaces.)

---

## 4. Data model

All IDs are `uuid`, all timestamps are `timestamptz`. ⚑ = written only by SECURITY DEFINER functions or the server, never directly by clients.

```sql
profiles            (id = auth.users.id, display_name, avatar_url, is_admin bool, created_at)

memorials           (id, owner_id → profiles NULL ON DELETE SET NULL, slug unique, full_name,
                     born_on date, died_on date, epitaph text, bio text, cover_photo_key,
                     stone_style text, theme text, last_cleaned_at,
                     visibility: public|private (v1: always public),
                     status: active|hidden|removed, created_at)
                     -- owner_id NULL = orphaned; still visible, owner-only actions are disabled

memorial_photos     (id, memorial_id, uploader_id, storage_key, caption, sort_order, created_at)

timeline_events     (id, memorial_id, occurred_on date, title, body, sort_order)

notes               (id, memorial_id, author_id, body text (≤ 2000 chars), paper_style text,
                     status: visible|hidden_by_owner|removed, created_at, edited_at)

voice_memos         (id, memorial_id, author_id, storage_key, duration_ms int,
                     is_paid bool, coins_spent int, status, created_at)

decoration_types    (id, key unique, name, slot_kind: pot|candle|incense|light|wreath,
                     price_coins int, lifetime_hours int, art_asset text, is_active bool)
                     -- data-driven: adding a decoration = inserting a row + art

memorial_slots      (id, memorial_id, slot_kind, position_key text)   -- e.g. 'left-pot', 'front-candle-1'
                     -- created from the stone_style's layout template when the memorial is created

decorations ⚑       (id, slot_id, decoration_type_id, giver_id, message text?,
                     placed_at, expires_at, renewed_count int default 0, last_renewed_at,
                     ledger_entry_id)
                     -- a slot is occupied iff it has a decoration with expires_at > now()
                     -- renewal updates expires_at/renewed_count; each renewal has its own ledger row

cleanings ⚑         (id, memorial_id, user_id, cleaned_on date, created_at,
                     unique(memorial_id, user_id, cleaned_on))

daily_rewards ⚑     (user_id, reward_on date, ledger_entry_id, primary key(user_id, reward_on))

coin_ledger ⚑       (id, user_id, delta int (+/-), reason: purchase|daily_visit|decoration|
                     voice_memo|refund|chargeback|admin_adjust, ref_type, ref_id,
                     idempotency_key unique, created_at)
                     -- reason also includes: decoration_renewal
                     -- APPEND-ONLY. Balance = SUM(delta). Never UPDATE/DELETE.

coin_packs          (id, name, coins int, price_cents int, stripe_price_id, is_active)

payments ⚑          (id, user_id?, kind: coin_pack|donation, stripe_session_id unique,
                     stripe_payment_intent, amount_cents, currency, status, coin_pack_id?, created_at)

reports             (id, reporter_id, target_type: memorial|note|voice_memo|photo, target_id,
                     reason, details, status: open|actioned|dismissed, resolved_by, created_at)
```

A `coin_balances` view (`SELECT user_id, SUM(delta)`) can be turned into a cached column later if needed, but the ledger stays the source of truth.

### Row-level security summary
| Table | Read | Write |
|---|---|---|
| memorials | anyone if `status=active` | owner (insert/update own); admins |
| notes / voice_memos | anyone if `visible`; author always | insert: signed-in user (through a function for memos); owner can set `hidden_by_owner`; author can delete own |
| decorations, cleanings, coin_ledger, daily_rewards, payments | public: decorations; own rows for the others | **functions/server only** |
| reports | reporter + admins | signed-in insert |

---

## 5. Coin economy

### Packs (Stripe)
| Pack | Price | Stripe fee (2.9% + 30¢) | Net |
|---|---|---|---|
| 500 coins | $5.00 | $0.45 | $4.55 |
| 1,000 coins | $9.00 | $0.56 | $8.44 |
| 2,000 coins | $17.00 | $0.79 | $16.21 |

### Earning
- **Daily visit:** 1 coin per user per UTC day, granted by `claim_daily_reward()` when a signed-in user opens any memorial page. Idempotent through the `daily_rewards` primary key.

### Spending (initial prices; tunable in `decoration_types`)
| Item | Coins | Lifetime |
|---|---|---|
| Incense | 30 | 24 h |
| Candle | 50 | 3 days |
| String lights / lantern | 100 | 7 days |
| Flower pot + flowers | 200 | 14 days |
| Renew a decoration (giver only, before it fades) | 75% of price, rounded up (incense 23, candle 38, lights 75, flowers 150) | resets to full lifetime |
| Extra voice memo (beyond 3) | 50 | — |
| Extended memo (60s → 3 min) | +100 | — |

### Integrity rules
1. All spending goes through Postgres functions (`place_decoration`, `renew_decoration`, `create_paid_voice_memo`) that run in **one transaction**: lock the user's ledger rows (`pg_advisory_xact_lock(hash(user_id))`), check the balance, insert a negative ledger row, insert the decoration. The client never writes the ledger.
2. Purchases are credited **only from the Stripe webhook** (`checkout.session.completed`) after the signature is verified. `idempotency_key = stripe_session_id`, so a webhook delivered twice can't credit coins twice.
3. Refunds and chargebacks add a negative `refund`/`chargeback` row. Balances can go negative, and spending is blocked until the balance is positive again.
4. Terms of service: coins have **no cash value**, can't be transferred, and are non-refundable except where the law requires.

### Donations
A Stripe Checkout one-time payment with preset amounts ($3/$5/$10/custom, minimum $2). Recorded in `payments` with `kind=donation`. An optional "Supporter" badge on the donor's profile (later).

---

## 6. Feature specs

### 6.1 Memorial page (`/m/:slug`)
Layout, top to bottom:
1. **The grave scene:** the gravestone (name, dates, epitaph) with decoration slots arranged around it, and the weathering overlay on the stone.
2. **Life:** cover photo, bio, photo gallery, timeline.
3. **Notes:** the note stack (§6.2).
4. **Voice memos:** the list, plus a record button.
5. Footer actions: Share, Report, Donate to the site.

### 6.2 Notes (the "filing cabinet")
- Notes appear as paper cards stacked in chronological order (oldest at the back, newest at the front), slightly offset like files in a drawer.
- **Hover/focus:** the card rises about 12px with a soft shadow (Framer Motion spring), and a date/author tooltip appears ("Nov 3, 2026 · Alex"). Clicking opens the full note.
- **Mine vs. everyone's:** a segmented toggle `All | Mine`. In `All` view, your notes get a colored tab on the card's edge (like a file-folder tab) plus a "You" label, and other people's notes have neutral tabs.
- A mini timeline scrubber on the side jumps to a month or year.
- Paper styles (`paper_style`): lined, plain, kraft, and more later. Free.
- Accessibility: the cards form a keyboard-navigable list, the hover effects also trigger on focus, and `prefers-reduced-motion` turns off the lift animation.

### 6.3 Decoration slots
- Empty slots are drawn as faint outlines (an empty pot, an unlit candle holder, an incense stand, a light hook).
- **Hover/focus:** a soft glow ring and the label "Place flowers · 200 coins".
- **Click:** a confirmation dialog shows the item preview, the price, the balance before and after, "Lasts 14 days", and an optional short message. On confirm, `place_decoration()` runs and the fill animation plays (flowers bloom, the candle lights).
- Filled slot hover: "Flowers from Alex · Nov 3 · fades in 9 days".
- **Renewal:** when the giver hovers their own decoration, they see "Renew · 150 coins". Confirming calls `renew_decoration()`, which sets `expires_at = now() + lifetime` (a reset, not added on top) and charges 75% of the price, rounded up. Only the giver can renew, and only while the decoration hasn't expired yet. Once it fades, anyone can claim the slot.
- If the balance is too low, the dialog shows a "Get coins" button that opens the pack picker.
- When a decoration expires it fades out (handled visually on the client; the server is the source of truth through `expires_at`).
- Slot layouts come from `stone_style` templates (JSON: `[{position_key, slot_kind, x, y}]`), so a new stone style means a new template.

### 6.4 Weathering & cleaning
- `grime_level = min(1, days_since_clean / FULL_DAYS)`, with `FULL_DAYS = 60`, eased with `level^0.8` so early growth shows up sooner. It's computed on the fly, so no cron job is needed.
  - Rendered opacity = `grime_level × MAX_OPACITY` (`MAX_OPACITY = 0.6`, so the name and dates stay readable).
  - Targets: faint moss is noticeable by **about day 7** (level ≈ 0.18), heavy by about day 30, and maxed by day 60.
  - Every value is a config constant in `core/weathering.ts`.
- Drawn as layered moss, dirt, and lichen textures (SVG/PNG with alpha) over the stone, with opacity scaling with the level. A seeded random pattern per memorial keeps each stone's look consistent.
- **Clean:** click the stone, confirm "Clean the stone?", and a wipe animation plays. `clean_memorial()` sets `last_cleaned_at = now()` and inserts into `cleanings`. Each user can clean a given memorial once per day. Free.
- Optional later: a "Recently tended by Alex, Sam, and 3 others" line.

### 6.5 Voice memos
- Recorded in the browser with MediaRecorder (Opus/WebM, falling back to AAC/MP4 on Safari). Live timer, hard stop at the limit, preview before posting.
- Flow: the client asks the API for an upload URL → the API checks the user's quota (and charges coins through a function if paid) and returns a **signed R2 PUT URL** limited to the content type and a maximum size (about 1.5MB per 60s, 5MB per 3 min) → the client uploads → the client confirms → the row is set to visible.
- Playback uses short-lived signed GET URLs, so hidden or removed memos stop being playable.
- **Downloads:** only the memo's author and the memorial owner see a Download button. The API issues a signed GET URL with `Content-Disposition: attachment` only after checking the requester's role. Everyone else streams through the player with no download link. (A determined person can still record their screen; the terms of service forbid reusing other people's recordings.)
- Quota: free memos per (user, memorial) = 3.
- Later: run speech-to-text for moderation and accessibility captions.

### 6.6 Memorial creation
- Requires sign-in. Limit 5 memorials per account (configurable; admins can raise it).
- Wizard: name and dates → epitaph → stone style → photo/bio (optional) → publish.
- Creating a memorial also creates its `memorial_slots` from the stone template.
- Ownership transfer and co-owners come later.
- **Orphaned memorials:** when an owner deletes their account, `owner_id` becomes NULL. The memorial stays public, and visitors can still write notes, decorate, and clean. Owner moderation passes to admins. An "Is this your family member? Request ownership" link sends a request to the admin queue (`reports` with `reason = ownership_request`), and an admin can reassign `owner_id`.

### 6.7 Moderation
- Owner: hide or unhide any note, memo, or photo on their memorial.
- Anyone signed in: report a memorial or any content (with Turnstile).
- Admin queue (`/admin`, `is_admin` only): review reports, remove content, suspend users.
- Rate limits: notes 10/hour per user, reports 20/day, memorial creation 3/day.
- The terms of service forbid memorials for living people and harassment, and a takedown request form covers both.

### 6.8 Auth
- Google OAuth through Supabase. The first sign-in creates a `profiles` row (trigger).
- Browsing is anonymous. Signing in is required to create, write notes, record memos, decorate, clean, claim the daily coin, buy coins, or report.

### 6.9 Coin balance UI
- When signed in, the header always shows a small gold coin icon with the balance (e.g. `◉ 1,240`).
- Clicking it opens the pack picker (500 / 1,000 / 2,000) and shows recent transactions read from the ledger.
- A brief "+1" animation plays when the daily visit coin is granted.

---

## 7. Visual design

A light, neutral palette that feels like a quiet garden on an overcast morning.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#F7F5F0` | page background (warm off-white) |
| `surface` | `#FFFFFF` | cards, notes |
| `stone` | `#C9C6BF` | gravestone base |
| `stone-dark` | `#8E8A82` | engraving, borders |
| `ink` | `#2F2E2B` | body text |
| `muted` | `#6E6B65` | secondary text |
| `sage` | `#8FA58A` | primary accent, "mine" tabs |
| `gold` | `#C8A96A` | coins, candlelight |
| `rose` | `#C98F8F` | flowers, sparing use |

- Fonts: a serif for names and epitaphs (e.g. *Cormorant Garamond*), a sans-serif for the interface (e.g. *Inter*).
- Motion: slow, soft springs, never bouncy. `prefers-reduced-motion` is respected everywhere.
- Accessibility target: WCAG 2.2 AA. Check text contrast on `bg` (the `muted` color must pass).
- Dark mode: later (an "evening" theme with candlelight).

---

## 8. Security & privacy

- **RLS on every table.** Clients get the anon key only, and the service-role key lives only in the API's environment.
- Coin, decoration, cleaning, and daily-reward writes happen **only** through SECURITY DEFINER functions with fixed `search_path`, input validation, and per-user locks.
- Stripe webhooks: verify the signature, process each event once (idempotency), and never trust amounts sent by the client.
- Uploads: signed URLs with size and content-type limits, randomized object keys, and photos re-encoded or with EXIF stripped (removes GPS data).
- Turnstile on note, memo, and report submissions and on memorial creation.
- Privacy: a privacy policy, account deletion (removes the profile and the user's content; ledger rows are kept anonymized for accounting), and memorial deletion by the owner.
- Age: 13+ in the terms (COPPA).
- Sales tax: research whether the states you sell into tax digital goods; Stripe Tax (+0.5%) can handle it once needed.

---

## 9. Hosting & cost

| Service | Plan | Cost |
|---|---|---|
| Cloudflare Pages (SPA) | Free (commercial use OK) | $0 |
| Server functions (Workers/Pages Functions or Supabase Edge Functions) | Free tier | $0 |
| Supabase | Free (500MB DB, 50k MAU) | $0 |
| Cloudflare R2 | Free first 10GB, no download fees | $0 |
| Domain | Cloudflare Registrar | ~$10–12/yr |
| Stripe | Per transaction | 2.9% + 30¢ |

**Upgrade triggers:** DB over 400MB or a need for daily backups → Supabase Pro ($25/mo). Worker CPU/bundle limits hit → Workers Paid ($5/mo). *Check current pricing pages before launch; these numbers change.*

Back up the database yourself: a weekly `pg_dump` from a GitHub Action to R2 (the free plan has no point-in-time recovery).

### Cost strategy: upgrade, don't migrate
- **Target:** about $12/year (the domain) until the site has traction.
- When a free limit is reached, **upgrade that provider in place**. Upgrading changes no code and moves no data.
- Upgrade Supabase to Pro only once coin sales reliably exceed about $30/month.
- **Billing safety:** set a $5 billing alert in Cloudflare (R2 needs a card on file) and keep Supabase's spend cap on.
- Free-plan caveat: Supabase pauses projects after 7 days with no activity. Unpausing is one click.
- **Hosting decision (2026-11-03): Cloudflare Pages.** Vercel was rejected because its free Hobby plan doesn't allow commercial use (coins and donations count), so it would cost $20/month from launch. The site is static files plus Hono server code, so moving to another host would take about an hour if ever needed.
- Migration effort if a provider ever has to be replaced: site, server code, and storage take hours. The database is a Postgres export/import plus security rules, about a weekend. Logins are the hardest because user accounts must move too.

---

## 10. Extensibility hooks
- **Decorations:** a row in `decoration_types` plus an art asset.
- **Stone styles and themes:** JSON slot templates plus CSS variables.
- **Seasonal items:** `decoration_types.is_active` plus optional `available_from` and `available_until` dates.
- **New paid features:** add a `coin_ledger.reason` value and one SQL function.
- **Notifications** (later): an `events` table, which email and push notifications can read from.

---

## 11. Testing strategy
- Unit tests (Vitest): weathering math, expiry, price display, quota logic in `core/`.
- DB tests: RLS policies (anon, user, owner, admin), the coin functions (insufficient balance, concurrent spends, duplicate webhook).
- E2E (Playwright): create a memorial → write a note → buy coins (Stripe test mode) → place flowers → clean.
- CI: GitHub Actions runs lint, typecheck, unit tests, and DB tests (Supabase CLI local stack).

---

## 12. Open questions

All of the original questions were resolved on 2026-11-03 (see §2). Remaining items, none of which block M0–M3:
1. Pick and register a domain (check availability for `memorialgarden.*` or alternatives).
2. Where the art comes from: draw it, commission it, or license it (gravestones, decorations, grime textures).
3. Whether renewing a decoration should ever be limited (e.g. a maximum number of renewals in a row) so other visitors get a chance at popular slots.
