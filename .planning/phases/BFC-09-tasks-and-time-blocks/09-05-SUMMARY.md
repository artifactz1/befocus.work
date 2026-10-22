---
phase: BFC-09-tasks-and-time-blocks
plan: 05
subsystem: ui
tags: [zustand, plan, guest-storage, saver]
requires: [09-02, 09-04]
provides:
  - usePlanActions (addFocus, removeFocus, nudge, ensurePlanSaved, markPlanUnsaved), usePlanBootstrap
  - GUEST_PLAN_KEY, parseGuestPlan, toGuestPlan
  - getUserPlan server helper, plan fields in the tasks store (plan, links, planLoad, planRevision, savedRevision)
  - List/Plan tabs and PlanTab (planning state)
affects: [09-06, 09-07]
key-files:
  created:
    - apps/next/src/hooks/usePlan.ts
    - apps/next/src/components/tasks/PlanTab.tsx
  modified:
    - apps/next/src/lib/tasks/tasks-storage.ts
    - apps/next/src/lib/tasks/tasks-storage.check.ts
    - apps/next/src/store/useToDoStore.tsx
    - apps/next/src/store/useDeckStore.ts
    - apps/next/src/lib/server/getUserTasks.ts
    - apps/next/src/app/(app)/layout.tsx
    - apps/next/src/components/tasks/TasksCard.tsx
    - apps/next/src/components/tasks/ListTab.tsx
    - apps/next/src/components/tasks/tasks.module.css
requirements-completed: [TSK-03]
completed: 2026-10-21
---

# Phase 9 Plan 05: Plan tab (planning state) Summary

The Tasks card gains List and Plan tabs; the Plan tab shows the session as a day column with derived clock times and add, remove and nudge, backed by a revision-tracked saver whose `ensurePlanSaved` guarantees the server holds the plan before any link write.

## Seam map

Guest storage: apps/next/src/lib/storage/browser-storage.ts: `readStored(key, schema)`, `writeStored(key, value)`, `defaultStorage()` (re-checked, still exported; 09-04 mapping holds).
Session id: `sessionId` on the timer store (`useTimerStore`, from `Run` in `lib/blocks/blocks`), a uuid created in `createTimerStore` before the first block; not persisted (re-checked, 09-02 mapping holds). No MISMATCH.

## Deviations from Plan

**1. [Design] Bootstrap lives in `usePlanBootstrap` (usePlan.ts), mounted from TasksCard, not in the store provider.** Child effects run before the provider's, so a provider-side guest read would run after seeding; one hook does guest read, seed, session-id adoption and the first save in order, and avoids a store-to-hook import cycle. TasksCard is rendered by both layouts regardless of open state.

**2. [Per 09-02 note] Session id adoption.** Because `sessionId` is not persisted, a stored plan (guest or server) whose sessionId differs from the timer's is adopted when `wentLive` is false, saved immediately in account mode. A plan with `wentLive: true` is left untouched (09-07 owns the live rules).

**3. [Rule 2] `hydratePlan` store action and Plan load-error retry.** The plan's error row needed a way to load the server plan after a failed render fetch; `hydratePlan` sets `savedRevision = planRevision` for a server plan. The bootstrap effect depends on `planLoad`, so seeding runs after a successful retry.

**4. [Rename/shape] `taskPlanSchema` has `wentLive`** (09-02); the saver PUTs `{ sessionId, blocks, wentLive }` so a save never resets it. `getUserPlan` stringifies link `taskId`s like tasks.

**5. [Discretion] Tabs styled with Tailwind utilities on `@repo/ui/tabs`** (twMerge overrides the defaults reliably); `--panel-lift` declared on the card root, because it was only defined in the Session card module. `--cell`, `--cell-break`, `--fill` declared there too (values chosen, unused until 09-07). Focus rows are a flex column of per-block 52px/1fr grid cells inside the fieldset (same visual column as one grid). Selected row uses `min-height` so the Assign panel can grow. No second footnote line ("Drag a task...") yet, that is a later plan.

**6. [Coordinator rule] Browser checks and screenshots not run** (need wrangler and env files). Plan tab and tab-switching were verified by type check and lint only.

## Verification

- `bun run src/lib/tasks/tasks-storage.check.ts` and `plan.check.ts` (cwd apps/next): both OK
- `bunx tsc --noEmit -p apps/next/tsconfig.json`: exit 0
- `bun run check`: exit 0
- `befocus.plan` appears only in tasks-storage.ts; no `updateSettings` in usePlan.ts or PlanTab.tsx; no `dangerouslySetInnerHTML` in components/tasks

## Pending human checks

- Guest at /guest (1440 and 390): Tasks > Plan shows 6 blocks, "6 blocks · 2 h 55 min", Block 1 range starts at the current minute, "Ends" matches the last gutter time. Add a focus block (7 blocks), nudge Block 2 to 30 min (later ranges shift by 5), remove Block 3 and Undo, reload: plan unchanged; tab reopens as List after reload. Arrow keys move the radio selection and the Assign panel follows. Add disabled at 16 with the limit helper. Settings minutes unchanged.
- Signed in (non-production DB; migration 0013 must be applied): same edits, plan on first paint after reload. Seed-save: `DELETE /user/plan`, reload, confirm exactly one `PUT /user/plan` (200) with no user edit, then `GET /user/plan` returns the seeded blocks. Break the API to see "Couldn't save your plan..." with Try again, and "Couldn't load your plan." retry.
- Pixel review of the tab track, selected ring, Assign panel and 44px touch targets. Screenshots `09-05-plan-1440.png`, `09-05-plan-390.png`, `09-05-plan-account-1440.png` not captured.

## Commits

- 864d8ca feat(BFC-09-05): plan storage, seeding and the revision-tracked saver
- e075e5d feat(BFC-09-05): List and Plan tabs with the planning day column

## Known Stubs

Every focus row says "No tasks" until 09-06 adds assignment. Intentional.

## Self-Check: PASSED
