# External Integrations

**Analysis Date:** 2026-09-22

## APIs & External Services

**OAuth Identity Providers (active):**
- Google - configured via `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  - SDK/Client: better-auth `socialProviders` config
  - Wired in: `packages/api/src/lib/middlewares/auth/create-better-auth-config.ts` (`enabledProviders = ['discord', 'google', 'github']`)
- GitHub - configured via `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
  - Same wiring as above
- Discord - configured via `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`
  - Same wiring as above

**OAuth Identity Providers (env declared, NOT wired):**
- Apple - env vars `APPLE_CLIENT_ID`, `APPLE_WEB_CLIENT_ID`, `APPLE_PRIVATE_KEY`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` are declared in `packages/app/env/api.ts` and `packages/api/.dev.vars.example`, but `'apple'` is absent from the `enabledProviders` array in `create-better-auth-config.ts:9`. Apple sign-in is not actually offered to users despite full credential plumbing existing. To activate: add `'apple'` to `enabledProviders` and confirm better-auth's Apple provider accepts the extra key fields (`APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`) it currently ignores.

**Email/Password Auth:**
- better-auth's built-in `emailAndPassword: { enabled: true }` (`create-better-auth-config.ts`) - no external transactional email provider (Resend, SendGrid, Postmark, etc.) was found anywhere in the codebase, so password-reset/verification emails, if triggered by better-auth, have no configured delivery mechanism. No `resend`, `sendgrid`, `postmark`, `nodemailer`, or SMTP-related packages/imports exist.

**No other third-party APIs detected** - no Stripe, no analytics SDKs (PostHog, Mixpanel, Amplitude, Segment, GA), no error tracking SDKs (Sentry - despite `@hono/sentry` being declared as an unused dependency, see STACK.md), no push notification or messaging services.

## Data Storage

**Databases:**
- Neon serverless Postgres (HTTP driver)
  - Connection: `DATABASE_URL` env var (`packages/app/env/api.ts`)
  - Client: `@neondatabase/serverless` `neon()` + `drizzle-orm/neon-http` `drizzle()`, instantiated per-request in `packages/api/src/db/index.ts` (`initializeDrizzleNeonDB`) - no persistent connection pool, consistent with the Workers execution model (no module-level globals persist between requests)
  - ORM: Drizzle ORM (`drizzle-orm` `^0.38.2`), schema defined across `packages/api/src/db/tables/{auth,settings,sounds,tasks}.ts`, barrel-exported from `packages/api/src/db/schemas.ts`
  - Migrations: `drizzle-kit`, config at `packages/api/drizzle.config.ts` (dialect `postgresql`, output `src/db/drizzle`), run via `bun run db:migrate` / `db:push` / `db:generate` from `packages/api`
  - Seeding: `packages/api/src/db/seed.ts`, run via `bun run db:seed`

**File Storage:**
- None detected. No S3, R2, Cloudflare Images, or Vercel Blob usage found. No file upload endpoints identified in `packages/api/src/routes`.

**Caching:**
- None server-side (no Redis, Cloudflare KV, or similar). Client-side caching only via TanStack Query (`@tanstack/react-query`) in `apps/next` for server-state deduplication - not a shared/external cache.

## Authentication & Identity

**Auth Provider:**
- better-auth `^1.1.18` (self-hosted, not a hosted SaaS auth provider) - full control lives in this codebase
  - Server setup: `packages/api/src/lib/middlewares/auth/` (`initialize-better-auth.ts`, `create-better-auth-config.ts`, `handle-session.ts`, `better-auth-cors.ts`, `index.ts`)
  - Database adapter: `drizzleAdapter(dbInstance, { provider: 'pg' })` - persists sessions/accounts/users directly into the Neon Postgres DB via Drizzle (tables in `packages/api/src/db/tables/auth.ts`)
  - Plugin: `bearer()` (`better-auth/plugins`) - enables bearer-token auth in addition to cookies (used for non-browser/native clients or cases where cookies aren't viable)
  - Built-in rate limiting: `rateLimit: { window: 10, max: 100 }` inside better-auth's own config (`create-better-auth-config.ts`) - separate from and unrelated to the unused `RATE_LIMITER` env var (see STACK.md - that var is declared but has zero references in `packages/api/src`, likely a removed or planned Cloudflare Durable Object binding)
  - Session handling: `packages/api/src/lib/middlewares/auth/handle-session.ts` (`handleSessionMiddleware`) sets `c.var.user` and `c.var.session` (both nullable) on every request before the `requireAuth` gate
  - Auth route mount: `POST/GET /api/auth/**` in `packages/api/src/lib/create-app.ts` - delegates directly to `auth.handler(c.req.raw)`
  - Route protection: `requireAuth` middleware (`packages/api/src/lib/middlewares/auth/better-auth-cors.ts`) applied to `*` LAST in the middleware chain in `create-app.ts`, meaning **every route not explicitly mounted before it is auth-gated by default**
  - Client: `apps/next/src/lib/auth.client.ts` uses `better-auth/react`'s `createAuthClient`, exports `signIn`, `signUp`, `signOut`, `useSession`
  - Cross-subdomain cookies: `crossSubDomainCookies: { enabled: isProduction }`, cookie domain derived via `extractDomain(WEB_DOMAIN)` (`packages/api/src/lib/extractDomain.ts`, uses `tldts` package) - production requires API and web on the same root domain (e.g. `api.befocus.work` + `www.befocus.work`)
  - CORS: `betterAuthCorsMiddleware` (`packages/api/src/lib/middlewares/auth/better-auth-cors.ts`) restricts allowed origins to `WEB_DOMAIN` and `API_DOMAIN`, `credentials: true` for cookie support cross-origin

**Legacy/unused auth libraries** (declared as dependencies but not imported anywhere - see STACK.md for full list): `lucia`, `arctic`, `next-auth`, `@oslojs/crypto`, `@oslojs/encoding`, `@tsndr/cloudflare-worker-jwt`. These represent an earlier auth approach that was fully replaced by better-auth; safe to remove from `package.json`.

## Monitoring & Observability

**Error Tracking:**
- None active. `@hono/sentry` `^1.2.0` is declared in `packages/api/package.json` but not imported anywhere - no Sentry DSN, no `Sentry.init`, no `@sentry/*` core package present.

**Logs:**
- Hono's built-in `timing()` middleware (`packages/api/src/lib/create-app.ts`) adds `Server-Timing` response headers - the only active observability signal in the API.
- Structured logging via `pino`/`hono-pino` is declared as a dependency but disabled - `packages/api/src/lib/create-app.ts:30` has `// app.use(pinoLogger())` commented out, with a TODO linking to a Notion doc.
- No log aggregation service (Datadog, Logtail, Axiom, Cloudflare Logpush) configured. Cloudflare Workers `[observability]` block in `wrangler.toml` is commented out.

## CI/CD & Deployment

**Hosting:**
- Web app: Vercel (per README's Deployment section, `npx vercel --prod`; production URL `https://www.befocus.work` per prior project context). README also documents Netlify and Docker as alternative options, but no `netlify.toml` or `Dockerfile` was found in this scan - those instructions appear aspirational/unused.
- API: Cloudflare Workers, Worker name `befocus` (`packages/api/wrangler.toml`), deployed via `wrangler deploy --minify` (`packages/api` `deploy` script); production URL `https://api.befocus.work` per prior project context.

**CI Pipeline:**
- No `.github/workflows/*` files were found during this scan (the filtered `find` output showed hidden/rtk-recall entries only, no actual workflow YAML). If CI exists, it is not present in the standard `.github/workflows/` location, or was filtered from this environment's tool output. No CI config files were directly readable to confirm lint/build/deploy automation.

## Environment Configuration

**Required env vars (names only, no values read):**

API (`packages/api/.dev.vars`, validated in `packages/app/env/api.ts`):
- `DATABASE_URL`
- `WORKER_ENV` (schema) / `ENV` (actually read at runtime by `initialize-better-auth.ts` and `create-better-auth-config.ts` - naming drift, see STACK.md)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`
- `APPLE_CLIENT_ID`, `APPLE_PRIVATE_KEY`, `APPLE_TEAM_ID`, `APPLE_WEB_CLIENT_ID`, `APPLE_KEY_ID` (declared, unused - see above)
- `API_DOMAIN`
- `WEB_DOMAIN`
- `BETTER_AUTH_SECRET`
- `RATE_LIMITER` (declared `z.any()`, unused in code, no matching Worker binding configured)
- Additional vars present in `.dev.vars.example` but NOT in the validated `EnvSchema`: `JWT_SECRET`, `API_VERSION` (both effectively orphaned)

Web (`apps/next/.env.local`, validated in `packages/app/env/next.ts`):
- `API_URL` (server-only, declared but no consuming code found in this scan)
- `NEXT_PUBLIC_APP_URL` (client, consumed by `auth.client.ts` as `callbackURL`)
- `NEXT_PUBLIC_API_URL` (client, consumed by `api.client.ts` and `auth.client.ts` as the API base URL)

**Secrets location:**
- Local dev: `packages/api/.dev.vars` (git-ignored, templated by `.dev.vars.example`) and `apps/next/.env.local` (git-ignored, templated by `.env.example`)
- Production: Cloudflare Worker secrets via `wrangler secret put <NAME>` (per README's Deployment section) for the API; Vercel's environment variable dashboard for the web app (implied by Vercel hosting, not directly verifiable from repo files)

## Webhooks & Callbacks

**Incoming:**
- OAuth provider callbacks handled internally by better-auth's `POST/GET /api/auth/**` catch-all route (`packages/api/src/lib/create-app.ts`) - not custom webhook endpoints, but functionally the OAuth callback surface for Google/GitHub/Discord.
- No other incoming webhook endpoints (e.g. Stripe, payment processors) found in `packages/api/src/routes`.

**Outgoing:**
- None identified. No outbound webhook dispatch code found.

---

*Integration audit: 2026-09-22*
