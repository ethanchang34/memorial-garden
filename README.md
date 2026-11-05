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

Use Node.js 22 and pnpm. From the repository root:

| Command                                                          | What it does                                                                              |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm install`                                                   | Install dependencies                                                                      |
| `pnpm dev`                                                       | Web app at http://localhost:5173 (add `--host` to test from your phone on the same Wi-Fi) |
| `pnpm --filter @memorial-garden/api dev`                         | API Worker locally                                                                        |
| `pnpm test`                                                      | Unit tests                                                                                |
| `pnpm db:start` / `pnpm db:test` / `pnpm db:stop`                | Local Supabase database (Docker) and its pgTAP tests                                      |
| `pnpm format:check && pnpm lint && pnpm typecheck && pnpm build` | Everything CI checks                                                                      |

Copy `apps/web/.env.example` to `apps/web/.env.local` when configuring local services.
