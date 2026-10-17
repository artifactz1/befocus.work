---
phase: 03
slug: persistence-and-sync
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-16
---

# Phase 3 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source:
> `03-RESEARCH.md` "Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none by repo policy; `node:assert/strict` self-check scripts run with Bun (precedents `apps/next/src/lib/sounds/sounds.check.ts`, `apps/next/src/lib/customize/customize.check.ts`) |
| **Config file** | none |
| **Quick run command** | `bun run check && (cd apps/next && bun run src/lib/storage/browser-storage.check.ts && bun run src/lib/customize/persistence.check.ts)` |
| **Full suite command** | `bun run check && bun run turbo:build && (cd apps/next && bun run src/lib/storage/browser-storage.check.ts && bun run src/lib/customize/persistence.check.ts && bun run src/lib/customize/customize.check.ts && bun run src/lib/sounds/sounds.check.ts)` |
| **Estimated runtime** | ~120 seconds (build dominates) |

---

## Sampling Rate

- **After every task commit:** Run the quick run command (before the check scripts exist, `bun run check` alone).
- **After every plan wave:** Run the full suite command.
- **Before `/gsd:verify-work`:** Full suite green plus the manual UAT checkpoint in 03-06.
- **Max feedback latency:** 120 seconds.

---

## Per-Task Verification Map

Task IDs follow the PLAN files (03-PP-TT).

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SYN-03 | T-03-01 | storage access that throws, bad JSON and schema failures all read as `null`; writes report `false` | unit (assert) | `cd apps/next && bun run src/lib/storage/browser-storage.check.ts && bun run src/lib/sounds/sounds.check.ts` | W1 creates | pending |
| 03-01-02 | 01 | 1 | SYN-03, SYN-05, ENG-05 | T-03-01, T-03-02 | guest records re-validated with `lookSchema`; saver sends the latest look last; paint script ignores unknown names, unsafe values and off-list attrs, and escapes `<` | unit (assert) | `cd apps/next && bun run src/lib/customize/persistence.check.ts` | W1 creates | pending |
| 03-02-01 | 02 | 1 | SYN-01 | T-03-05 | generated migration only; tag suffix `_look_persistence` | static + build | `bun run check && bun run turbo:build` | yes | pending |
| 03-02-02 | 02 | 1 | SYN-01 | T-03-05 | human runs the duplicate check and the migration; Claude runs neither | checkpoint (human-action) | - | - | pending |
| 03-03-01 | 03 | 2 | SYN-01, SYN-02, SYN-05 | T-03-03, T-03-04 | every query filtered by the session user; body is `{ look }` only, strict schema | build | `bun run check && bun run turbo:build` | yes | pending |
| 03-03-02 | 03 | 2 | SYN-01, SYN-02, SYN-05 | T-03-03, T-03-04 | signed-in round trip: 200, read back, 422 on bad look, 401 without cookie, concurrent PUTs leave one theme | build + curl | plan's curl table | yes | pending |
| 03-04-01 | 04 | 3 | SYN-01, SYN-03, SYN-05 | T-03-02 | `saveLook` the only write path; `persisted` moves only on success | static + build | quick run command, then `bun run turbo:build` | yes | pending |
| 03-04-02 | 04 | 3 | ENG-05, SYN-01, SYN-03 | T-03-02 | embedded tokens escaped; guest script reads only `befocus.lookPaint` | build + HTML grep | `bun run turbo:build` plus the plan's `curl /guest` order check | yes | pending |
| 03-05-01 | 05 | 4 | SYN-03 | - | N/A | static + build | quick run command, then `bun run turbo:build` | yes | pending |
| 03-06-01 | 06 | 5 | ENG-05, SYN-01..03, SYN-05 | - | signed-in E2E uses a throwaway account | browser E2E | full suite command | yes | pending |
| 03-06-02 | 06 | 5 | ENG-05, SYN-01..03, SYN-05 | - | N/A | checkpoint (human-verify) | - | - | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `apps/next/src/lib/storage/browser-storage.check.ts` - fake storage, throwing storage (getter
  and methods), missing key, bad JSON, schema miss, write success and failure.
- [ ] `apps/next/src/lib/customize/persistence.check.ts` - guest look round trip with a fake
  storage, corrupt and stale records, saver ordering with controllable promises (rapid saves send
  first and last only; failure calls `onError` once and the next save retries), paint script run
  against a fake `document` / `localStorage` (allowed tokens applied, unsafe ones skipped, `</script>`
  in a value cannot break out).
- Both are created in Wave 1 with the modules, not a separate wave. No framework install (policy).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No default frame before the saved look | ENG-05 | paint timing | DevTools Performance with 4x CPU and Slow 3G, hard reload `/` signed in and `/guest`: the first frame with content has the saved background and accent |
| Second device | SYN-02 | needs a second browser profile | Apply a look in profile A, sign in as the same user in a fresh profile B: the first frame wears it |
| Rapid Apply | SYN-05 | real network timing | Throttle to Slow 3G, open, change, Done five times quickly with different backgrounds; after the requests settle, reload: the last one shows |
| Guest note, toasts | SYN-03, UI-SPEC | visual | 1440 and 390: note placement and wrap per UI-SPEC; block site data for the guest: toast once; offline signed-in Done: error toast |

Signed-in UAT needs the Phase 3 migration applied by a human (03-02). `/verify-ui` needs explicit
user permission; never schedule it automatically.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
