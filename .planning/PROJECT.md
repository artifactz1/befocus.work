# beFocus - Dashboard Customization

## What This Is

beFocus is a focus/pomodoro timer web app with ambient sound mixing and a to-do list, usable
signed-in or as a guest. This milestone makes the dashboard personalizable: users pick their
background (solid color, uploaded, or pasted URL), typography, accent color, timer progress
style, layout density and atmospheric grain, and save those combinations as named themes they can
switch between. Signed-in users get persistent cross-device storage and media uploads; guests get
the same controls persisted locally.

## Core Value

A user can change how their focus dashboard looks and have that look still be there the next time
they open it - signed in on any device, or as a guest on the same browser.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from the existing codebase (.planning/codebase/). -->

- ✓ User can run a pomodoro timer with configurable work/break durations and session counts - existing
- ✓ Timer state survives navigation and persists per user via `/user/settings` - existing
- ✓ User can mix ambient sounds with per-track volume - existing
- ✓ User can manage a to-do list - existing
- ✓ User can sign in with email/password, Google, GitHub or Discord - existing
- ✓ User can use the full dashboard as a guest at `/guest` without an account - existing
- ✓ Dashboard renders a background driven by CSS custom properties (`--bg-*` contract) - existing

### Active

<!-- Current scope. Building toward these. -->

**Foundation (blocks everything below)**

- [ ] Server-fetched user settings actually reach the dashboard in production
- [ ] A single, correct Tailwind setup that the whole monorepo compiles against
- [ ] `bun run check` passes, so lint is a usable signal again

**Customization**

- [ ] User can open a customize panel from the dashboard and change the background
- [ ] User can choose a solid color background or a pasted URL
- [ ] User can upload their own background images and videos, within a quota
- [ ] User can change typography, accent color, text contrast, timer progress style, layout density and grain
- [ ] User sees changes live as a preview, and commits or discards them explicitly
- [ ] User can save the current look as a named theme and switch between saved themes
- [ ] User can start from a curated theme preset and reset to default
- [ ] Guest customizations persist locally and migrate to the account on first sign-in
- [ ] Every control works on mobile through a bottom sheet

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Light theme variants - `<html class='dark'>` is hardcoded and untangling `next-themes` is its own
  project; dark-only keeps this milestone about customization, not theming infrastructure.
- Public theme sharing or a theme marketplace - no multi-user surface exists yet; needs moderation
  and abuse handling that dwarfs the feature.
- Per-session theme overrides - themes are user-wide, one active at a time. Per-session state
  multiplies the persistence model for no demonstrated need.
- Server-side video transcoding, downscaling, and poster-frame generation - Workers are the wrong
  place for it and size limits make it unnecessary in v1.
- Total-storage-MB quota - file-count quota is enough to bound cost in v1.
- User-supplied custom CSS - arbitrary CSS injection is an XSS and support burden.
- Theme version migrations - the `version: 1` field exists so future migrations are possible; none
  are written now.
- Subscription tiers / paid customization - no billing exists in the product.

## Context

**Existing codebase.** Fully mapped in `.planning/codebase/` (STACK, INTEGRATIONS, ARCHITECTURE,
STRUCTURE, CONVENTIONS, TESTING, CONCERNS). Turborepo + Bun workspaces: Next.js 15 App Router
(`apps/next`), Hono on Cloudflare Workers (`packages/api`), Drizzle + Neon Postgres, better-auth,
shared ShadCN UI (`packages/ui`). Typed `hono/client` RPC between them.

**Prior design work.** `docs/superpowers/specs/2026-04-29-dashboard-customization-design.md` is a
detailed design spec for this exact feature, used here as a reference rather than a contract. Its
data model, API surface, R2 flow and UX decisions are sound and largely adopted; its scope was
re-confirmed with the user rather than inherited.

**Prior implementation attempt.** Branch `feat/customize` on GitHub holds an earlier, abandoned run
at this feature. It is reference only - no code carries over. This milestone starts clean from
`master` on `feat/customize-v2`.

