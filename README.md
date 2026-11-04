# Memorial Garden

An online cemetery where visitors leave notes and voice memos, place flowers and candles, and tend the gravestone of someone they've lost. It's free to use, with optional coin-based decorations.

- **Design:** [docs/DESIGN.md](docs/DESIGN.md)
- **Roadmap:** [docs/ROADMAP.md](docs/ROADMAP.md)
- **Setup & accounts:** [docs/SETUP.md](docs/SETUP.md)

## Stack

React + Vite + TypeScript + Tailwind · Supabase (Postgres, Auth) · Hono server functions · Cloudflare Pages + R2 · Stripe

## Status

M0 implementation is underway. The local monorepo foundation is being built first; Supabase, Google OAuth, Cloudflare, and GitHub account configuration still need to be completed from [SETUP.md](docs/SETUP.md).

## Local development

Use Node.js 22 and pnpm, then run `pnpm install` and `pnpm dev` from the repository root. Copy `apps/web/.env.example` to `apps/web/.env.local` when configuring local services.
