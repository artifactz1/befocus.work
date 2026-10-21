---
phase: BFC-09-tasks-and-time-blocks
plan: 03
subsystem: ui
tags: [zustand, tasks, quiet-deck]
requires: [09-01]
provides:
  - TasksStoreProvider, useTasksStore, useTasksStoreApi, createTasksStore
  - useTaskActions (add, edit, toggle, archive, restore), TasksButton, TasksCard, ListTab
affects: [09-04, 09-05, 09-07]
key-files:
  created:
    - apps/next/src/components/tasks/TasksButton.tsx
    - apps/next/src/components/tasks/TasksCard.tsx
    - apps/next/src/components/tasks/ListTab.tsx
    - apps/next/src/components/tasks/tasks.module.css
  modified:
    - packages/types/tasks.ts
    - apps/next/src/store/useToDoStore.tsx
    - apps/next/src/hooks/useTasks.ts
    - apps/next/src/hooks/useTimerKeyboard.ts
    - apps/next/src/components/helper/PrefetchUserTasks.tsx
    - apps/next/src/components/settings/MenuSettings.tsx
    - apps/next/src/components/settings/MenuSettingsMobile.tsx
    - apps/next/src/app/(app)/layout.tsx
    - apps/next/src/app/guest/GuestShell.tsx
requirements-completed: [TSK-01]
completed: 2026-10-21
---

# Phase 9 Plan 03: Tasks card and List tab Summary

The footer notebook button opens a Tasks card on the shared deck value, with a List tab backed by a per-request tasks store and one optimistic actions hook for guests and signed-in users.

## Deviations from Plan

**1. [Rename] Guest layout.** The plan names `app/guest/layout.tsx`; the providers live in `app/guest/GuestShell.tsx` (09-01 summary), so `TasksStoreProvider` and `TasksCard` are mounted there.

**2. [Coordinator rule] Browser checks not run.** Task 3's browser steps need `bun run api` (wrangler) and env files, which are forbidden for this executor. No screenshots exist. Listed below as pending human checks.

**3. [Discretion] No tabs yet.** The card body is `<ListTab />` only; 09-05 adds List/Plan tabs. Shell classes are reused from `records.module.css` (no copy). Card carries `data-deck-card` as well as `data-tasks-card` so the shared Escape guard in `useDeckCard` ignores it.

**4. [Spec] Guest footnote included** ("Saved in this browser. Sign in to keep tasks on every device." with "Sign in" linking to `/sign-in`), since UI-SPEC lists it for the List tab.

**5. Notes.** `useTaskActions` update path awaits an in-flight create (Map of temp id to promise) before PUT. `archive`/`restore` are two explicit setters rather than a toggle. Account-mode `PrefetchUserTasks` still refetches into the store; 09-04 replaces it. `Task.createdAt` is stringified from the API row.

## Verification

- `bunx tsc --noEmit -p apps/next/tsconfig.json`: exit 0
- `bun run check`: exit 0
- Greps: no `useTodoStore`/`editMode` left, no `dangerouslySetInnerHTML` in components/tasks, exact toast copy present, keyboard guard excludes `[data-tasks-card]`.

## Pending human checks

- `/guest` at 1440x900 and 390x844: add three tasks, edit (Enter, blur, Escape), tick, archive, restore; empty state focuses the add input; Records then Tasks swaps cards with `html[data-room]` staying `open` and `data-deck` becoming `tasks`; Space and R drive the timer from inside the card; Escape returns focus to the footer Tasks button; opening Tasks closes Customize and the reverse.
- Signed in (non-production DB): add, tick, archive produce POST/PUT 200; forced network failure rolls back with the "Couldn't save ..." toast.
- Screenshots `09-03-guest-1440.png`, `09-03-guest-390.png`, `09-03-account-1440.png` not captured. Check pixel details of the 20px circle checkbox (the shared Checkbox's inner `Check` icon is styled via `.box svg`).

## Commits

- c2cbf87 feat(BFC-09-03): reshape tasks store and actions with string ids and guest UUIDs
- adce063 feat(BFC-09-03): Tasks card shell and List tab
- 9c6124a feat(BFC-09-03): footer Tasks button and card mounted in both layouts

## Known Stubs

None. Guest tasks are in memory only until 09-04 adds persistence.

## Self-Check: PASSED
