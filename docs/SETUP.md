# Setup & Prerequisites

Create each account when its milestone starts; there's no need to sign up for everything on day one.

## 0. Before anything

- [ ] **Dedicated project email** (e.g. a new Gmail). Use it for every account below so the business stays separate from your personal inbox and can be handed off or sold cleanly later.
- [ ] **Password manager** entry for each account.
- [ ] **Two-factor authentication** on every account, especially Stripe and Cloudflare.

## 1. Accounts

| Account              | Covers                                          | Needed by            |
| -------------------- | ----------------------------------------------- | -------------------- |
| GitHub (done)        | Code, CI, backups workflow                      | —                    |
| Cloudflare           | Pages, Workers, R2, Turnstile, domain registrar | M0                   |
| Supabase             | Postgres database, Auth                         | M0                   |
| Google Cloud Console | OAuth client for "Sign in with Google"          | M0                   |
| Stripe               | Coin packs, donations                           | M4 (test), M6 (live) |

### Cloudflare (M0)

- [ ] Sign up at dash.cloudflare.com with the project email and turn on 2FA.
- [ ] **Workers & Pages → Create → Pages → Connect to Git** → choose `memorial-garden`. Build command `pnpm --filter web build`, output folder `apps/web/dist`. (Do this once the app exists.)
- [ ] **R2 → enable.** This requires a card on file, but the first 10GB is free. Create buckets `mg-media-dev` and `mg-media-prod`, both private.
- [ ] **R2 → Manage API tokens → create** a token with Object Read & Write access to those buckets only. Save the access key ID and secret.
- [ ] **Turnstile → add site** → save the site key and secret key.
- [ ] **Billing → set a $5 billing alert.**
- [ ] (M6) **Domain Registration → buy the domain**, then point it at Pages under Custom domains.

### Supabase (M0)

- [ ] Sign up at supabase.com using **Sign in with GitHub** and turn on 2FA.
- [ ] Create the project `memorial-garden` (free plan). Choose the region closest to most users and save the database password in your password manager.
- [ ] **Project Settings → API**: save the Project URL, the `anon` key, and the `service_role` key. **The `service_role` key bypasses all security rules, so it goes only in server environment variables, never in the browser.**
- [ ] **Authentication → URL Configuration**: set Site URL to `http://localhost:5173` for now. Add redirect URLs for `http://localhost:5173/**` and, later, the Pages and production domains.
- [ ] Keep the **spend cap** on (the default).

### Google Cloud Console (M0)

- [ ] At console.cloud.google.com, create the project `memorial-garden`.
- [ ] **APIs & Services → OAuth consent screen**: choose External, set the app name "Memorial Garden", and enter the project email as the support address. Scopes: `email`, `profile`, `openid`.
- [ ] **Credentials → Create credentials → OAuth client ID** of type **Web application**.
  - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
- [ ] Copy the client ID and secret into **Supabase → Authentication → Providers → Google** and enable it.
- [ ] (M6) Publish the consent screen (move it from Testing to In production) before launch. While it's in Testing, only listed test users can sign in.

### Stripe (M4 test mode → M6 live)

- [ ] Sign up at dashboard.stripe.com and turn on 2FA. **Test mode needs no business verification.**
- [ ] Read Stripe's **Restricted Businesses** list. Our coins have no cash value, can't be transferred, and can't be cashed out, which is the generally allowed category.
- [ ] In test mode, create the products/prices `500 coins – $5`, `1,000 coins – $9`, `2,000 coins – $17`, and a donation product. Save the price IDs into the `coin_packs` table.
- [ ] Save the test **secret key** (`sk_test_…`).
- [ ] Add a webhook endpoint for `checkout.session.completed`, `charge.refunded`, and `charge.dispute.created`, and save the **signing secret** (`whsec_…`). For local development, use `stripe listen` instead.
- [ ] (M6) **Activate live mode**: legal name, address, SSN (or EIN if you form an LLC), and a bank account for payouts. Statement descriptor: `MEMORIALGARDEN`. Then repeat the products and webhook in live mode.
- [ ] (M6) Decide on sales tax (Stripe Tax, +0.5%) based on where buyers are.

