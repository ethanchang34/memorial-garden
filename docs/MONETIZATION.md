# Monetization

Status: **leading proposal (2026-11-10)**, to confirm with the M1 core-loop test (price and willingness to pay). It replaces the coin economy in DESIGN §5; DESIGN sections that still describe coins are marked superseded.

## Model: build free, pay once to share

1. **Building is free and private.** Anyone signed in can create a memorial, add photos, a bio, voice memos, and decorations, and save it as a **draft** that only they can see. Drafts are never deleted for being unpaid.
2. **Sharing costs a one-time fee: $20 to start** (test $29 with early users). Paying publishes the memorial and makes it shareable, with the visibility the owner chooses. The price is stated **before** someone starts building: "Building a garden is free. Sharing it is a one-time $20, and you only pay when you're ready."
3. **Unpaid drafts are limited** to keep costs and abuse down: for example 2 drafts per account, with photo and voice-memo caps. Paying lifts the draft caps for that memorial.
4. **Visitors never pay.** Candles, flowers, notes, and voice memos (within per-visitor and per-memorial limits) are free. No coins, no balances, no spend confirmations.
5. **Hardship codes:** a gentle "Can't afford it right now?" link lets someone ask for a free code, granted by hand.
6. **Refunds within 14 days** of payment, no questions asked.
7. **No ads, no vendor upsells, no selling of data.** Optional donations to the site stay.
8. **Everything is included** in the one price for now (premium stones and scenes, companion animals). Optional add-ons can be reconsidered later.

Tenet 1 becomes: _visiting, remembering, and tending are always free; sharing a memorial is a single, honest, one-time fee._

### Decorating without friction

Because visitor gestures are free, decorating uses a calm **placing sheet**, not a payment prompt:

- Tapping an empty spot opens a sheet with a live preview of the decoration, an optional short message, and how long it lasts. One button places it; there is no second "are you sure".
- Vases offer **1–5 flowers** (any flower type in any stem point, chosen later); the preview vase fills as the count changes. Default is 1, with no "best value" labels.
- Candles are lit one at a time with **press and hold** (the Sky-style ritual); a candle spot holds a cluster of up to 5 from different visitors.
- After placing, a toast offers **Undo** for about 10 seconds.
- Gentle limits keep gestures meaningful and stop spam, for example one candle per visitor per memorial per day. Cluster timer and cap rules are open (DESIGN §12 item 6).

## Competitor pricing

Reviewed 2026-11-10. Some figures come from competitors' comparison pages or older pages rather than each company's own current price page; verify before relying on them.

