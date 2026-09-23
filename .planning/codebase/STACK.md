# Technology Stack

**Analysis Date:** 2026-09-22

## Languages

**Primary:**
- TypeScript 5.5.4 (root devDependency) / `^5` (`apps/next/package.json`) / `^5.3.3` (`packages/ui/package.json`) - used across all workspaces, strict mode enabled

**Secondary:**
- None. No Python, Go, Rust, or other languages detected.

## Runtime

**Environment:**
- Bun (canonical package manager, `packageManager: "bun@1.1.20"` in `package.json`) - used for install, scripts, and `apps/next` dev server
- Cloudflare Workers runtime - `packages/api` executes as a Worker (see `packages/api/wrangler.toml`, `name = "befocus"`, `compatibility_date = "2024-12-24"`)
- Node.js `>=18` declared in `package.json` `engines` (fallback/tooling compatibility, not the primary runtime for the API)

**Package Manager:**
- Bun `1.1.20` (root `package.json` `packageManager` field)
- Lockfile: `bun.lock` present (171.8K) at repo root - canonical lockfile
- `package-lock.json` files also present at root, `packages/api/package.json-lock.json`-equivalent, and `packages/typescript-config/package-lock.json` - stale/unused artifacts since Bun is the assumed manager (README and CLAUDE.md both say Bun is canonical)

## Frameworks

**Core:**
- Next.js `15.1.9` (`apps/next/package.json`) - App Router frontend, patched for CVE-2025-66478 (react2shell RCE) per recent commit `23de71e`
- React `18.3.1` (App), React DOM `18.3.1` (App) - UI library
- Hono `^4.6.14` (`packages/api/package.json`) - API framework running on Cloudflare Workers
- `@hono/zod-openapi` `^0.18.4` - OpenAPI route definitions with Zod schema validation, wraps Hono's router (`packages/api/src/lib/create-app.ts`)
- `@hono/zod-validator` `^0.4.2` - request validation middleware
- Drizzle ORM `^0.38.2` + `drizzle-kit` `^0.30.1` + `drizzle-zod` `^0.7.0` - database ORM, migrations, and Zod schema generation from Drizzle tables
- better-auth `^1.1.18` (root `package.json`, hoisted dependency shared by both API and web) - authentication framework

**Testing:**
- None configured. No Jest, Vitest, Playwright, or similar test runner/config found anywhere in the repo. `CLAUDE.md` confirms: "There is no test runner configured."

**Build/Dev:**
- Turborepo `^2.3.3` (root devDependency) - monorepo task orchestration (`turbo.json` defines `build`, `lint`, `format`, `check-types`, `dev` tasks)
- Wrangler - Cloudflare Workers CLI/dev server/deploy tool. **Version mismatch:** root `package.json` pins `^3.109.2` while `packages/api/package.json` (devDependency) pins `^4.113.0`. The API's own `wrangler dev`/`deploy` scripts resolve to v4 via workspace hoisting rules; the root-level v3 pin is stale/unused for the API's actual dev/deploy flow.
- Biome `^1.9.4` (root dependency, schema pinned to `1.3.3` in `biome.json`) - single tool for linting AND formatting. **No ESLint or Prettier are used for JS/TS** (per `CLAUDE.md`); note `packages/api/package.json` `fix` script does invoke `prettier '**/*.{json,yaml}'` for YAML/JSON files only, but `prettier` is not a declared dependency anywhere - likely relies on a globally available binary or is dead/broken.
- `check-dependency-version-consistency` (root `check-deps` script) - lints for cross-workspace version drift (see Version Inconsistencies below - this check is evidently not being enforced in CI, or these mismatches predate/bypass it)

## Key Dependencies

**Critical:**
- `zod` `^3.24.1` (`packages/api`) - schema validation, paired with `@hono/zod-openapi` for typed request/response contracts and with `drizzle-zod` for DB-schema-derived validators
- `@neondatabase/serverless` `^0.10.4` - HTTP-based Postgres driver for Neon, used via `drizzle-orm/neon-http` (`packages/api/src/db/index.ts`)
- `@tanstack/react-query` `^5.80.6` (`apps/next`) - server-state/data-fetching cache, wired in `apps/next/src/provider/AppProviders.tsx`
- `zustand` `^5.0.2` (`apps/next`) / `^5.0.3` (`packages/app`) - client state stores (`apps/next/src/store/`)
- `framer-motion` `^12.4.7` (root) / `motion` `^12.17.0` (`packages/ui`) - two different animation packages present; `framer-motion` is the legacy-named package (now a thin wrapper around `motion`), both declared separately rather than consolidated
- `@paralleldrive/cuid2` `^2.2.2` (root) - ID generation, likely used in Drizzle table defaults

