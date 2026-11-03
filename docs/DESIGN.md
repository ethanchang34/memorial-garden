# Memorial Garden — Design Doc

> Working name. Rename freely. Status: **Draft v3** (2026-11-03, feature round 2)

## 1. Overview

An online cemetery where anyone can create a memorial for someone who has died, and visitors can leave notes and voice memos and place decorations (flowers, candles, incense, lights) at the gravestone. Visitors keep the stone clean of the moss and grime that slowly builds up on it. The site is free to use. Revenue comes from **coins**, an in-site currency that buys decorations and extra voice memos, and from **donations** to the site.

### Goals
- A calm, beautiful, light and neutral interface that feels great at every screen size.
- Grieving is always free: creating memorials, writing notes, visiting, and cleaning cost nothing.
- Paid items are optional *gestures*, never pressure.
- Easy to extend: new decoration types, themes, and features without rewrites.
- Portable: changing hosting providers means swapping adapters, not rewriting the app.
- About $1/month to run at launch (just the domain).

### Tenets
When tradeoffs conflict, these come first.
1. **Grief is free, and we never exploit it.** Expressing love and remembrance never costs money; paid items are optional gestures. **Firm rules:** no loot boxes or random rewards, no ads, and no guilt-driven messaging (e.g. never "Grandma's stone is getting dirty" emails or "only 2 left!" pressure).
2. **Every screen size gets a first-class experience.** Phones, tablets, laptops, and large monitors, in portrait or landscape, and browser windows of any width. No layout is an afterthought, and no feature exists only on desktop (see §7.1).
3. **Calm and cozy over clever.** Warm, soft, and welcoming (see §7.0). No dark patterns and no pressure to buy.
4. **Accessible by default.** Keyboard, screen-reader, and reduced-motion support ship with every feature, not afterward.
5. **Cheap and portable.** Stay on free plans until revenue pays for upgrades, and keep providers swappable.
6. **Use proven libraries; don't reinvent them.** Use well-maintained open-source libraries and asset packs for UI components, animation, audio, icons, and forms instead of building them from scratch. Spend our own effort on what makes the site unique: the grave scene, notes stack, decorations, and weathering. See §7.2 for the approved list and the rules for adding to it.
7. **One memorial, one garden.** Each memorial is its own page and its own garden scene with a single gravestone. Gravestones are never shown side by side in a shared scene. Browsing and search show cards that lead to each garden.

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
| Page model | **One memorial = one page = one garden scene with one gravestone** (Tenet 7). |
| Revenue additions | **Premium stone styles/scenes** bought with coins (~1,000–1,500), by the owner or caretakers, permanent for that memorial. **v1.** |
| Rejected revenue ideas | Printed books, QR plaques, charity decorations, coin gifting (could be revisited later). |
| Memory prompts | Gentle writing prompts in the note composer. **v1.** |
| Cultural traditions | Tradition-specific decorations and stone motifs. **v1** (initial set in §6.12). |
| Family caretakers | Can do everything except delete the memorial or manage caretakers. If the owner leaves, the longest-serving caretaker becomes owner. **After launch.** |
| Anniversary reminders | Any signed-in visitor can **follow** a memorial and opt in to birthday and anniversary emails (off by default). **After launch.** The email provider is undecided. |
| Pet memorials | Same site, with a `kind` field (person or pet) and a separate "Pets" browse section, plus pet stones and decorations. **After launch.** |
| Guardrails | Firm: no loot boxes, ads, or guilt emails. Not adopted: dollar amounts shown next to coin prices, 24h mistake refunds, self-set spending limits (the confirmation dialog is the safeguard). |

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
| Animation | Motion (Framer Motion) + Rive | UI motion (note lift, dialogs) + interactive illustrated animations (see §7.2) |
| UI components | shadcn/ui (Radix primitives + Tailwind) | Accessible dialogs, sheets, tooltips, and tabs that we style ourselves |
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
                     kind: person|pet (v1: person), stone_style_id → stone_styles,
                     scene text, tradition text?, theme text, last_cleaned_at,
                     visibility: public|private (v1: always public),
                     status: active|hidden|removed, created_at)
                     -- owner_id NULL = orphaned; still visible, owner-only actions are disabled

