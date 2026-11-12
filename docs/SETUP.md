# Setup & Prerequisites

Create each account when its milestone starts; there's no need to sign up for everything on day one.

## 0. Before anything

- [x] **Dedicated project email** (e.g. a new Gmail, "For my personal use", named after the project). Use it for every account below so the business stays separate from your personal inbox and can be handed off or sold cleanly later.
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

- [x] Sign up at dash.cloudflare.com with the project email (email + password, or Google with the project Gmail) and turn on 2FA.
- [x] **Workers & Pages → Create application → "Continue to Pages"** (the legacy Pages flow; the default flow creates a Worker, which needs a Wrangler config the web app doesn't have) → **Connect to Git** → choose `memorial-garden`.
  - Production branch `main`, framework preset **None**
  - Build command `pnpm --filter @memorial-garden/web build`, output directory `apps/web/dist`
  - Variables: `NODE_VERSION=22`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY`, and (Production only) `VITE_SENTRY_DSN`. `VITE_*` values are built into the site, so redeploy after changing them.
- [x] **Notifications → Add → Billing:** usage-based billing alert at $5.
- [x] The Pages site is **`https://memorial-garden-2ub.pages.dev`**. Cloudflare added the `-2ub` suffix because `memorial-garden.pages.dev` belongs to someone else; never use that address. The site is publicly reachable.
- [ ] (M1) **R2 → enable.** This requires a card on file, but the first 10GB is free. Create buckets `mg-media-dev` and `mg-media-prod`, both private.
- [ ] (M1) **R2 → Manage API tokens → create** a token with Object Read & Write access to those buckets only. Save the access key ID and secret.
- [x] **Turnstile** widget "Memorial Garden" (Managed; hostnames `memorial-garden-2ub.pages.dev`, `localhost`). Site key (public): `0x4AAAAAAF94b63umsS_h8Vy`. Secret key in the password manager and in Supabase CAPTCHA settings only. Add the production domain at launch.
- [x] Cloudflare Pages: `VITE_TURNSTILE_SITE_KEY` set in Production and Preview; redeployed.
- [x] Supabase **Attack Protection → CAPTCHA** on with Turnstile; Google sign-in verified afterwards.
- [ ] (M6) **Domain Registration → buy the domain**, then point it at Pages under Custom domains.

### Supabase (M0)

- [x] Sign up at supabase.com and turn on 2FA.
- [x] **Anonymous sign-ins** enabled (for garden gestures without an account); every content-write policy excludes anonymous users (AGENTS.md).
- [x] Create the project `memorial-garden` (free plan), project ref `qihwhgxpfvwvnuobgfbq`. Save the database password in your password manager. At creation: keep **Enable Data API** on, turn **Automatically expose new tables** off, and turn **automatic RLS** on.
- [x] **Connect** button (or Project Settings → **Data API** and **API Keys**): note the Project URL and the **publishable key** (`sb_publishable_…`, public, used by the web app). The **secret key** (`sb_secret_…`) bypasses all security rules and is not needed until the API does privileged writes (M4); create one then, and keep it only in server environment variables, never in the browser, the repo, or a chat. Prefer these over the legacy `anon`/`service_role` keys.
- [x] **Authentication → URL Configuration**: Site URL `http://localhost:5173`, redirect URL `http://localhost:5173/**`.
- [x] Redirect URLs are exactly `http://localhost:5173/**` and `https://memorial-garden-2ub.pages.dev/**`. Add the production domain at launch. Never add an address you don't control: Supabase sends the user's login session to it.
- [x] Migrations deploy through GitHub Actions (`.github/workflows/deploy-migrations.yml`):
  - Merging a PR that changes `supabase/migrations/` starts a run that waits for your approval (Actions tab → the run → **Review deployments → Approve**), lists the pending migrations, then applies them.
  - **Actions → Deploy migrations → Run workflow** runs it by hand; leave **dry run** checked to only list pending migrations.
  - It uses the `production` environment secret `SUPABASE_DB_URL` (Supabase **Connect → Session pooler** URI with the password filled in). If you reset the database password, update this secret. If you ever turn on Supabase **Network Restrictions**, GitHub's runners will be blocked.
  - Manual fallback from your laptop, only if the workflow is broken: `pnpm exec supabase login`, `pnpm exec supabase link --project-ref qihwhgxpfvwvnuobgfbq`, then `pnpm exec supabase db push --remote --dry-run` and `pnpm exec supabase db push --remote`.
  - Never edit a migration once it has been pushed.

### Google Cloud Console (M0)

Sign in with the project Gmail. The OAuth screens are under **Google Auth Platform**.

- [x] Create the project `memorial-garden` (no billing needed).
- [x] **Get started** (consent screen): app name "Memorial Garden", audience **External**, project email as support and contact address.
- [x] **Data Access**: only the non-sensitive `openid`, `userinfo.email`, `userinfo.profile` scopes (an empty list also works). Sensitive and restricted scopes must stay empty.
- [x] **Audience → Test users**: add your own Google accounts.
- [x] **Clients → Create client** of type **Web application**. JavaScript origin `http://localhost:5173`; redirect URI `https://qihwhgxpfvwvnuobgfbq.supabase.co/auth/v1/callback`. Save the client ID and secret in your password manager.
- [x] Paste the client ID and secret into **Supabase → Authentication → Sign In / Providers → Google** and enable it. Leave "Skip nonce checks" and "Allow users without an email" off. Watch for browser autofill in these fields.
- [ ] (M6) Publish the app (move it from Testing to In production) before launch. While it's in Testing, only listed test users can sign in.

### Sentry (M0, free)

- [x] Sign up with the project email, organization `memorial-garden`, and turn on 2FA.
- [x] Projects `web` (React) and `api` (Hono), error monitoring only. Skip Sentry's setup wizard and agent plugin; the SDK is already wired in the repo.
- [ ] Web DSN set in Cloudflare Pages as `VITE_SENTRY_DSN` (Production only), then redeploy.
- [ ] (When the API is deployed) API DSN set on the API Worker as `SENTRY_DSN`. Keep DSNs out of local env files so local errors don't reach Sentry.

### Stripe (M4 test mode → M6 live)

- [ ] Sign up at dashboard.stripe.com and turn on 2FA. **Test mode needs no business verification.**
- [ ] Read Stripe's **Restricted Businesses** list. Our coins have no cash value, can't be transferred, and can't be cashed out, which is the generally allowed category.
- [ ] In test mode, create the products/prices `500 coins – $5`, `1,000 coins – $9`, `2,000 coins – $17`, and a donation product. Save the price IDs into the `coin_packs` table.
- [ ] Save the test **secret key** (`sk_test_…`).
- [ ] Add a webhook endpoint for `checkout.session.completed`, `charge.refunded`, and `charge.dispute.created`, and save the **signing secret** (`whsec_…`). For local development, use `stripe listen` instead.
- [ ] (M6) **Activate live mode**: legal name, address, SSN (or EIN if you form an LLC), and a bank account for payouts. Statement descriptor: `MEMORIALGARDEN`. Then repeat the products and webhook in live mode.
- [ ] (M6) Decide on sales tax (Stripe Tax, +0.5%) based on where buyers are.

### Launch-time accounts & registrations (M6)

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
- [ ] **Node.js 22**: `brew install node@22`, then add it to your PATH (Homebrew doesn't link versioned Node automatically):
  ```bash
  echo 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
  node -v   # v22.x
  ```
  Use `/usr/local/opt/node@22/bin` on Intel Macs. Don't install plain `node`: Node 25+ no longer includes corepack. `nvm` or `fnm` also work (they read `.nvmrc`).
- [ ] **pnpm**: `corepack enable`, then `pnpm -v` in the repo should print `11.25.0` (pinned in `package.json`)
- [ ] **Docker** (optional until you work on the database locally; CI runs the database tests on every PR). On macOS use Docker Desktop, OrbStack, or Colima. Then limit published ports to your own computer: in Docker Desktop, **Settings → Docker Engine**, add `"ip": "127.0.0.1"` to the JSON and apply. The local Supabase stack uses well-known default passwords, and this keeps its ports off your Wi-Fi network.
- [ ] **Supabase CLI**: installed per project through pnpm (`pnpm db:start`, `pnpm db:test`, `pnpm db:stop`); no separate install needed
- [ ] **Gitleaks**: `brew install gitleaks`. Required: `pnpm install` sets up a pre-commit hook (lefthook) that scans staged changes for secrets and blocks the commit if it finds one or if gitleaks isn't installed. If it flags something, remove the secret from the change; if a real key was already committed, rotate it.
- [ ] **Wrangler** (Cloudflare CLI): installed per project through pnpm, then `pnpm wrangler login`
- [ ] **Stripe CLI** (M4): `brew install stripe/stripe-cli/stripe`, then `stripe login`
- [ ] **A coding agent** (Codex, Claude Code, ...) opened in the repo folder. Both read the rules in `AGENTS.md`.

Then clone the repo:

```bash
git clone https://github.com/ethanchang34/memorial-garden.git
cd memorial-garden
```

## 3. Environment variables

Never commit real values. Copy `apps/web/.env.example` to `apps/web/.env.local` and `apps/api/.env.example` to `apps/api/.dev.vars` (both gitignored) and fill in only what you need. Leave the Sentry DSNs out locally.

| Variable                                    | Where | Secret?                                                                |
| ------------------------------------------- | ----- | ---------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`                         | web   | no                                                                     |
| `VITE_SUPABASE_PUBLISHABLE_KEY`             | web   | no (`sb_publishable_…`, public by design; security rules protect data) |
| `VITE_TURNSTILE_SITE_KEY`                   | web   | no                                                                     |
| `SUPABASE_URL`                              | api   | no                                                                     |
| `SUPABASE_SECRET_KEY`                       | api   | **yes** (`sb_secret_…`, bypasses all security rules)                   |
| `R2_ACCOUNT_ID`                             | api   | no                                                                     |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | api   | **yes**                                                                |
| `R2_BUCKET`                                 | api   | no                                                                     |
| `TURNSTILE_SECRET_KEY`                      | api   | **yes**                                                                |
| `STRIPE_SECRET_KEY`                         | api   | **yes**                                                                |
| `STRIPE_WEBHOOK_SECRET`                     | api   | **yes**                                                                |
| `VITE_SENTRY_DSN`                           | web   | no (Cloudflare Pages, Production only)                                 |
| `SENTRY_DSN`                                | api   | no (deployed Worker only)                                              |

In production, `VITE_*` values go in the Cloudflare Pages project's Variables and Secrets (they are built into the site). API secrets go on the Worker with `wrangler secret put <NAME>`.