**Half-built substrate.** The `--bg-image`, `--bg-image-size`, `--bg-image-position`,
`--bg-overlay-color`, `--bg-overlay-opacity` and `--bg-blur` custom properties already exist in
`packages/ui/src/globals.css:5-16` and are consumed by `AppBackground.tsx`, but nothing ever writes
them. The customize store is the missing writer, not a new contract.

**Known issues this milestone must clear first:**

- `apps/next/src/lib/server/getUserSettings.ts` reads the cookie `better-auth.session_token`, but
  better-auth prefixes it `__Secure-` in production. Server-side settings hydration therefore
  returns `null` on every production request. Any new per-user customization would inherit this.
- `apps/next/package.json` depends on `tailwind@^4.0.0`, an unrelated streaming library, not
  Tailwind. The app compiles only because `tailwindcss@3.4.17` is hoisted from `packages/ui`.
  Meanwhile `globals.css:211-222` uses v4-only `@theme inline` syntax that v3 silently ignores, and
  `--border` is defined twice with different values.
- `bun run check` fails: `biome.json` is a v1 schema but the only installed platform binary is
  `@biomejs/cli-darwin-arm64@2.4.13`, pulled transitively through wrangler → miniflare → sharp.
- `TimerInitializer.tsx` re-fetches `/user/settings` and re-hydrates, racing the server-fetched
  hydration in `DashboardShell`. New persisted state must not copy this pattern.

**Guests are first-class.** `/guest` is a complete working dashboard, not a marketing page. Guest
customization is a product requirement, not a nicety.

## Constraints

- **Tech stack**: Cloudflare Workers runtime - no persistent globals, no Node built-ins, per-request
  DB clients. Media uploads must not stream through the Worker.
- **Tech stack**: Biome only for lint/format. No ESLint, no Prettier.
- **Tech stack**: Bun is the package manager. `bun.lock` is canonical.
- **Testing**: No test runner is configured and none is being introduced by default - verification
  is manual/E2E against a dev server unless a phase justifies otherwise.
- **Compatibility**: Cross-subdomain auth cookies mean API and web must stay on one root domain
  (`api.befocus.work` + `www.befocus.work`).
- **Security**: User-uploaded media is untrusted input - content-type and size validated server-side
  before a presigned URL is issued, keys scoped per user, reads via signed URLs.
- **Performance**: Customization must paint without a flash of default styling; the existing
  server-fetched-then-hydrate pattern is the model.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Start clean on `feat/customize-v2`, keep `feat/customize` as GitHub reference | Earlier attempt accumulated unknowns; a fresh start on a mapped codebase is cheaper than archaeology | - Pending |
| Treat the April design spec as reference, re-decide scope | Priorities may have shifted since it was written; its conclusions still earn their place on merit | - Pending |
| Fix foundation issues as Phase 0, before feature work | The prod cookie bug and Tailwind mess sit directly under per-user theming; building on them guarantees rework | - Pending |
| Per-user customization synced via API, not device-local | Matches the existing `/user/settings` pattern and the product promise of cross-device persistence | - Pending |
| Full spec scope including R2 uploads and URL-paste backgrounds | Uploads are the feature users actually want; curated-only backgrounds are a demo, not a product | - Pending |
| Guests customize with localStorage, migrating on sign-in | `/guest` is a real dashboard; withholding customization there removes the main reason to sign up | - Pending |
| Solid backgrounds only; no curated images or gradients | Prototype review: gradients read as noise; Monkeytype-style minimalism with deep customization is the target | - Pending |
| Edge timer progress replaces the ring; Ruler, Ink and None offered | Prototype review: the circle behind the timer was rejected | - Pending |
| Panel opens from footer menu; Preview then Apply/Cancel; tweaked preset becomes unnamed Custom look | Prototype review recommendations, accepted | - Pending |
| Limits: 10 saved themes, 15 MB per upload, 80 MB quota, 30 s video | Prototype review recommendations, accepted | - Pending |
| Dark-only, no light theme | Untangling the hardcoded `dark` class is a separate project; bundling it would double this milestone | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-23 after initialization*