stone_styles        (id, key unique, name, is_premium bool, price_coins int?, kind: person|pet|any,
                     tradition text?, slot_template jsonb, art_asset text, is_active bool)
                     -- slot_template: [{position_key, slot_kind, x%, y%}] (see §6.3)

memorial_unlocks ⚑  (id, memorial_id, stone_style_id, purchaser_id, ledger_entry_id, created_at,
                     unique(memorial_id, stone_style_id))   -- permanent once bought

memory_prompts      (id, text, kind: person|pet|any, tradition text?, is_active bool)

-- After launch (tables designed now, created when the feature ships):
memorial_caretakers (memorial_id, user_id, added_by, added_at, primary key(memorial_id, user_id))
caretaker_invites   (id, memorial_id, token_hash, created_by, expires_at, accepted_by?, accepted_at?)
memorial_follows    (user_id, memorial_id, remind_birthday bool, remind_anniversary bool, created_at,
                     primary key(user_id, memorial_id))

memorial_photos     (id, memorial_id, uploader_id, storage_key, caption, sort_order, created_at)

timeline_events     (id, memorial_id, occurred_on date, title, body, sort_order)

notes               (id, memorial_id, author_id, body text (≤ 2000 chars), paper_style text,
                     status: visible|hidden_by_owner|removed, created_at, edited_at)

voice_memos         (id, memorial_id, author_id, storage_key, duration_ms int,
                     is_paid bool, coins_spent int, status, created_at)