### Launch-time accounts & registrations (M6)

- [ ] **Sentry** (free): create a project for web + api, and save the DSN (`VITE_SENTRY_DSN`, `SENTRY_DSN`). Can be done as early as M0.
- [ ] **Cloudflare → Caching → Configuration → CSAM Scanning Tool:** turn it on and enter the notification email. Requires the domain to be on Cloudflare.
- [ ] **Cloudflare → Web Analytics:** add the site.
- [ ] **Cloudflare → Email → Email Routing:** turn it on for the domain, verify the project Gmail as a destination, and route `support@<domain>` to it. The contact form's Worker uses the `send_email` binding to this verified address.
- [ ] **Cloudflare Zero Trust → Access:** create an application for `/admin/*` and `/api/admin/*`, with a policy allowing only your admin email (free plan, up to 50 users).
- [ ] **US Copyright Office DMCA Designated Agent Directory:** register (about $6), and set a reminder to renew every 3 years.
- [ ] **PO box or virtual mailbox:** needed only when reminder emails ship (CAN-SPAM requires a postal address).
- [ ] **Terms of service and privacy policy generator** (Termly, GetTerms, or similar).
- [ ] _(When revenue > ~$200/month)_ LLC through your state's website + EIN from the IRS (free at irs.gov).

## 2. Local tools (on your personal computer)

- [ ] **Git** and the **GitHub CLI** (`gh auth login`)
- [ ] **Node.js 22 LTS** (through `nvm` or `fnm`)
- [ ] **pnpm**: `corepack enable && corepack prepare pnpm@11.25.0 --activate`
- [ ] **Docker Desktop**, which the Supabase CLI needs to run a local database. Then in **Settings → Docker Engine**, add `"ip": "127.0.0.1"` to the JSON and apply. The local Supabase stack uses well-known default passwords, and this keeps its ports reachable only from your own computer instead of your whole Wi-Fi network.
- [ ] **Supabase CLI**: installed per project through pnpm (`pnpm db:start`, `pnpm db:test`, `pnpm db:stop`); no separate install needed
- [ ] **Gitleaks**: `brew install gitleaks` (used by CI; M0 will enable the repository hook)
- [ ] **Wrangler** (Cloudflare CLI): installed per project through pnpm, then `pnpm wrangler login`
- [ ] **Stripe CLI** (M4): `brew install stripe/stripe-cli/stripe`, then `stripe login`
- [ ] **A coding agent** (Codex, Claude Code, ...) opened in the repo folder. Both read the rules in `AGENTS.md`.

Then clone the repo:

```bash
git clone https://github.com/ethanchang34/memorial-garden.git
cd memorial-garden
```

## 3. Environment variables

Never commit real values. Example files are provided at `apps/web/.env.example` and `apps/api/.env.example`.

| Variable                                    | Where | Secret?                                            |
| ------------------------------------------- | ----- | -------------------------------------------------- |
| `VITE_SUPABASE_URL`                         | web   | no                                                 |
| `VITE_SUPABASE_ANON_KEY`                    | web   | no (public by design; security rules protect data) |
| `VITE_TURNSTILE_SITE_KEY`                   | web   | no                                                 |
| `SUPABASE_URL`                              | api   | no                                                 |
| `SUPABASE_SERVICE_ROLE_KEY`                 | api   | **yes**                                            |
| `R2_ACCOUNT_ID`                             | api   | no                                                 |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | api   | **yes**                                            |
| `R2_BUCKET`                                 | api   | no                                                 |
| `TURNSTILE_SECRET_KEY`                      | api   | **yes**                                            |
| `STRIPE_SECRET_KEY`                         | api   | **yes**                                            |
| `STRIPE_WEBHOOK_SECRET`                     | api   | **yes**                                            |
| `VITE_SENTRY_DSN`                           | web   | no                                                 |
| `SENTRY_DSN`                                | api   | no                                                 |

In production, set these as encrypted environment variables in the Cloudflare Pages/Workers settings. Use `wrangler secret put` for the secrets.