| Site                      | Free tier                | Paid                                                         | Revenue                                 | Source                                                                                                                                     |
| ------------------------- | ------------------------ | ------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| ForeverMissed             | Free, 5 photos           | $9.95/month, $79.95/year, $159.95 one-time                   | Upgrades                                | [Memorygram comparison](https://memorials.memorygram.com/blog/memorygram-vs-forevermissed) (ForeverMissed's page blocked automated access) |
| Memorygram                | Free, 15 photos          | $6.95/month, $55.95/year, $111.95 one-time                   | Upgrades, printed books, QR keepsakes   | same                                                                                                                                       |
| Ever Loved                | Free indefinitely        | Premium reportedly $199.99                                   | Flower sales, promoting funeral vendors | [Ever Loved support](https://support.everloved.com/article/148-are-memorial-websites-and-obituaries-really-free)                           |
| QuickMemorial             | 1 photo, 14 days to edit | $9 (5 photos) or $49 (20 photos, privacy, booklet), one-time | Upgrades                                | [QuickMemorial](https://www.quickmemorial.com/)                                                                                            |
| Online-Tribute            | None                     | $95 to activate or $8/month                                  | Activation                              | [Online-Tribute](https://www.online-tribute.com/overview)                                                                                  |
| MuchLoved                 | Completely free          | None                                                         | UK charity; fee on donations, gifts     | [MuchLoved](https://www.muchloved.com/gateway/tributes-are-free/)                                                                          |
| Legacy.com memorial sites | 14-day trial             | Sponsor to avoid archiving                                   | Sponsorship, obituary and flower sales  | [Legacy](http://memorialwebsites.legacy.com/Pricing.aspx) (older page)                                                                     |

**Takeaways:** most competitors publish a basic memorial free and sell a one-time "lifetime" upgrade at $49–$200, usually gated by photo limits. $20 with everything included is low. Our counter to "others are free": building is free, there are no ads or vendor upsells, generous allowances, and the garden itself.

## Cost model

Provider prices are from published pricing as generally known in November 2026 and were not re-checked against each pricing page; verify before launch.

### Fixed

| Item               | At launch                                     | With real users                           |
| ------------------ | --------------------------------------------- | ----------------------------------------- |
| Domain             | ~$10–12/year                                  | same                                      |
| Cloudflare Pages   | $0                                            | $0                                        |
| Cloudflare Workers | $0 (about 100k requests/day free)             | $5/month if exceeded                      |
| Supabase           | $0 (500 MB database; pauses after inactivity) | $25/month Pro (daily backups, no pausing) |
| Cloudflare R2      | $0 for the first 10 GB                        | about $0.015/GB-month; no download fees   |
| Sentry             | $0                                            | $0                                        |
| **Total**          | **~$1/month**                                 | **~$30/month**                            |

### Per memorial

Assumes photos re-encoded to about 300 KB and 60-second voice memos at about 300 KB; database rows are about 50–200 KB.

| Memorial                              | Storage  | Per year | Over 50 years |
| ------------------------------------- | -------- | -------- | ------------- |
| Typical (30 photos, 50 memos, ~25 MB) | 0.025 GB | ~$0.005  | ~$0.25        |
| Heavy (~100 MB)                       | 0.1 GB   | ~$0.02   | ~$1           |

### Per sale at $20

|                                |             |
| ------------------------------ | ----------- |
| Price                          | $20.00      |
| Stripe (2.9% + 30¢)            | −$0.88      |
| Stripe Tax, if enabled (~0.5%) | −$0.10      |
| **Net**                        | **~$19.00** |

**Break-even:** about 2 sales a month on the ~$30/month setup.

### Other costs

Lawyer review of terms and privacy (often a few hundred dollars, once); terms generator ($0–20/month); DMCA agent (~$6 per 3 years); PO box (~$5–20/month, only once reminder emails ship); LLC if formed (~$50–500 plus yearly fees in some states); income tax; and support and moderation time.

### Risks

- **Spam drafts filling storage:** capped by the unpaid draft limits.
- **Heavy visitor uploads on one memorial:** per-memorial caps on visitor voice memos and photos.
- **Chargebacks:** about $15 each from Stripe; a clear refund window reduces them.
- **"Forever" hosting on a one-time fee:** set aside **$1–2 of every sale** as a hosting reserve.

## Data model changes (when M4 is rebuilt)

- `memorials.status` gains `draft` (owner-only). Publishing requires a paid `memorial_purchases` row (memorial, payer, Stripe session, amount, refunded_at) or a redeemed hardship code.
- `payments.kind`: `memorial_share | donation`. Payments are recorded **only** from verified Stripe webhooks, idempotent on the session id.
- Removed: `coin_ledger`, `coin_packs`, `daily_rewards`, `memorial_unlocks`, `price_coins` columns, coin functions.
- New: `hardship_codes` (hashed code, created_by admin, redeemed_by, redeemed_at); refunds unpublish only if the owner asks or a chargeback occurs.

## Rejected for now

- **Coins with per-item spending:** too transactional for grief, and complex (ledger, packs, refunds, chargebacks, balances).
- **Free to publish with a paid upgrade:** keeps the growth loop but invites spam memorials and depends on upsells.
- **Paywall before building:** asks the grieving to pay before seeing anything.
- **Seeding the site with recent famous people:** posthumous publicity rights in several US states, photo copyright, families' objections, and troll magnets. Instead, avoid showing emptiness (no public counts, "Recently tended" only with activity, a gentle "Create a memorial for them" on empty search) and seed with real memorials from the owner and early testers. Long-deceased public-domain historical figures are possible later, clearly labeled, after a lawyer's review.

## Outreach to funeral homes

Owner's idea (2026-11-10): cold-email funeral homes (and pet cremation services, hospices) about the product, possibly offering free shares so their families can try it. Funeral homes are where competitors get most of their memorial traffic (Ever Loved, Legacy), so this is a real channel. Plan it after the core-loop test, once there is a garden worth showing.

**Pilot offer (to decide together):**

- A **partner code** per funeral home, reusing the hardship-code mechanism (hashed, single use per memorial), so redemptions are trackable per partner.
- Limit by **count** (e.g. the next 20 shares; 20 is a placeholder), by **time** (e.g. 90 days), or both, whichever ends first. A cap protects the hosting reserve; each free share still costs storage (MONETIZATION cost model: under $1 each over decades).
- Possibly a referral arrangement later instead of free shares (e.g. the home pays a discounted bulk rate, or earns credit).

**Email rules** (not legal advice): personal, low-volume emails to individual businesses, not bulk spam. US CAN-SPAM applies to commercial email, including business-to-business: truthful sender and subject, a working opt-out honored within 10 business days, and a physical postal address (the PO box from SETUP.md). Stricter rules apply in the EU, UK, and Canada; start with US homes. Send from the project domain with SPF/DKIM set up so emails aren't flagged.

**To prepare:** a short demo memorial, a one-page explainer for funeral directors, and a way to track which homes were contacted and which codes were redeemed (a spreadsheet is fine at first).

## Open

- Final price ($20 vs $29) from the core-loop test.
- Exact draft caps and per-memorial visitor upload caps.
- Whether private memorials are included free (recommended) or tied to sharing.
- Cluster rules (DESIGN §12 item 6).
- Funeral-home pilot: free-share cap (count, time, or both) and whether to offer bulk or referral terms.
