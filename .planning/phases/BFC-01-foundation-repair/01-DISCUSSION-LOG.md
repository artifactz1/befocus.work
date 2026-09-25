# Phase 1: Foundation Repair - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-09-24
**Phase:** 1-Foundation Repair
**Areas discussed:** Tailwind 3 vs 4, Biome pin vs upgrade, Hydration owner, Prod verification

---

## Tailwind 3 vs 4

| Option | Description | Selected |
|--------|-------------|----------|
| Stay on v3.4 | Replace bogus dep, move `shine` keyframes into config, zero visual churn | ✓ |
| Migrate to v4 now | CSS-first config, animate plugin swap, ShadCN token rework | |

| Option (`--border`) | Description | Selected |
|--------|-------------|----------|
| Keep what renders today | `0 0% 25%`, no visual change | ✓ |
| Keep ShadCN layered value | `12 6.5% 15.1%`, visible change | |
| You decide | Browser check | |

---

## Biome pin vs upgrade

| Option | Description | Selected |
|--------|-------------|----------|
| Upgrade to Biome 2 | `biome migrate`, fixes root cause on all OSes | ✓ |
| Pin 1.9.4 platform binary | Smallest diff, per-OS pinning | |

| Option (new lint) | Description | Selected |
|--------|-------------|----------|
| Fix all in this phase | `bun run check` clean; churn in own commit | ✓ |
| Disable noisy new rules | Revisit later | |

---

## Hydration owner

| Option | Description | Selected |
|--------|-------------|----------|
| Server seeds cache | Server fetch seeds query cache + Zustand; delete client hydrators | ✓ |
| Server to Zustand only | Drop client queries entirely | |

| Option (no flash) | Description | Selected |
|--------|-------------|----------|
| Restructure if needed | Store holds user values during SSR | ✓ |
| Minimal change only | Accept residual flash | |

| Option (no row / failure) | Description | Selected |
|--------|-------------|----------|
| Render defaults, no refetch | Null -> defaults; errors logged server-side | ✓ |
| Client retries on failure | Breaks one-read criterion | |

---

## Prod verification

| Option | Description | Selected |
|--------|-------------|----------|
| Local HTTPS repro + prod confirm | Repro with secure cookies locally, confirm on prod | ✓ |
| Prod only | Deploy and check | |

| Option (deploy) | Description | Selected |
|--------|-------------|----------|
| I deploy, Claude verifies | Human checkpoint for deploy | ✓ |
| Claude may deploy | Executor runs deploy | |

| Option (cookie fix) | Description | Selected |
|--------|-------------|----------|
| Forward all request cookies | No hardcoded cookie name | ✓ |
| better-auth cookie helper | Forward only session cookie | |
| You decide | Planner picks | |

---

## Claude's Discretion

- Zero-flash store init mechanism, query-cache seeding method, plan split/order.

## Deferred Ideas

- Tailwind v4 migration (future phase).
- Wrangler 3 -> 4 bump (Phase 5 if needed).
