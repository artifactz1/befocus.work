# Codebase Concerns

**Analysis Date:** 2026-09-22

Severity scale used below: **Critical** (data loss, prod-broken, or actively exploitable), **High** (silent prod bug or real security gap), **Medium** (real but bounded/degraded-mode issue), **Low** (cleanliness/DX).

## Known Bugs

**Server-side settings hydration is dead in production (cookie-name mismatch):**
- Symptoms: `getUserSettings()` (the CLAUDE.md-documented "server-fetched-then-hydrate" pattern) always returns `null` server-side once deployed to production, so `DashboardShell` never receives `initialSettings` and the timer falls back to hardcoded defaults (`25*60`/`5*60`) until/unless a client-side fetch happens later.
- Files: `apps/next/src/lib/server/getUserSettings.ts:24` and `:30` hardcode the cookie name `'better-auth.session_token'`; `apps/next/src/app/(app)/layout.tsx` (`getUserSettings()` call) and `apps/next/src/hooks/DashboardShell.tsx`.
- Root cause: better-auth prefixes the session cookie with `__Secure-` whenever `secure` cookies are active — which happens whenever `baseURL` (i.e. `API_DOMAIN`) starts with `https://`, per `node_modules/better-auth/dist/chunk-QQGZ3XGI.js:167-168,321-322`. In production the real cookie is `__Secure-better-auth.session_token`, not `better-auth.session_token`, so `cookieStore.get('better-auth.session_token')` (line 24) never matches and the function returns `null` at line 25 before ever calling the API.
- Trigger: any authenticated dashboard page load in production (the Next.js middleware itself works because `apps/next/src/middleware.ts:19` forwards the raw `cookie` header wholesale instead of reconstructing it by name — only `getUserSettings.ts` reconstructs the header manually and gets the name wrong).
- Workaround: none currently; the client presumably re-fetches settings after mount via TanStack Query, masking the bug behind a flash of default values.
- Severity: **Critical**. Directly relevant to a customization/theming feature: any new server-hydrated preference (theme, background, layout) built on this same pattern will inherit the identical bug unless the cookie lookup is fixed first (e.g. reuse better-auth's own cookie helper instead of a hardcoded literal).

**Duplicate `advanced` auth config silently overrides itself:**
- Symptoms: editing cookie/cross-domain settings in one of the two places where they're defined has no effect, because the second definition wins.
- Files: `packages/api/src/lib/middlewares/auth/create-better-auth-config.ts:44-53` defines `advanced.crossSubDomainCookies` / `defaultCookieAttributes`; `packages/api/src/lib/middlewares/auth/initialize-better-auth.ts:24-37` spreads `...betterAuthConfig` (line 25) and then re-declares an identical `advanced` block (lines 26-35) that overwrites the spread value.
- Severity: **High** — both blocks are currently identical so behavior is correct today, but this is a landmine: the next person to change cookie/cross-domain behavior will edit only one of the two files and get a silent no-op.

**Debug console.log statements shipped in application code paths:**
- Files:
  - `apps/next/src/app/(app)/layout.tsx:8` — logs the full user `Settings` object on every server-rendered dashboard request (`console.log("FETCHED FROM SERVER COMPONENT", data)`).
  - `apps/next/src/components/SessionCompleteModal.tsx:52` — `console.log("CHECKK", currentSession, sessions)`.
  - `apps/next/src/components/input/WorkDurationInput.tsx:13,15`, `BreakDurationInput.tsx:13,15`, `SessionsInput.tsx` (same pattern) — before/after increment logging on every click.
  - `apps/next/src/components/sounds/AlarmSoundsButton.tsx:56-59` — player lifecycle logging including `sound.url`.
- Impact: noisy server/browser logs in production, minor data exposure (user settings echoed into Cloudflare Worker logs), no functional bug.
- Severity: **Low**, but trivial to clean up — flag for removal in any phase touching these files.

## Tech Debt

**No test runner exists anywhere in the repo (pre-verified):**
- No `test` script in any `package.json`, no Jest/Vitest/Playwright config found. Any behavior change is verified manually only.
- Severity: **High** (structural, blocks confident refactors of auth/session code identified above).

**Dependabot reports 349 vulnerabilities on `master` as of 2026-09-22 (pre-verified):**
- Breakdown: 19 critical, 129 high, 167 moderate, 34 low.
- Severity: **Critical** — should be triaged before or alongside any large feature work, since a large customization phase will churn `package.json`/lockfiles anyway (good opportunity to fix in the same pass).

**Dead dependencies imported by zero source files (pre-verified):**
- `lucia`, `arctic`, `next-auth`, `@oslojs/*`, `@tsndr/cloudflare-worker-jwt`, `postgres`, `axios`, `hono-pino`/`pino`, `@hono/sentry`.
- `next-auth` is listed in `apps/next/package.json:16` as a runtime dependency despite the app using better-auth exclusively (`apps/next/src/lib/auth.client.ts`) — dead weight and a source of confusion for anyone searching for "how auth works here."
- `axios` (`apps/next/package.json:14`) is unused; all data fetching goes through the typed `hono/client` (`apps/next/src/lib/api.client.ts`) or `betterFetch`.
- Severity: **Medium** — inflates install size/attack surface (some of the 349 Dependabot vulns are almost certainly attributable to these unused packages) with zero functional benefit; safe, mechanical removal.

**Version drift across the monorepo (pre-verified, with exact versions):**
- `wrangler`: root `package.json:40` pins `^3.109.2`; `packages/api/package.json:43` pins `^4.113.0` — the package that's actually deployed (`packages/api`) is on a different major than the root devDependency.
- `react-dom`: root `package.json:38` pins `18.2.0`; `apps/next/package.json:20` and `packages/ui/package.json` pin `18.3.1`.
- `tailwindcss`: `packages/ui/package.json:27` pins real `tailwindcss@^3.4.13`. `apps/next/package.json:31` does **not** depend on `tailwindcss` at all — it depends on a package literally named `tailwind@^4.0.0` (devDependencies), which is an unrelated, unmaintained npm package, not Tailwind CSS. The actual Tailwind compiler used for `apps/next` comes transitively through `packages/ui`'s v3.4.13 (`apps/next/postcss.config.js` re-exports `@repo/ui/postcss.config`, and `apps/next/tailwind.config.ts` re-exports `@repo/ui/tailwind.config`, a v3-style JS config).
- Consequence: `packages/ui/src/globals.css:211-222` contains a Tailwind-v4-only `@theme inline { @keyframes shine {...} } }` block, but the CSS is actually compiled by Tailwind v3.4.13 (via the transitive dependency), which does not understand `@theme`. This block is dead/inert at best, or a PostCSS build risk at worst, and the misnamed `tailwind` package name means nobody currently gets the v4 upgrade they likely believe they have.
- Severity: **High** — a large theming/customization feature will almost certainly want to lean on Tailwind's theme system; whoever builds it needs to know the "v4" dependency is fake and the working compiler is v3.4.13, or resolve the migration properly first.

**Dead error-monitoring code path (Sentry/Toucan never wired up):**
- `packages/api/src/lib/middlewares/on-error.ts` defines `errorConverter(err, sentry: Toucan)` (line 23) which calls `sentry.captureException(error)` for 5xx errors and normalizes `ZodError`/generic errors into a typed `ApiError`. This function is exported but **never imported or called anywhere** in the codebase (confirmed via repo-wide grep for `errorConverter`).
- The `onError` handler that Hono actually registers (`create-app.ts:51`, defined at the bottom of `on-error.ts`) just does `c.json({ message: err.message, stack: ... })` directly — no Sentry capture, no `ZodError` formatting, no status-code normalization via `ApiError`.
- Impact: production 500s are not reported to Sentry despite `toucan-js` being installed and a capture path being written; the codebase looks monitored but isn't. Combined with "No CI pipeline" below, there is currently no automated signal when the API breaks in production.
- Files: `packages/api/src/lib/middlewares/on-error.ts` (whole file), `packages/api/src/lib/create-app.ts:51`.
- Severity: **High**.

**Near-duplicate input components (DRY violation, scattered unit-conversion math):**
- `apps/next/src/components/input/WorkDurationInput.tsx`, `BreakDurationInput.tsx`, and `SessionsInput.tsx` are ~95% identical copy-paste (only the label text and prop/type names differ — confirmed via `diff`).
- Duration math is inlined with magic numbers in each copy: `onChange(value * 60 + 300)` / `onChange(value * 60 - 300)` (minutes-to-seconds conversion plus a hardcoded 5-minute step), with no shared constant or helper — `apps/next/src/components/input/WorkDurationInput.tsx:12-24`. The store itself keeps duration in seconds (`apps/next/src/store/useTimerStore.tsx:33-36`, with a commented-out stale value `// workDuration: 10` left in place from an earlier minutes-based version).
- Severity: **Medium** — no bug today, but any change to step size, units, or validation has to be made identically in three files, and the unit conversion is undocumented and easy to get wrong next time.

**Env schema exists but is never validated at runtime, and doesn't match the fields the code actually reads:**
- `packages/app/env/api.ts` defines a Zod `EnvSchema` (`DATABASE_URL`, `WORKER_ENV`, OAuth client fields, etc.) and exports `type Env = z.infer<typeof EnvSchema>`, which is used purely as a TypeScript type for `AppContext['Bindings']` (`packages/api/src/types/app-context.ts:12`). The schema is **never** `.parse()`'d against the actual Worker environment at request time.
- The schema declares `WORKER_ENV` (line 8 of `env/api.ts`), but the code reads `env(c).ENV` in three places: `packages/api/src/lib/middlewares/auth/create-better-auth-config.ts:32`, `packages/api/src/lib/middlewares/auth/initialize-better-auth.ts:20`, and `c.env?.NODE_ENV` in `packages/api/src/lib/middlewares/on-error.ts` (`onError`). None of `ENV`/`NODE_ENV` appear in the Zod schema or in `packages/api/wrangler.toml` (the `[vars]` block is entirely commented out).
- Consequence if `ENV` (or `NODE_ENV`) is unset in the deployed Worker: `isProduction` evaluates to `false` everywhere it's checked, which means:
  1. `crossSubDomainCookies.enabled` and `defaultCookieAttributes.secure`/`domain` silently fall back to dev behavior in prod (`create-better-auth-config.ts:46-51`) — cookies could be issued non-secure / non-cross-subdomain in production.
  2. `onError` treats the deploy as non-production and includes `err.stack` in every 5xx JSON response (`on-error.ts`, the `stack: env === 'production' ? undefined : err.stack` line) — a stack-trace information-disclosure risk.
- This is a plausible contributor to concern #5 (placeholder OAuth secrets passing silently) — the same `isProduction` check gates `secure`/cross-domain cookie behavior that the placeholder-secret issue depends on.
- Severity: **High** (security-adjacent, unverified whether `ENV` is actually set via the Cloudflare dashboard outside this repo — cannot confirm from source alone, but nothing in the repo enforces or validates it).

**Placeholder OAuth secrets pass validation silently (pre-verified):**
- Production OAuth secrets were placeholder strings (`"addlater"`) for Google and Discord until 2026-09-22.
- `packages/api/src/lib/middlewares/auth/create-better-auth-config.ts:26` only checks `id.length > 0 && secret.length > 0` — any non-empty string, including a placeholder, is accepted and wired into `socialProviders`.
- `dbInstance: any` parameter (`create-better-auth-config.ts:19`) means the Drizzle adapter instance passed into better-auth config has no compile-time shape checking at all.
- Severity: **High**.

**Duplicated cookie/session config across two files (pre-verified — see Known Bugs above for the mechanism):**
- Files: `packages/api/src/lib/middlewares/auth/create-better-auth-config.ts:44-53`, `packages/api/src/lib/middlewares/auth/initialize-better-auth.ts:26-35`.

**Conflicting/duplicate CSS custom property definitions in the design-token stylesheet:**
- `packages/ui/src/globals.css` defines `--border` twice with different values: once inside `@layer base { :root { --border: 60 4% 80%; ... } .dark { --border: 12 6.5% 15.1%; } }` (lines 57, 87), and again **outside any `@layer`** at lines 203-209 (`:root { --border: 0 0% 69%; }` / `.dark { --border: 0 0% 25%; }`). Because Tailwind's `@layer` participates in native CSS cascade layers, unlayered declarations win over layered ones regardless of source order — so the layer-scoped `--border` values are dead code and the real border color in use is whichever of the two unlayered blocks (lines 203-209) the browser applies.
- `--border` is also referenced from `AppBackground.tsx`-adjacent theming work and is exactly the kind of token a customization feature would expect to be the single source of truth — right now there are two conflicting sources.
- Severity: **Medium** — visually harmless today (values are close), but a real trap for anyone building a theme editor on top of these tokens.

**"Background customization" CSS contract exists with no writer (half-built scaffold):**
- `packages/ui/src/globals.css:9` has a comment "Background customization contract — settings page writes to these" defining `--bg-image`, `--bg-image-size`, `--bg-image-position`, `--bg-overlay-color`, `--bg-overlay-opacity`, `--bg-blur` (lines 10-15).
- `apps/next/src/components/dashboard/AppBackground.tsx` renders layered `<div>`s that consume these vars via inline `style` (lines 8-26), with a comment "settings page will populate via CSS vars" (line 7).
- No settings UI, no `document.documentElement.style.setProperty(...)` call, and no persistence layer exist anywhere in the repo (repo-wide grep for `setProperty`, `bg-image`, `bg-overlay`, `bg-blur` outside these two files returns nothing). `apps/next/src/components/settings/` only contains session/sound/menu settings — no appearance/background settings component.
- Severity: **Medium** — not a bug (the vars default to `none`/`0` so nothing visibly breaks), but it's a stub for exactly the feature area this codebase map is likely being built for. Any customization phase should treat this contract as a starting point, verify the CSS-var names/units still make sense, and check whether the `--border` duplication above needs resolving first so new tokens aren't laid down on top of a broken cascade.

**Root layout hardcodes `dark` theme class, conflicting with `next-themes`' system detection:**
- `apps/next/src/app/layout.tsx:18` renders `<html lang='en' className={`dark ${interTight.variable}`} suppressHydrationWarning>` — the `dark` class is baked into the server-rendered HTML unconditionally.
- The same tree is wrapped in `<ThemeProvider attribute='class' defaultTheme='dark' enableSystem>` (line 20, `next-themes`), which is designed to toggle the `class` attribute on `<html>` itself based on `defaultTheme`/system preference/stored preference.
- Because the class is hardcoded server-side, `suppressHydrationWarning` is required to hide the mismatch when `next-themes` corrects the class client-side (e.g. `enableSystem` would want to remove `dark` for a user with a light OS preference), producing a theme flash on first paint for any user whose resolved theme isn't dark.
- `apps/next/src/provider/AppProviders.tsx:5` also imports `ThemeProvider` from `~/components/sessions/ThemeProvider` but never renders it (dead import) — the actually-active `ThemeProvider` is the one in `layout.tsx`. Two theme-provider references in the tree with only one wired up is confusing for whoever extends theming next.
- Severity: **High** for a customization/theming feature specifically — this is the first thing that needs to be untangled (remove the hardcoded class, decide whether `enableSystem` is even wanted, delete the dead `AppProviders.tsx` import) before building light/dark or user-selectable themes on top of it.

**Hardcoded hex colors bypass the CSS-variable theme system:**
- `apps/next/src/components/settings/SoundSettings.tsx:49` — `className='flex w-full bg-[#d0d1d0] dark:bg-[#2A2523]'` hardcodes both light and dark literal colors instead of using a `hsl(var(--...))` token from `globals.css`.
- Every other component in `apps/next/src/components/**` and `packages/ui/src/components/ui/**` was spot-checked and uses Tailwind's semantic classes (`bg-background`, `bg-muted`, `text-foreground`, etc.) that resolve through the CSS variables — this file is the outlier.
- Severity: **Low** (single call site) but directly blocks a "user picks a custom palette" feature — this element simply won't respond to a theme change.

**`any` typing on network/error boundaries (lint rule disabled, so nothing catches it):**
- `biome.json` sets `linter.rules.suspicious.noExplicitAny: "off"` and `security.noDangerouslySetInnerHtml: "off"` repo-wide (the latter currently has zero call sites, so it's a dormant, not active, risk).
- `apps/next/src/hooks/useSounds.ts:20,47,71` — `onSuccessCallback?: (newSound: any) => void` and two `onError: (err: any) => {...}` handlers.
- `packages/api/src/lib/middlewares/auth/create-better-auth-config.ts:19` — `dbInstance: any`.
- Severity: **Low** (small blast radius today — 4 occurrences repo-wide), but the lint rule being off means new `any` usage won't be flagged by `bun run check`.

**No CI pipeline:**
- `.github/workflows/` does not exist. `bun run check` (format/lint/organize-imports) and `bun run turbo:build` are only ever run locally/manually, if at all — nothing gates `master`.
- Combined with "no test runner" and "dead Sentry integration" above, there is no automated safety net anywhere between a developer's machine and production.
- Severity: **High**.

**Cloudflare Worker config has all `[vars]`/`[observability]` commented out:**
- `packages/api/wrangler.toml` — the entire `[vars]` block (lines 7-8), `[observability]` block (lines 26-28), and `compatibility_flags = ["nodejs_compat"]` (line 5) are commented out.
- No Worker-level observability (Cloudflare's built-in logs/traces) is enabled, which — combined with the dead Sentry path above — means there is genuinely no production error visibility configured in this repo.
- Severity: **Medium** (can't verify what's configured via the Cloudflare dashboard outside the repo, but nothing in-repo turns it on).

**Auth session is re-fetched twice per `/api/auth/get-session` call (extends pre-verified concern #7):**
- `packages/api/src/lib/create-app.ts:43` registers `handleSessionMiddleware` (which itself calls `auth.api.getSession(...)`, `handle-session.ts:21`) on `'*'` — including the better-auth route mount at line 46-49 (`/api/auth/**`).
- This means a request to `GET /api/auth/get-session` (exactly what `apps/next/src/middleware.ts:16` calls on nearly every Next.js navigation) triggers `auth.api.getSession` **twice**: once inside `handleSessionMiddleware` and again inside better-auth's own `get-session` handler.
- Severity: **Medium** — doubles DB round-trips for the single most frequently called endpoint in the system (every page navigation, per pre-verified concern #7).

## Security Considerations

**Stack traces potentially exposed in production error responses:**
- Risk: `packages/api/src/lib/middlewares/on-error.ts` (`onError`) only omits `err.stack` from JSON responses when `env === 'production'`, where `env` is read from `c.env?.NODE_ENV || process.env?.NODE_ENV` — a variable name that (per the Env-schema finding above) doesn't appear to be set anywhere in this repo's Worker config.
- Files: `packages/api/src/lib/middlewares/on-error.ts`.
- Current mitigation: none verifiable from source; depends entirely on whatever is configured in the Cloudflare dashboard outside this repo.
- Recommendation: read a single, schema-validated `ENV`/`WORKER_ENV` value consistently (fix the `WORKER_ENV` vs `ENV` mismatch noted above), and validate it via the existing but currently-unused `EnvSchema` in `packages/app/env/api.ts` at Worker startup.

**Placeholder OAuth credentials accepted without any real validation (pre-verified):**
- Files: `packages/api/src/lib/middlewares/auth/create-better-auth-config.ts:24-30`.
- Current mitigation: none — any non-empty string passes.
- Recommendation: validate secret format/length against provider-specific expectations, or at minimum fail startup loudly (not silently) when a known-placeholder value is detected.

**Cross-subdomain cookie / secure-cookie behavior gated on an env var that may not exist at runtime:**
- Files: `create-better-auth-config.ts:32,46-51`, `initialize-better-auth.ts:20,26-35`.
- Recommendation: same as above — validate `Env` at startup so a misconfigured/missing `ENV` fails loudly instead of silently downgrading cookie security.

## Performance Bottlenecks

**Double `getSession` DB round-trip on every session check (see Tech Debt above):**
- Files: `packages/api/src/lib/create-app.ts:43,46-49`, `packages/api/src/lib/middlewares/auth/handle-session.ts:21`.

**Next.js middleware fetches `/api/auth/get-session` on nearly every navigation (pre-verified concern #7):**
- Files: `apps/next/src/middleware.ts:16-21`. Combined with the double-fetch above, a single page navigation can trigger the equivalent of 2 full session lookups against the auth backend before the page even renders.

## Fragile Areas

**`DashboardShell` is the only settings-hydration integration point, and it's incomplete:**
- Files: `apps/next/src/hooks/DashboardShell.tsx` (note: this is a component, not a hook — it lives in `hooks/`, which is a naming/location inconsistency worth fixing before adding more shell-level state).
- Only `workDuration`, `breakDuration`, and `sessions` are hydrated from server-fetched settings (lines 19-23); sounds and to-do state are not part of this contract, and neither would a future theme/appearance setting be, without manually extending this `useEffect`.
- If `initialSettings` is `null` (which — per the Known Bugs section — it always is in production today), hydration silently never runs and the app falls back to Zustand's hardcoded defaults with no error surfaced to the user or logs.
- Test coverage: none (no test runner in the repo at all).

**`packages/api/src/routes/user/user.handler.ts` (441 lines, largest source file in the repo):**
- Contains 14 route handlers (`getUser`, `getUserSession`, `getUserAccounts`, `getUserSettings`, `createUserSettings`, `updateUserSettings`, `getUserSounds`, `createUserSounds`, `deleteUserSound`, `updateUserSounds`, `getUserTasks`, `createUserTask`, `updateUserTask`, `deleteUserTask`) in a single file with no sub-grouping.
- Not a bug, but the largest, most business-logic-dense file has zero test coverage and is a natural place to introduce regressions when adding new settings fields (e.g. for a theming feature, which would likely extend `createUserSettings`/`updateUserSettings`).

## Scaling Limits

Not applicable — no load/capacity data available from source inspection alone (no monitoring wired up per the Security/Tech Debt sections above, so there is no way to derive current capacity from this repo).

## Dependencies at Risk

See "Dead dependencies" and "Version drift" under Tech Debt above for the specific packages and versions. In addition:

**`tailwind@^4.0.0` in `apps/next/package.json:31` is very likely the wrong package entirely** (see Tech Debt) — this should be either removed (if the v3 config via `packages/ui` is intentional) or replaced with a real `tailwindcss@^4` migration, not left as a misnamed no-op dependency.

## Missing Critical Features

**No environment-variable validation at Worker startup:**
- `packages/app/env/api.ts` defines a complete Zod schema that is never invoked. Adding one `EnvSchema.parse(c.env)` check (with a clear fail-fast error) would have caught the `ENV`/`WORKER_ENV` naming mismatch and the placeholder-OAuth-secret issue before they reached production.

**No CI pipeline** — see Tech Debt above.

## Test Coverage Gaps

**Everything.** There is no test runner configured anywhere in the monorepo (pre-verified concern #1). Highest-risk untested surfaces, in priority order for a customization/theming phase:
- `apps/next/src/lib/server/getUserSettings.ts` — currently has a confirmed production bug (see Known Bugs) that a single integration test against a real better-auth cookie would have caught.
- `packages/api/src/routes/user/user.handler.ts` — all settings/sounds/tasks CRUD, especially `createUserSettings`/`updateUserSettings` (lines 95-161), which a theming feature will likely extend.
- `packages/api/src/lib/middlewares/auth/*` — cookie/session config, given the duplicate-config and env-var findings above.
- Priority: **High** for the auth/settings surfaces above; **Medium** for everything else given the "simplest direct path" project guidance (no test runner should be introduced speculatively — but any phase that touches the settings/auth files above should add at minimum a one-off verification script, per this repo's own `CLAUDE.md`: "write a one-off `bun run` script").

---

*Concerns audit: 2026-09-22*