**Infrastructure:**
- `tldts` `^6.1.78` (`packages/api`) - domain parsing, used by `extractDomain` helper for cross-subdomain cookie scoping (`packages/api/src/lib/extractDomain.ts`, referenced from `create-better-auth-config.ts`)
- `@scalar/hono-api-reference` `^0.5.172` - serves interactive OpenAPI docs UI for the Hono API
- `http-status` `^2.0.0` - HTTP status code/phrase constants (note: `packages/api/src/lib/http-status-codes.ts` and `http-status-phrases.ts` also exist as local files, suggesting possible duplication with this package)
- `zod-error` `^1.5.0` - formats Zod validation errors

**Declared but unused (zero imports found anywhere in `packages/` or `apps/`):**
- `lucia` `^3.2.2` (`packages/api`) - legacy auth library, superseded by better-auth
- `arctic` `^2.3.3` (`packages/api`) - OAuth client library, superseded by better-auth's built-in social providers
- `next-auth` `^4.24.11` (`apps/next`) - another legacy/competing auth library, superseded by better-auth's React client (`apps/next/src/lib/auth.client.ts`)
- `@oslojs/crypto` `^1.0.1`, `@oslojs/encoding` `^1.1.0` (`packages/api`) - low-level crypto helpers commonly paired with Lucia, unused
- `@tsndr/cloudflare-worker-jwt` `^3.1.3` (`packages/api`) - JWT library, unused (better-auth handles sessions)
- `postgres` `^3.4.5` (`packages/api`) - TCP Postgres driver, unused (the app uses `@neondatabase/serverless`'s HTTP driver instead)
- `crypto` `^1.0.1` (`packages/api`) - unnecessary npm shim for Node's builtin `crypto` module; not imported directly anywhere
- `axios` `^1.7.9` (`apps/next`) - unused; API calls go through the typed `hono/client` RPC (`apps/next/src/lib/api.client.ts`) which uses native `fetch`
- `hono-pino` `^0.7.2`, `pino` `^9.6.0` (root) - logging library, referenced only in a commented-out line (`packages/api/src/lib/create-app.ts:30` - `// app.use(pinoLogger())`), not active
- `@hono/sentry` `^1.2.0` (`packages/api`) - error tracking integration, unused; no `@sentry/*` packages or Sentry DSN config found anywhere

These should be removed from their respective `package.json` files or wired up if genuinely planned for future use.

## Configuration

**Environment:**
- Two separate env files required locally (never read their contents - only names captured here):
  - `packages/api/.dev.vars` (Worker secrets; example at `packages/api/.dev.vars.example`) - also read directly by `packages/api/drizzle.config.ts` via `dotenv` for local migrations
  - `apps/next/.env.local` (Next.js env; example at `apps/next/.env.example`)
- API env is Zod-validated via `packages/app/env/api.ts` (`EnvSchema`, exported as `Env` type, consumed by `packages/api/src/types/app-context.ts` as the Worker `Bindings` type). Declared vars: `DATABASE_URL`, `WORKER_ENV`, `GITHUB_CLIENT_ID`/`SECRET`, `GOOGLE_CLIENT_ID`/`SECRET`, `DISCORD_CLIENT_ID`/`SECRET`, `APPLE_CLIENT_ID`, `APPLE_PRIVATE_KEY`, `APPLE_TEAM_ID`, `APPLE_WEB_CLIENT_ID`, `APPLE_KEY_ID`, `API_DOMAIN`, `BETTER_AUTH_SECRET`, `WEB_DOMAIN`, `RATE_LIMITER` (typed `z.any()`, presumed Durable Object binding, but not referenced anywhere in `packages/api/src` - dead config).
  - Note: `.dev.vars.example` also lists `ENV`, `JWT_SECRET`, and `API_VERSION` which are **not** in the Zod `EnvSchema` - the example file and the validated schema have drifted. Code actually reads `env(c).ENV` (in `initialize-better-auth.ts` and `create-better-auth-config.ts`) to determine `isProduction`, but `EnvSchema` declares `WORKER_ENV` instead of `ENV` - a naming mismatch between the documented schema and what's actually read at runtime.
- Next.js env is validated via `@t3-oss/env-nextjs` in `packages/app/env/next.ts`: server var `API_URL`, client vars `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL`. Frontend code (`apps/next/src/lib/api.client.ts`, `auth.client.ts`) actually reads `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_APP_URL` with `localhost` fallbacks - `API_URL` (server-only) does not appear to be consumed by any Server Component/action found during this scan.

**Build:**
- `apps/next/next.config.mjs` - minimal config, only `transpilePackages: ['@repo/ui', '@repo/api']`
- `packages/api/wrangler.toml` - Worker name `befocus`, entry `src/index.ts`, no bindings currently active (KV/R2/D1/AI/Durable Object binding blocks all commented out, including a `RATE_LIMITER` binding that the env schema anticipates but that isn't configured)
- `packages/api/drizzle.config.ts` - Drizzle Kit config, Postgres dialect, schema at `packages/api/src/db/schemas.ts`, migrations output to `packages/api/src/db/drizzle`
- `biome.json` (repo root) - single formatter+linter config for the whole monorepo (single quotes, no semicolons, 100-col width, trailing commas everywhere, 2-space indent)
- TypeScript configs are composed via `packages/typescript-config` (`base.json`, `nextjs.json`, `api.json`, `react-library.json`); `apps/next/tsconfig.json` extends `nextjs.json`, `packages/api/tsconfig.json` extends `api.json`, both define path aliases (`~/*`, `@repo/api/*`, `@repo/ui/*`, `@repo/types/*` for the app; `@repo/api/*`, `src/app/*` for the API)

## Platform Requirements

**Development:**
- Bun `1.1.20`+ and Node `>=18` (root `engines`)
- Cloudflare account + `wrangler login` for local Worker dev (`bun run api` → `wrangler dev`)
- Neon Postgres database (connection string in `.dev.vars`)
- Local `.dev.vars` and `.env.local` files populated from the `.example` templates

**Production:**
- Web: Vercel, deployed from `apps/next` (per README's Deployment section and prior conversation context: `https://www.befocus.work`)
- API: Cloudflare Workers, deployed via `wrangler deploy --minify` (`packages/api` `deploy` script), Worker named `befocus` (per `wrangler.toml`), served at `https://api.befocus.work` (per prior context)
- Database: Neon serverless Postgres (HTTP driver, no persistent connections - see `packages/api/src/db/index.ts`, a fresh `neon()` client is constructed per-request since Workers have no persistent module-level state)
- Cross-subdomain cookies require API and web to share a root domain in production (`extractDomain(WEB_DOMAIN)` in `create-better-auth-config.ts` and `initialize-better-auth.ts`)

## Version Inconsistencies

These are real drift between workspaces, not intentional per-package pinning:

- **React DOM:** root `package.json` pins `react-dom@18.2.0` while `apps/next/package.json` pins `react-dom@18.3.1`. Since these are separate installs (root deps vs. workspace deps), the mismatch is latent but should be aligned to avoid subtle hydration/version-skew bugs.
- **Tailwind CSS:** `apps/next/package.json` declares `"tailwind": "^4.0.0"` (note: this is the wrong package name - `tailwind` is not the real Tailwind package; the actual package is `tailwindcss`. This dependency is almost certainly a typo/no-op) while `packages/ui/package.json` correctly declares `"tailwindcss": "^3.4.13"`. This means `apps/next` has no real Tailwind v4 install at all despite the version-4-looking pin - the app's Tailwind processing is effectively coming from `packages/ui`'s v3.4 install and shared `postcss.config.mjs`/`tailwind.config.ts` exports.
- **Wrangler:** root `package.json` pins `^3.109.2`, `packages/api/package.json` (devDependency) pins `^4.113.0`. The API workspace's own scripts resolve v4 correctly via Bun's workspace hoisting, but the root pin is stale and should be removed or aligned.
- **`check-dependency-version-consistency`** is installed as a script (`check-deps`) specifically to catch this class of issue, but the above mismatches indicate it either isn't run in CI or its findings aren't being acted on.

---

*Stack analysis: 2026-09-22*