decoration_types    (id, key unique, name, slot_kind: pot|candle|incense|light|wreath|stone|offering,
                     tradition text?, kind: person|pet|any,
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
                     -- reason also includes: decoration_renewal, stone_unlock
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
| Premium stone style / scene (owner or caretaker) | 1,000–1,500 | permanent for that memorial |
| Extra voice memo (beyond 3) | 50 | — |
| Extended memo (60s → 3 min) | +100 | — |

### Integrity rules
1. All spending goes through Postgres functions (`place_decoration`, `renew_decoration`, `unlock_stone_style`, `create_paid_voice_memo`) that run in **one transaction**: lock the user's ledger rows (`pg_advisory_xact_lock(hash(user_id))`), check the balance, insert a negative ledger row, insert the decoration. The client never writes the ledger.
2. Purchases are credited **only from the Stripe webhook** (`checkout.session.completed`) after the signature is verified. `idempotency_key = stripe_session_id`, so a webhook delivered twice can't credit coins twice.
3. Refunds and chargebacks add a negative `refund`/`chargeback` row. Balances can go negative, and spending is blocked until the balance is positive again.
4. Terms of service: coins have **no cash value**, can't be transferred, and are non-refundable except where the law requires.

### Donations
A Stripe Checkout one-time payment with preset amounts ($3/$5/$10/custom, minimum $2). Recorded in `payments` with `kind=donation`. An optional "Supporter" badge on the donor's profile (later).

---

## 6. Feature specs

### 6.1 Memorial page (`/m/:slug`)
**Each memorial is its own garden** (Tenet 7): one page, one scene, one gravestone. The scene, the stone style, and its decoration slots all belong to that single memorial. Browse and search pages (`/`, `/browse`, later `/pets`) show memorial **cards** (stone thumbnail, name, dates), never a shared multi-grave scene.

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

### 6.10 Premium stone styles & scenes (v1)
- v1 ships **1 free classic stone** plus **2–3 premium** stone/scene combinations (e.g. marble under a willow, slate by the sea, a mossy woodland stone). Each is a `stone_styles` row with its own slot template.
- In memorial settings, the owner (and caretakers, after launch) can preview any style live on their own garden before buying. `unlock_stone_style()` charges the coins once and the unlock is permanent. Switching back and forth between unlocked styles is free.
- Changing the stone style changes the slot layout. Active decorations move to the matching slot kind in the new layout. Any that don't fit stay "on the ground" until they expire, so nothing is lost.

### 6.11 Memory prompts (v1)
- The note composer shows a rotating, dismissible prompt ("Share a favorite meal you had together", "What would you tell them today?"). Clicking "Use this" pre-fills a gentle opening line.
- Prompts come from `memory_prompts`, filtered by memorial `kind` and `tradition`. About 30 ship at launch. They're never shown in a way that implies you *should* write.

### 6.12 Cultural & religious traditions (v1)
- The owner can optionally set a **tradition** on the memorial. It adds tradition-specific decorations and stone motifs to the options, but never restricts anything.
- Initial set (each is just `decoration_types`/`stone_styles` rows plus art):

  | Tradition | Additions |
  |---|---|
  | Jewish | Visitation stones (free gesture, small slot kind `stone`), Star of David motif, yahrzeit candle |
  | Christian | Cross motif, rosary, lilies, votive candle |
  | Muslim | Crescent motif, simple green myrtle/rosewater offering (no images on the stone) |
  | Buddhist | Incense, lotus, offering bowl |
  | Hindu | Diya lamp, marigold garland |
  | Día de los Muertos | Marigolds (cempasúchil), papel picado, ofrenda items, sugar skull |
  | Chinese ancestral | Incense, fruit offering, joss paper motif (no burning animation by default) |
  | Secular/none | Default set |
- **Review every tradition's items with people from that tradition before launch** to avoid getting them wrong or causing offense (see §12).
- Small, symbolic items that are culturally core (e.g. Jewish visitation stones) are **free**, per Tenet 1.

### 6.13 After launch (designed now, built later)
- **Family caretakers:** the owner sends an invite link (single-use, expires in 7 days). Caretakers can edit the bio, photos, and timeline, hide content, and change or unlock stone styles. They can't delete the memorial or manage caretakers. If the owner deletes their account, the longest-serving caretaker becomes the owner automatically, and the memorial is orphaned only if no caretakers exist.
- **Follow + anniversary reminders:** a "Follow" button on the memorial. Each follower can opt in separately to birthday and death-anniversary emails, which are off by default. Reminder text is gentle ("Today would have been Rosa's 90th birthday") and contains a link, never a sales pitch or coin offer (Tenet 1). Email goes through an `EmailProvider` adapter; the provider is undecided (Resend vs. Amazon SES).
- **Pet memorials:** `kind = pet`, a separate `/pets` browse section, pet stones (paw prints, wooden marker) and pet decorations (toy ball, food bowl, favorite blanket), with pet-specific memory prompts.


## 7. Visual design

### 7.0 Art direction: "cozy memorial garden"
**The feeling:** a quiet country churchyard at golden hour, somewhere you'd *want* to linger. Warm, soft, hand-made, and comforting rather than somber. Mood reference: the cozy, lived-in warmth of farming and life-sim games, **but painterly and smooth, never pixelated**, and in our own original style.

**What that means in practice:**
- **Illustration style:** soft hand-painted or storybook look, with gentle gradients, slightly rounded shapes, subtle paper or watercolor textures, and soft shadows. No hard outlines, no pixel art, no photorealism.
- **Scene:** each grave sits in a small garden vignette (grass, a little path, a tree branch or hedge at the edge), not a stone floating on a blank page.
- **Ambient life (subtle, optional):** grass swaying slightly, a few fireflies at dusk, a petal drifting down, candle flames flickering. All of it can be turned off and respects `prefers-reduced-motion`.
- **Time of day (later):** the scene's light follows the visitor's local time (morning, golden hour, evening with candlelight). This pairs naturally with the planned "evening" theme.
- **Interface:** rounded corners (12–16px), soft shadows, paper-textured note cards, and friendly rounded type. The interface feels like stationery and wood, not a dashboard.
- **Motion:** slow, soft springs, small "settle" effects (a flower pot sinks gently into place, a note card rustles when it lifts). Never flashy or bouncy.
- **Sound (optional, off by default):** soft birdsong or wind, plus gentle sound effects for placing decorations and cleaning.
- **Avoid:** pixelation, neon colors, harsh black, gamified pressure (streak counters, "only 2 left!"), cartoonish exaggeration.

A warm, light, neutral palette, like soft morning sun on old stone and moss.

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
| `moss` | `#7E9461` | grass, moss accents |
| `wood` | `#A47C5B` | frames, signposts, warm details |
| `sky` | `#DCE6E8` | scene backdrop (morning) |

- Fonts: a soft, warm serif for names and epitaphs (e.g. *Fraunces*, set to its "soft" style), and a rounded, friendly sans-serif for the interface (e.g. *Nunito*). Both are free on Google Fonts and self-hosted through Fontsource. A handwriting font is optional for notes (e.g. *Caveat*).
- Accessibility target: WCAG 2.2 AA. Check text contrast on `bg` (the `muted` color must pass).
- Dark mode: later (an "evening" theme with candlelight).

### 7.1 Responsive design (Tenet 2)
**Approach:** design mobile-first, then enhance for larger screens. Layouts respond to the space available, not to the device type.

| Width | Tailwind | Layout |
|---|---|---|
| 320–639px | base | Single column. The grave scene fills the width; notes, memos, and life story are stacked sections with sticky section tabs. Header collapses to logo + coin balance + menu. |
| 640–1023px | `sm`/`md` | Grave scene larger; notes shown as a 2-column stack; gallery as a 3-column grid. |
| 1024–1279px | `lg` | Two columns: grave scene stays fixed (sticky) on the left, scrollable notes, memos, and life story on the right. |
| ≥1280px | `xl`/`2xl` | Same as `lg` with a max content width (~1280px) and generous margins, so it never stretches edge to edge on ultrawide monitors. |

**Rules:**
- **Minimum supported width is 320px.** No horizontal scrolling at any width from 320px to 2560px or more.
- **The grave scene is an SVG with a fixed `viewBox`**, so it scales cleanly. Decoration slots are positioned as percentages of the scene, never in fixed pixels.
- **Use container queries** (`@container`) for components like note cards, slots, and dialogs, so a component adapts to its own container, not just the window.
- **Fluid type and spacing:** `clamp()` for headings and the name engraved on the stone.
- **Every hover interaction has a touch equivalent:**

  | Interaction | Mouse | Touch | Keyboard |
  |---|---|---|---|
  | Note lift + date | Hover | Tap selects (lifts and shows the date); tap again opens it | Focus lifts, Enter opens |
  | Decoration slot | Hover glow + label | Tap shows the glow + label sheet; button confirms | Focus + Enter |
  | Filled slot info | Hover tooltip | Tap shows a bottom sheet | Focus shows the tooltip |
  | Clean stone | Click | Tap | Enter |

  Detect with `@media (hover: hover) and (pointer: fine)`, not with screen width.
- **Touch targets are at least 44×44px**, including small decoration slots (expand the hit area invisibly if needed).
- **Dialogs:** a centered modal on `md` and up, a bottom sheet on small screens.
- **Respect safe areas** (`env(safe-area-inset-*)`) on phones with notches and home indicators. Use `dvh` units, not `vh`, so mobile browser toolbars don't cut off content.
- **Landscape phones** (short height): the grave scene height is capped so the note stack stays reachable.
- **Images** use `srcset`/`sizes` with responsive variants so phones don't download desktop-sized photos.
- **The voice recorder** works on mobile Safari and Chrome, including the microphone-permission flow.

**Testing:** every UI change is checked at **360×800, 390×844 (iPhone), 768×1024, 1280×800, and 1920×1080**, plus one landscape phone size (844×390). Playwright end-to-end tests run on both a mobile viewport (touch) and a desktop viewport. Before launch, test on real iOS Safari and Android Chrome devices.

### 7.2 Libraries & assets (Tenet 6)

**Approved starting set** (all free and open source, MIT or similar):

| Need | Library | Notes |
|---|---|---|
| Accessible UI primitives | **shadcn/ui** (built on **Radix UI**) | Copies component code into the repo, so we fully restyle it to the cozy look |
| Bottom sheets (mobile) | **Vaul** | Pairs with shadcn's Drawer |
| UI animation | **Motion** (Framer Motion) | Note lift, dialog transitions, slot fills |
| Illustrated, interactive animations | **Rive** (`@rive-app/react-canvas`) | Candle flicker, flowers blooming, cleaning wipe. Files are small, and animations can react to hover and clicks. The free editor tier is enough |
| Simple vector animations | **Lottie** (`lottie-react`) | Alternative to Rive. Large marketplace of ready-made animations at LottieFiles |
| Ambient particles | **tsParticles** (slim build) | Fireflies, drifting petals. Keep particle counts low on mobile |
| Icons | **Lucide** | Clean, rounded, consistent |
| Toasts | **Sonner** | "Flowers placed 🌸" |
| Forms + validation | **React Hook Form** + **Zod** | Zod schemas shared with the API |
| Data fetching | **TanStack Query** | Caching, optimistic updates |
| Voice memo waveform | **wavesurfer.js** | Pretty waveform player |
| Photo gallery / carousel | **Embla Carousel** | Light, touch-friendly |
| Fonts | **Fontsource** | Self-hosted Google Fonts, so we don't call Google from the browser |
| Sound | **Howler.js** | Optional ambient audio and sound effects |

**Art assets** (the biggest factor in the "cozy" look):
- **Option A (recommended start): licensed asset packs.** Painterly or cozy environment and prop packs from itch.io, Creative Market, or Envato, plus free textures (paper, watercolor) from sites like Poly Haven or Unsplash. **Check every license for commercial web use, and record it in `docs/ASSETS.md`.**
- **Option B: commission an illustrator** for a consistent signature style (stones, decorations, scene backgrounds). Do this once the site has traction.
- **Option C: AI-assisted art**, edited by hand for consistency. Check the tool's terms for commercial use, and be aware that AI-generated images may not be protected by copyright.
- Prefer **SVG** for stones and props (scales well at every screen size, per Tenet 2) and **WebP/AVIF** for painted backgrounds.

**Rules for adding a library:**
1. It's actively maintained (a release within the last year) and widely used.
2. It has a permissive license (MIT, Apache-2.0, BSD, ISC). No GPL in the frontend bundle.
3. It meets our accessibility and responsive tenets, or we can wrap it so it does.
4. Its bundle-size impact is reasonable. Check bundlephobia and prefer tree-shakeable libraries. Load heavy ones lazily (Rive, wavesurfer, and tsParticles only load on memorial pages).
5. It isn't added for something trivial (if a utility is under about 20 lines of our own code, write it).
6. Pin versions through the lockfile, and let Renovate or Dependabot open update PRs.
7. Add it to the table above in the same PR.

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
- **Stone styles and scenes:** a `stone_styles` row with a JSON slot template plus art. Premium ones set `is_premium` and `price_coins`.
- **Traditions:** add a `tradition` value and tag new `decoration_types`, `stone_styles`, and `memory_prompts` with it.
- **Memorial kinds:** `memorials.kind` (person, pet) filters stones, decorations, and prompts.
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
3. Choose an email provider for anniversary reminders (Resend's free plan vs. Amazon SES); needed only after launch.
4. Find reviewers from each tradition in §6.12 before launch, and adjust items based on their feedback.
5. Premium stone/scene designs and exact prices (1,000–1,500 coins).
6. Whether renewing a decoration should ever be limited (e.g. a maximum number of renewals in a row) so other visitors get a chance at popular slots.
