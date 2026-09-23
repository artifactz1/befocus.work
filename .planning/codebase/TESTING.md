# Testing Patterns

**Analysis Date:** 2026-09-22

## Test Framework

**Runner:** None configured. Verified by direct inspection:
- No `vitest.config.*`, `jest.config.*`, `playwright.config.*`, or `cypress.config.*` anywhere in the repo (excluding `node_modules`).
- No `*.test.*` or `*.spec.*` files anywhere in the repo (excluding `node_modules`).
- No `test`/`test:*` script in the root `package.json` or in any workspace `package.json` (`apps/next`, `packages/api`, `packages/ui`, `packages/app`, `packages/types`).
- `packages/api/src/lib/create-app.ts` exports a `createTestApp<R>(router: R)` helper (wraps `createApp().route('/', router)`), but it is unreferenced anywhere else in the codebase - it's dead scaffolding for a test setup that was never built out, not evidence of an existing suite.

**Assertion Library:** None installed.

**Do not fabricate test commands.** `CLAUDE.md` at the repo root states this explicitly: "There is no test runner configured. Don't fabricate one - if you need to verify behavior, run the dev server and exercise the route, or write a one-off `bun run` script." Follow that guidance for any change you make - do not add a test framework speculatively as part of an unrelated feature; if a task explicitly calls for introducing tests, treat that as its own scoped decision, not something to smuggle into another diff.

## What Verification Actually Exists Today

There is no automated test suite. The actual verification surface for a change is:

1. **`bun run check-deps`** - `check-dependency-version-consistency` across the monorepo. Works.
2. **`bun run turbo:build`** (`turbo build`) - builds all workspaces with a `build` task (currently only `apps/next` defines one; `web:build` runs `next build`, which also runs Next's own type-check/lint pass as part of the build). **Verified working** as of 2026-09-22 (`✓ Compiled successfully`, static pages generated, no errors).
3. **`bun run turbo:lint`** / **`bun run check`** (which chains `format:check && lint && fix:check`) - **currently broken**, and not for a code-quality reason. Biome resolves to v2.4.13 at runtime (pulled in transitively via `packages/api/node_modules/wrangler/node_modules/miniflare/node_modules/sharp`, which pins `@biomejs/biome ^2.3.4`) even though the root `package.json` pins `^1.9.4` and the top-level `node_modules/@biomejs/biome` is in fact 1.9.4. `biome.json` is still written in the v1 schema (`files.ignore`, top-level `organizeImports`), which Biome v2 rejects outright with "Found an unknown key" before it evaluates a single file. Reproduced directly: `./node_modules/.bin/biome --version` → `2.4.13`; `bun x @biomejs/biome lint ./packages ./apps` → fails with the same schema error in every workspace (`@repo/ui:lint`, etc.).
   - Practical implication: **do not treat a failing `bun run check` / `bun run turbo:lint` as evidence your change broke something** - confirm the failure is the pre-existing schema error (mentions `biome.json:5:5` or `biome.json:68:3` and "Found an unknown key") before investigating further.
   - If asked to fix this, the direct fix is `bunx @biomejs/biome migrate` to rewrite `biome.json` to the v2 schema (or otherwise resolve the version conflict) - out of scope for a mapping pass, noted here for whoever picks it up.
4. **Manual dev-server exercise** - `bun run turbo:dev` / `bun run web` / `bun run api`, then click through the affected route(s) in the browser and/or hit the endpoint directly (`curl`, the OpenAPI docs, or the typed client in a scratch script). This is the primary way behavior gets verified in this codebase today.
5. **TypeScript itself** - both `apps/next` and `packages/api` have `strict: true` (`packages/typescript-config/base.json`, `packages/typescript-config/api.json`), and `apps/next`'s `next build` runs a full type-check as part of the build step. A `tsc --noEmit` (or `next build`) catching type errors is a meaningful and currently-working verification signal even without a test runner.

**Recommended verification checklist for a change in this repo, given the above:**
- `bun run turbo:build` (or the scoped equivalent, e.g. `cd packages/api && bun run deploy --dry-run` isn't available, so exercise via `bun run api`) to catch type errors and build breakage.
- Manually exercise the affected UI/route with the dev server running.
- Run `bun x biome format --write <changed files>` / `bun x biome check --formatter-enabled=false --linter-enabled=false --organize-imports-enabled=true <changed files>` scoped to just the files you touched if you need formatting/import-order feedback, since the repo-wide `check`/`lint` scripts are currently blocked by the schema issue above (scoping to specific files does not avoid the `biome.json` parse failure, so this only helps once that's fixed).

## Test File Organization

Not applicable - no test files exist to describe a location/naming convention for.

## Test Structure

Not applicable.

## Mocking

Not applicable. No mocking library (`msw`, `sinon`, `vitest`'s built-in mocks, etc.) is installed.

## Fixtures and Factories

Not applicable. `cd packages/api && bun run db:seed` (`bun run ./src/db/seed.ts`) exists for seeding a local dev database, which is the closest thing to test fixtures in the repo, but it's a dev-data seed script, not a test fixture factory. Check `packages/api/src/db/seed.ts` if you need example data shapes for manual verification.

## Coverage

Not applicable - no coverage tooling configured.

## Test Types

**Unit Tests:** None.

**Integration Tests:** None. The `createTestApp` helper in `packages/api/src/lib/create-app.ts` suggests an intended pattern (mount a single router in isolation via `createApp().route('/', router)` for request-level testing against a Hono app), but nothing in the repo currently exercises it. If integration tests are added for the API, this is the entry point to build on rather than re-deriving a test-app factory.

**E2E Tests:** None. No Playwright/Cypress config or `e2e/` directory.

## Common Patterns

Not applicable - no async testing, error testing, or other test-code patterns exist to document. If you are asked to add the first tests to this codebase, that is a deliberate, scoped setup decision (choice of runner, config, CI wiring) - don't infer one from absence and don't add a single ad-hoc test file without that decision being made explicitly.

---

*Testing analysis: 2026-09-22*
