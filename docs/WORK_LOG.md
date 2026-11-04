# Implementation work log

Updated: 2026-11-04

## Current stopping point

M0 has started. The local workspace scaffold and initial profile migration are in progress. The Clean Architecture guidance is committed separately as `12c916d` (`docs: add clean architecture guidance`). Keep implementation changes in their own milestone commits.

## Local foundation in this branch

- pnpm workspace for `apps/web`, `apps/api`, and `packages/shared`, with a generated lockfile.
- React/Vite/Tailwind web shell, design tokens, English i18next resources, and a starter responsive garden illustration.
- Hono API shell, shared Zod profile schema, and the first `profiles` migration with RLS and protected admin/status fields.
- Strict TypeScript, ESLint, Prettier, Dependabot, GitHub Actions CI/security workflows, Cloudflare security headers, and example environment files.
- `docs/ASSETS.md` records that the starter scene is CSS-only and no outside art license is in use.
- Lint, workspace typechecks, and the production web build pass. The production dependency audit reports no known vulnerabilities.

## Next work

1. Complete local Supabase CLI setup and verify the initial migration against the local database.
2. Set up the repository's Gitleaks pre-commit hook after the local Gitleaks binary is installed.
3. Complete account-dependent setup from `SETUP.md`: Supabase project, Google OAuth, Cloudflare Pages, Sentry, and GitHub Actions settings.
4. Add M0's Playwright mobile/desktop project configuration and finish the responsive foundation.
5. Choose and record the first licensed art pack/style.
6. Before M1 notes, add a safe public profile projection so content can show `display_name` without exposing private profile fields.

## Environment notes

- The shell does not expose a system `node` command. A bundled Node 24 runtime was used for package installation; the project targets Node 22.13+ (or Node 24+) and `.nvmrc` selects Node 22.
- pnpm 11 requires explicit approval for package install scripts. Only `esbuild` and `workerd` have been approved in `pnpm-workspace.yaml` because Vite and Wrangler need them.
- No real credentials or secret values have been added. The example env files contain names only.
- No tests have been added or run.
- The SQL migration has not been applied yet because Supabase CLI is not installed in this environment.
- The GitHub Actions workflows are committed locally but have not run on GitHub; repository/account configuration remains pending.
