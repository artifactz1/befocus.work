# Roadmap: beFocus - Dashboard Customization

## Overview

This milestone turns a fixed dashboard into a personal one. It starts by repairing the ground it
has to stand on: the production cookie bug that silently kills server-side settings hydration, the
fake Tailwind dependency, the conflicting CSS tokens, and the broken lint gate. With that solid, a
customization engine writes CSS custom properties and data attributes onto the document root and a
panel exposes every control behind live preview with explicit Apply and Cancel. Persistence lands
next, in its final storage shape, so a look survives a refresh and follows the user across devices
while guests keep theirs in the browser. Saved themes then build on that same storage, adding
naming, switching, curated presets and guest-to-account migration. Finally the two bring-your-own
background sources arrive: R2-backed uploads with quota and server-side validation, then pasted
remote URLs with a safe fallback when a host blocks them.

Phases 7-10 were added on 2026-10-04 and extend the milestone past looks into what the dashboard
does. Phase 7 turns the saved sounds into a record room: a Material-style top-view turntable,
a shelf of records and ambience knobs that open over the left half of the dashboard. Phases 8-10 are the productivity track, in dependency
order: first the timer learns an explicit end of block, lets the user add time to a focus block
that just ended, and records every block; then tasks attach to those blocks and the session gets
a time-block plan and a live progress view; finally each break invites a short log and the
recorded history turns into a session summary and a view of what to improve. Phase 7 and the
productivity track are independent of each other and of Phases 4-6.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation Repair** - Production settings hydration, one Tailwind, clean tokens, working lint gate
- [ ] **Phase 2: Customization Engine and Panel** - Every control, live preview, Apply and Cancel, desktop and mobile (all plans executed, owner review checkpoint outstanding)
- [ ] **Phase 3: Persistence and Sync** - A look survives refresh, follows the account, and sticks for guests
- [ ] **Phase 4: Saved Themes** - Name, switch, rename and delete looks; curated presets; guest migration
- [ ] **Phase 5: Media Uploads** - Upload your own images and videos to R2 behind the timer
- [ ] **Phase 6: URL Backgrounds** - Paste any remote image or video URL, with a safe fallback
- [ ] **Phase 7: Vinyl Sound Space** - The Sounds button opens a record room: turntable, shelf of records, ambience knobs
- [ ] **Phase 8: Focus Blocks and Added Time** - Explicit block end, add time after a focus block, every block recorded
- [ ] **Phase 9: Tasks and Time Blocks** - Tasks tied to focus blocks, a time-block plan, and live session progress
- [ ] **Phase 10: Session Logs and Reflection** - Log what you did each break, a real session summary, history and what to improve

## Phase Details

### Phase 1: Foundation Repair

**Goal**: The dashboard receives a signed-in user's saved settings on the server render in
production, from exactly one hydration path, and the styling and lint toolchain is single-sourced
and trustworthy again.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FND-01, FND-02, FND-03, FND-04, FND-05
**Success Criteria** (what must be TRUE):

  1. A signed-in user loading the dashboard in production sees their own work duration, break
     duration and session count on first paint, with no flash of the built-in 25:00 / 5:00 defaults.

  2. Loading the dashboard triggers exactly one settings read, and the timer values never change
     again after the first paint (no second client-side fetch racing the server-fetched values).

  3. `bun run check` exits clean and `bun run turbo:build` succeeds from a fresh `bun install`.
  4. `apps/next` builds against a single declared Tailwind version, and the dashboard renders with
     no rule the installed version silently ignores and no design token defined twice with
     conflicting values.
**Plans**: 5 plans

Plans:
**Wave 1**

- [x] 01-01-PLAN.md - Reproduce `__Secure-` cookie bug locally, forward raw Cookie header in getUserSettings (FND-01)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md - Real Tailwind 3.4 dependency, drop `@theme`, shine in config, single `--border` (FND-02, FND-03)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md - Per-request seeded timer store + server-seeded query cache: one read, zero flash (FND-05)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-04-PLAN.md - Biome 2 upgrade, churn commit, lint fixes, fresh-install gate (FND-04)
  - FND-04 verified: bun 1.2.23 on macOS, all `node_modules` removed, `bun install --frozen-lockfile` exit 0, `bun run check` exit 0. The earlier `bun.lock` esbuild failure was not reproducible; regenerating `bun.lock` gave a worse lockfile (integrity hashes dropped, still no darwin esbuild entry), so `bun.lock` is unchanged.

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 01-05-PLAN.md - Human deploy + production verification (FND-01, FND-05)

Notes for planning:

- FND-01 is `apps/next/src/lib/server/getUserSettings.ts`, which hardcodes the cookie name
  `better-auth.session_token`; better-auth prefixes it `__Secure-` whenever cookies are secure.
  Fix it at the shared lookup, not at one call site, since every new server-hydrated preference in
  Phases 3-6 rides the same path. Verification is against the live deployment, not localhost, since
  the bug only appears when cookies are secure.

- FND-05 is the `DashboardShell` / `TimerInitializer` duplicate-hydration anti-pattern documented in
  `.planning/codebase/ARCHITECTURE.md`. Pick one hydration owner now, because the customization
  store in Phase 2 must not copy the broken pattern.

- FND-04 fails today because of a split install: `node_modules/@biomejs/biome` is 1.9.4 (matching
  `biome.json`'s v1 schema) but its sibling platform package `@biomejs/cli-darwin-arm64` is 2.4.13,
  and biome's launcher execs the platform binary. Root cause is `bun.lock`, which pins only
  `cli-linux-x64` and `cli-linux-x64-musl` under biome 1.9.4, so on macOS the darwin binary resolved
  unpinned to latest. Either pin `@biomejs/cli-darwin-arm64` to 1.9.4 or upgrade to Biome 2 and run
  `biome migrate`; upgrading also retires `biome.json`'s rejected v1 keys (`files.ignore`,
  top-level `organizeImports`). Do it as its own change, not smuggled into a feature diff.

- FND-03 covers the v4-only `@theme inline` block in `packages/ui/src/globals.css` that v3 ignores,
  and the `--border` token defined twice (layered and unlayered) with different values.

- FND-02 is `apps/next/package.json` depending on `tailwind@^4.0.0`, which is an unrelated streaming
  library, not Tailwind. The app compiles only because `tailwindcss@3.4.17` is hoisted from
  `packages/ui`. Decide deliberately whether the monorepo lands on Tailwind 3 or 4; FND-03's
  `@theme inline` block is v4 syntax, so the two requirements share one decision.

- A wrangler `^3.109.2` -> `^4.113.0` bump is parked in `git stash@{0}`, unverified. It is not part
  of this phase. If Phase 5 needs wrangler 4 for R2 bindings, upgrade it there deliberately and
  verify a deploy; otherwise drop the stash.

### Phase 2: Customization Engine and Panel

**Goal**: A user can open a customize panel from the dashboard and change every one of the ten
customizable surfaces, seeing the dashboard react the instant a control moves, then commit with
Apply or throw it away with Cancel. Nothing survives a refresh yet; Phase 3 adds that.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-04, CTL-01, CTL-02, CTL-03, CTL-04, CTL-05, CTL-06, CTL-07, CTL-08, CTL-09, CTL-10, CTL-11, CTL-12, CTL-13, UX-01, UX-02, UX-03, UX-04, UX-05, UX-06
**Success Criteria** (what must be TRUE):

  1. User opens the customize panel from the dashboard, finds it organized into Theme, Background,
     Type, Color and Style sections, and every control already shows the value currently in effect.

  2. Moving any control - solid background swatch, overlay tint, overlay opacity, blur,
     font family, accent colour, text contrast, timer progress style, density, grain - changes the dashboard
     immediately, before anything is committed.

  3. Apply keeps the new look; Cancel or closing the panel snaps the dashboard back to exactly how
     it looked before the panel opened.

  4. One Reset action returns every control and the dashboard to the default look.
  5. On a phone every control is reachable and usable in a bottom sheet, the timer stays usable at
     every supported viewport, and the whole panel can be driven from the keyboard with controls
     that announce themselves to a screen reader.
**Plans**: 8 plans

Plans:
**Wave 1**

- [x] 02-01-PLAN.md - Look schema, catalog, customize store and painter, tokens, fonts, Toaster, AppBackground on tokens (ENG-01, ENG-03)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md - Controls kit, Feathered dock, Theme and Background sections, Apply/Cancel/Reset flow, Customize trigger (UX-01, UX-02, UX-03, UX-06, ENG-02, ENG-04, CTL-01, CTL-02, CTL-03, CTL-10)
- [x] 02-03-PLAN.md - Timer on tokens, Edge/Ruler/Ink/None progress, double-tick fix, Space/R shortcuts and hints (CTL-07, CTL-08, CTL-12)
- [x] 02-04-PLAN.md - Session contribution grid, chrome idle fade and density padding, bare menu buttons (CTL-08, CTL-11, CTL-13)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-05-PLAN.md - Type, Color and Style sections (CTL-04 to CTL-09, UX-03)
- [x] 02-06-PLAN.md - Mobile feathered bottom sheet, breakpoint switch, mobile trigger, mobile chrome fade (UX-04, UX-05, UX-06)
- [x] 02-07-PLAN.md - Timer scales and moves out of the panel's way at every viewport (UX-05)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 02-08-PLAN.md - Integrated gates, end-to-end viewport and keyboard walkthrough, owner review (ENG-02, ENG-04, UX-05, UX-06) - Tasks 1-2 done, Task 3 owner checkpoint outstanding
**UI hint**: yes

Notes for planning:

- ENG-01 has a half-built substrate to finish, not a contract to invent: `--bg-image`,
  `--bg-image-size`, `--bg-image-position`, `--bg-overlay-color`, `--bg-overlay-opacity` and
  `--bg-blur` already exist in `packages/ui/src/globals.css` and are consumed by
  `AppBackground.tsx`. The store is the missing writer. `--accent`, `--text-contrast`,
  `--grain-opacity`, `--font-*` and the `data-progress` / `data-density` attributes are new.

- Decisions locked in the prototype review (`.lavish/customization-prototype.html`): Edge progress
  is the default and the circular ring is gone; backgrounds are solid only (no gradients); the
  session grid becomes an accent contribution grid with focus fade; keyboard hints sit under the
  timer with the footer pill kept; menu buttons go bare. The panel itself is a solid surface.

- The Theme section exists structurally here but is only populated in Phase 4. Build the section so
  Phase 4 fills it rather than restructures the panel.

- `apps/next/src/components/settings/SoundSettings.tsx` hardcodes hex colours that bypass the token
  system, so it will not react to an accent or contrast change. Fix it while the accent control is
  being built.

### Phase 3: Persistence and Sync

**Goal**: A look a user applies is still there next time, painted on first render, for signed-in
users on any device and for guests in the same browser.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: ENG-05, SYN-01, SYN-02, SYN-03, SYN-05
**Success Criteria** (what must be TRUE):

  1. A signed-in user applies a look, refreshes, and the dashboard comes back already wearing it,
     with no flash of default styling on the way in.

  2. The same user signs in in a different browser or on a different device and sees the same look.
  3. A guest customizes at `/guest`, refreshes, and the look is still there in that browser.
  4. Clicking Apply repeatedly and quickly settles on exactly what the panel last showed, and a
     refresh confirms the server agrees.
**Plans**: TBD

Notes for planning:

- Land storage in its final shape here: a theme record plus an active-theme pointer on settings, as
  in `docs/superpowers/specs/2026-04-29-dashboard-customization-design.md`. Phase 4 then adds naming
  and multi-theme management on top instead of migrating a throwaway column.

- Hydration goes through the single owner established in FND-05, not a new parallel path.
- Guest persistence is the first use of `localStorage` in `apps/next/src/store/` - there is no
  existing `persist` usage in the repo to copy.

### Phase 4: Saved Themes

**Goal**: A user keeps more than one look, switches between them, starts from a curated preset, and
carries a guest's customizations onto a brand new account.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: THM-01, THM-02, THM-03, THM-04, THM-05, THM-06, SYN-04
**Success Criteria** (what must be TRUE):

  1. User saves the current preview under a name and sees it listed alongside the curated presets.
  2. User switches the active theme by picking a saved one, and can rename or delete the themes
     they own.

  3. Loading a curated preset fills the panel's controls without changing the dashboard until Apply.
  4. Renaming or deleting a curated theme is refused by the server, not merely hidden in the UI.
  5. Deleting the active theme leaves the dashboard on the built-in Default theme, never on a blank
     or broken one, and a guest who creates an account finds their local customizations on that
     account afterwards - exactly once, with no duplicates on later sign-ins.
**Plans**: TBD
**UI hint**: yes

Notes for planning:

- SYN-04 migration must be idempotent. The design spec's `befocus.imported` flag is one way; the
  requirement is that a second sign-in does not duplicate themes.

- Curated themes live as a TypeScript constant merged into list responses, so "cannot be edited or
  deleted" needs an explicit server-side rejection path, not just absence of a DB row.

### Phase 5: Media Uploads

**Goal**: A signed-in user puts their own images and videos behind the timer, bounded by a quota and
validated before a single byte is stored.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: MED-01, MED-02, MED-03, MED-04, MED-05, MED-06, MED-07, MED-08, MED-09
**Success Criteria** (what must be TRUE):

  1. A signed-in user drags in or picks a JPEG, PNG or WebP up to 15 MB, or an MP4 or WebM up to
     80 MB, watches progress, and the file appears as a selectable background tile.

  2. Applying an uploaded background keeps it across refreshes; deleting an upload removes both the
     tile and the stored object.

  3. A file of the wrong type or over the size limit is refused before any upload begins, and the
     browser's network panel shows the file going straight to storage rather than through the API.

  4. Once the per-user file limit is reached the upload control is disabled, and the server refuses
     an upload request on its own even when the UI is bypassed.

  5. A second account cannot read or delete the first account's media, and a guest sees a sign-in
     prompt where the upload controls would be.
**Plans**: TBD
**UI hint**: yes

Notes for planning:

- All the new infrastructure for this milestone is concentrated here: the R2 bucket, the Wrangler
  binding, presigned PUT URLs and signed read URLs, user-scoped object keys. `packages/api/wrangler.toml`
  currently has every binding block commented out.

- User-uploaded media is untrusted input. Content type and size are validated server-side before a
  presigned URL is issued, keys are scoped per user, and reads go through signed URLs.

- Uploads must not stream through the Worker; that is a runtime constraint, not a preference.

### Phase 6: URL Backgrounds

**Goal**: Any image or video already on the web can be the background, and a link that breaks leaves
the dashboard usable instead of blank.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: URL-01, URL-02, URL-03
**Success Criteria** (what must be TRUE):

  1. User pastes a remote image or video URL and sees it previewed as the background before
     applying it.

  2. The panel warns, next to the input, that URL backgrounds can break due to host restrictions.
  3. A broken or host-blocked URL leaves the dashboard on a safe fallback background with an inline
     warning in the panel, and the timer stays fully usable.
**Plans**: TBD
**UI hint**: yes

### Phase 7: Vinyl Sound Space

**Goal**: The footer Sounds button opens a record room: a Material-style listening room with a
top-view turntable, a shelf of record sleeves and a row of ambience knobs. It fills the left half
of the dashboard while the timer shrinks to the right and keeps running. One record plays at a
time with ambience layered under it, and the record keeps playing after the room closes.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: VNL-01, VNL-02, VNL-03, VNL-04, VNL-05, VNL-06, VNL-07, VNL-08
**Success Criteria** (what must be TRUE):

  1. Deleting a sound works end to end and a deleted sound never comes back (issues #101 and
     #102), verified before any of the room is built.

  2. User clicks the footer Sounds button and the record room opens over the left half of the
     dashboard; the timer shrinks to the right and keeps counting. Alarms are no longer in the
     Sounds surface and are chosen in Session settings instead.

  3. Every music sound sits on the shelf as a sleeve with a generated label ink and its name.
     Clicking a sleeve or dragging it onto the platter starts it; the platter spins and the
     tonearm sits on the record, and both stop when it is paused. Starting a record replaces the
     one playing.

  4. Each ambient sound is a knob under the turntable with its own volume; several can play at
     once, layered under the record.

  5. A signed-in user pastes a YouTube link anywhere in the room, confirms whether it is a record
     or ambience (prefilled from the link's title), and it lands on the matching shelf or knob
     row and survives a refresh. A guest sees the starter records and knobs only, with no saving.

  6. Closing the room while a record plays shows a now-playing chip in the footer that fades with
     the footer's idle behaviour and can pause the record or reopen the room.

  7. On a phone the room is a bottom sheet with the same content and the timer stays visible
     above it. The room works from the keyboard and a screen reader, and under reduced motion a
     record swaps in instantly with no spin.
**Plans**: 7 plans

Plans:
**Wave 1**

- [ ] 07-01-PLAN.md - Reproduce sound delete in a browser, fix at the shared path (reconcile, optimistic delete, starter hide, owner-scoped API delete), sounds.check regression script (VNL-01)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 07-02-PLAN.md - Records footer button and room shell (desktop card, phone sheet, focus, exclusive with customize), legacy sounds UI removed (VNL-02, VNL-08)
- [ ] 07-03-PLAN.md - Timer shrink and chrome hiding on data-room, alarm picker moved into Session settings (VNL-02)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 07-04-PLAN.md - Shelf sleeves with label ink, turntable spin and tonearm, click and drag load, one record at a time (VNL-03, VNL-04)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 07-05-PLAN.md - Ambience knob row and footer now-playing chip (VNL-05, VNL-07)

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 07-06-PLAN.md - Paste-to-add with shared YouTube validator on client and API, guest rules, rename and delete from the room (VNL-06, VNL-01)

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 07-07-PLAN.md - Phone, keyboard, screen reader and reduced-motion audit with fixes, owner review checkpoint (VNL-08)

**UI hint**: yes

Notes for planning:

- First step: reproduce and fix sound delete (#101/#102) at the shared delete path
  (`useDeleteUserSound` in `hooks/useSounds.ts`, `DELETE /user/sounds/:id`), since the shelf
  invites users to curate. The five starter sounds are seeded client-side at module load in
  `useSoundsStore.tsx` and are not database rows; delete must handle that.

- This is a new view over the existing sound system, not a new audio engine. Sounds live in the
  `sounds` table (`packages/api/src/db/tables/sounds.ts`: `name`, `url`, `soundType` of
  `alarm | ambient | bgMusic`) behind `GET/POST/PUT/DELETE /user/sounds`. Playback is
  `GlobalSoundsPlayer.tsx`, one hidden `ReactPlayer` per non-alarm sound driven by `playing` and
  `volume` in `useSoundsStore`. `bgMusic` sounds are records and `ambient` sounds are knobs; "on
  the platter" is the `playing` flag, with the store enforcing one `bgMusic` playing at a time.

- The footer `SoundSettings.tsx` popover (Music, Ambient and Alarm tabs) is replaced by the room.
  Alarm selection moves into Session settings (`MenuSettings.tsx`); `soundType: 'alarm'` rows
  stay as they are.

- The paste-to-add flow replaces `AddSoundButton.tsx` and stays YouTube only. It sets `soundType`
  from the user's record or ambience choice. Uploads wait for Phase 5's storage.

- Label inks are generated from the sound's name, so no new column or migration is needed.
- The room deliberately relaxes the "timer stays full size" rule from quick tasks 261002 and
  261003 (PRs #113 and #114): the timer shrinks into the right half while the room is open. The
  session counter cells must be hidden or offset so they do not sit under the room. Decide how
  the room and the customize inspector coexist when both are opened.

- The now-playing chip is a new footer element and fades with the existing idle chrome
  (`useChromeIdle`, `.bf-chrome`, `data-chrome-idle`).

- Build the turntable from CSS/SVG and `framer-motion` (already used, with `useReducedMotion`).
  The phone bottom sheet uses `vaul`, as the mobile customize sheet does. No new animation, 3D or
  drag-and-drop dependency; use native drag events with click as the accessible path.

- Design reference: the decided Lavish board (Material room mocks in its "Your direction"
  section) at `.lavish/vinyl/board.html` in worktree 2, and the report at
  `firstmate/data/befocus-vinyl-board/report.md`, section "Final decisions (build spec for
  Phase 7)".

Design decisions (captain picks 2026-10-05, all resolved):

  1. Entry point: the footer Sounds button opens the record room; alarms move to Session
     settings.
  2. Shape: a room that fills the left half; the timer shrinks to the right and keeps running.
  3. Art direction: Material, a realistic top-view turntable.
  4. Record list: a shelf of sleeves.
  5. Labels: generated label inks plus the name.
  6. Loading: click or drag; reduced motion swaps instantly with no spin.
  7. Background presence: a now-playing chip in the footer that fades with the footer.
  8. Phone: a bottom sheet.
  9. Add and save: record shelf, ambience knobs, and paste a YouTube link anywhere.

Product questions Q2, Q3 and Q4 are resolved for this phase (see "Open Product Questions").
Q1, its priority against Phases 4-6, is still open.

### Phase 8: Focus Blocks and Added Time

**Goal**: The end of a focus block becomes a real moment the user controls: the timer stops in an
ended state where they can add more time or move on to the break, and every focus and break block
is recorded accurately so the rest of the productivity track has data to stand on.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: BLK-01, BLK-02, BLK-03, BLK-04, BLK-05
**Success Criteria** (what must be TRUE):

  1. When a focus block reaches zero the alarm plays and the timer waits in an ended state that
     offers Add time and Start break; it never jumps to the break on its own.

  2. User adds time to a just-ended focus block, more than once if they like, and the timer counts
     the added time down inside the same block.

  3. After a session, a signed-in user's records show each focus and break block with its planned
     length, time actually spent, time added, start and end time, and whether it finished, was
     skipped, or was reset; a guest's records survive a refresh in the same browser.

  4. A focus block run with the tab in the background, or across a short laptop sleep, is
     recorded with the same length the wall clock shows.
**Plans**: TBD
**UI hint**: yes

Notes for planning:

- `useTimerStore.tsx` has no explicit block lifecycle. At zero, `Timer.tsx` tells the worker to
  stop because `timeLeft > 0` is false, and `decrementTime` advances to the break only if one more
  tick arrives, which makes the end of a block racy. The alarm plays from a `timeLeft === 0`
  effect in `Timer.tsx`. Give the store an explicit ended state rather than layering Add time on
  top of the race.

- Time is counted by ticks from `lib/timerWorker.ts` (`setInterval` every 1000 ms), not from the
  wall clock. Records need real start and end times, so derive remaining time from timestamps or
  record them alongside the ticks; the planner picks.

- The timer store is per request through `TimerStoreProvider` (FND-05). Added time and the block
  record live in that store, hydrated through the same single owner.

- Server side: a new table in `packages/api/src/db/tables/`, re-exported from `db/schemas.ts`,
  with drizzle-zod schemas colocated, and a new `*.route.ts` / `*.handler.ts` / `*.index.ts` trio
  added to the `routes` array in `src/app.ts` so it appears on the typed client. Guest records use
  the browser storage pattern Phase 3 introduces (SYN-03).

- `SessionCompleteModal.tsx` (confetti and canned copy) is left alone here; Phase 10 rebuilds it
  on the records.

Open product questions this phase needs answered: Q1, Q5, Q9.

Design questions for the captain (one Lavish board, before planning):

  1. Where Add time appears when a block ends: under the digits in place of the keyboard hints, in
     the footer controls, or as a floating prompt.
  2. How much time one press adds: fixed steps (+1, +5, +10), a single +5, or a custom amount.
  3. How added time reads on the timer and the Edge, Ruler and Ink progress styles: progress
     continues past full, restarts for the added time, or switches to an overtime colour.
  4. How the ended state looks and sounds: does the alarm repeat until acknowledged, and what
     happens to the idle chrome fade.

### Phase 9: Tasks and Time Blocks

**Goal**: Tasks stop being a separate list and become the work inside the session. A user lays
out a time-block plan, ties tasks to focus blocks, and while the session runs sees where they are
in it and what they have worked through.
**Mode:** mvp
**Depends on**: Phase 8
**Requirements**: TSK-01, TSK-02, TSK-03, TSK-04, TSK-05
**Success Criteria** (what must be TRUE):

  1. A guest adds tasks, refreshes, and the tasks are still there in that browser.
  2. User picks the task they are working on for the current focus block, and that block's record
     afterwards lists the tasks worked on and completed during it.

  3. Before starting, the user lays out a plan of time blocks and assigns tasks to them, and the
     plan is still there after a refresh.

  4. While the session runs, one view shows the blocks done, the current block and how far into it
     the user is, the blocks ahead, any time added, and the tasks checked off.

  5. The plan and the progress view are usable on a phone and never obstruct the timer.
**Plans**: TBD
**UI hint**: yes

Notes for planning:

- Tasks already exist end to end for signed-in users: the `tasks` table
  (`db/tables/tasks.ts`: `text`, `completed`, `archived`, `createdAt`), `GET/POST/PUT/DELETE
  /user/tasks`, hooks in `hooks/useTasks.ts`, the global `useTodoStore`, and the footer
  `ToDoList.tsx` popover. `PrefetchUserTasks` is mounted only on the `(app)` page, so a guest's
  tasks live in memory and vanish on refresh; guest tasks also use `Date.now()` ids against a
  server `serial` id, which matters if guest data ever migrates.

- Tie tasks to Phase 8 block records (a join table, or task ids on the block); the planner picks.
- Progress already shows in two places: the accent contribution grid in `SessionsUI.tsx`
  (CTL-11) and the Edge, Ruler and Ink progress in `Timer.tsx` with `timer-progress.module.css`.
  The new progress view extends or replaces these; it must not stack a third indicator on top.

- Dashboard chrome fades while a session runs (`useChromeIdle`, `.bf-chrome`,
  `data-chrome-idle`). The progress view has to decide whether it fades with it.

- No chart, calendar or drag-and-drop library is installed. Prefer CSS and native drag events;
  add a dependency only if the chosen design needs one.

- Issue #100 (Notion MCP integration) is adjacent to this phase but not part of it.

Open product questions this phase needs answered: Q6, Q9.

Design questions for the captain (one Lavish board, before planning):

  1. Where tasks live: keep the footer popover, a docked list on one side, or a short list under
     the timer.
  2. Form of the time-block plan: a horizontal strip under the header that grows out of the
     contribution grid, a vertical day column like a calendar, or a ring.
  3. Assigning tasks to blocks: drag tasks onto blocks, or pick a "now working on" task per block.
  4. The live progress view: how done, current and upcoming blocks, added time and checked-off
     tasks show while focusing, and how much of it survives the idle fade.
  5. Phone layout for the plan and the progress view.

### Phase 10: Session Logs and Reflection

**Goal**: Each break becomes a moment to note what got done, and the recorded blocks, tasks and
notes turn into a real end-of-session summary and a history that shows the user what to improve.
**Mode:** mvp
**Depends on**: Phase 8, Phase 9
**Requirements**: LOG-01, LOG-02, LOG-03, LOG-04, LOG-05, LOG-06
**Success Criteria** (what must be TRUE):

  1. When a focus block ends and the break begins, the user is invited to log what they did; they
     can skip it, and the break timer runs either way.

  2. A saved log entry is attached to the block it describes and can be edited later.
  3. When the last session finishes, the user sees a summary built from that session's records
     (focus time, blocks finished or skipped, time added, tasks done, and their logs) instead of
     canned text.

  4. User browses past sessions with their blocks and logs, and sees what to improve drawn from
     that history.

  5. A guest's logs survive a refresh in the same browser.
**Plans**: TBD
**UI hint**: yes

Notes for planning:

- Log entries attach to Phase 8 block records. "What to improve" compares the Phase 9 plan with
  what Phase 8 recorded (time added, blocks skipped, breaks cut short, tasks left open), so this
  phase comes last.

- `SessionCompleteModal.tsx` fires when `currentSession > sessions` and shows confetti
  (`canvas-confetti`) with fixed copy. Rebuild it as the summary rather than adding a second
  end-of-session surface.

- A history view as its own App Router route would sit under `(app)/` and is auth-gated by
  `middleware.ts`; guests only have `/guest`, so a guest history needs an in-dashboard surface or
  a decision that history is signed-in only (open question Q9).

- No chart library is installed. Simple bars and grids in CSS cover a first version; add one only
  if the chosen design needs it.

Open product questions this phase needs answered: Q7, Q8, Q9.

Design questions for the captain (one Lavish board, before planning):

  1. The break-time log prompt: an inline card under the timer, a side sheet, or a modal; free
     text only, or quick tags and a focus rating as well.
  2. The end-of-session summary: what it shows first, and whether the confetti stays.
  3. Where history lives: a new page, a panel on the dashboard, or inside the summary.
  4. How "what to improve" is shown: a few plain-language observations, small charts (planned vs
     actual, a streak calendar), or both.

## Open Product Questions (Phases 7-10)

These are the captain's calls. None of them has been guessed; each phase lists the ones it needs
answered before `/gsd-discuss-phase`. Q2-Q4 were answered on the vinyl design board on 2026-10-05.

  1. **Q1 Priority.** Where Phases 7-10 sit against Phases 4-6. Both tracks are independent of
     Phases 4-6, so either can go first.
  2. **Q2 Which sounds are records.** Resolved 2026-10-05: music is records, ambience is knobs.
     One record plays at a time, with ambience layered under it. Phase 7.
  3. **Q3 Guests and the collection.** Resolved 2026-10-05: guests get the starter records and
     knobs only, with no saving. Phase 7.
  4. **Q4 Sound sources.** Resolved 2026-10-05: YouTube only until Phase 5 storage exists; revisit
     then. Phase 7.
  5. **Q5 When time can be added.** Only when a focus block ends, or also mid-block and on
     breaks. Phase 8.
  6. **Q6 Time-blocker scope.** A plan for the blocks inside one session, or a full-day calendar
     (which may touch issue #100, the Notion integration). Phase 9.
  7. **Q7 Where "what to improve" comes from.** Computed from the records, written by the user,
     or AI-generated (a new external service and cost). Phase 10.
  8. **Q8 Log cadence.** A prompt at every break, only at the end of a session, or both; and
     whether it can be turned off. Phase 10.
  9. **Q9 Guest records.** Whether guests keep block records, logs and history at all, only in
     their browser, and whether those move into the account on sign-up the way SYN-04 does for
     themes. Phases 8-10.

## Progress

**Execution Order:**
Phases 1-6 execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6. Phase 7 can start after Phase 2;
Phases 8 → 9 → 10 run in order after Phase 3. Where the two new tracks sit against Phases 4-6 is
open question Q1.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Repair | 4/5 | In Progress|  |
| 2. Customization Engine and Panel | 8/8 | Owner review pending |  |
| 3. Persistence and Sync | 0/TBD | Not started | - |
| 4. Saved Themes | 0/TBD | Not started | - |
| 5. Media Uploads | 0/TBD | Not started | - |
| 6. URL Backgrounds | 0/TBD | Not started | - |
| 7. Vinyl Sound Space | 0/TBD | Not started | - |
| 8. Focus Blocks and Added Time | 0/TBD | Not started | - |
| 9. Tasks and Time Blocks | 0/TBD | Not started | - |
| 10. Session Logs and Reflection | 0/TBD | Not started | - |

## Requirement Coverage

| Phase | Requirements | Count |
|-------|--------------|-------|
| 1. Foundation Repair | FND-01..05 | 5 |
| 2. Customization Engine and Panel | ENG-01..04, CTL-01..13, UX-01..06 | 23 |
| 3. Persistence and Sync | ENG-05, SYN-01, SYN-02, SYN-03, SYN-05 | 5 |
| 4. Saved Themes | THM-01..06, SYN-04 | 7 |
| 5. Media Uploads | MED-01..09 | 9 |
| 6. URL Backgrounds | URL-01..03 | 3 |
| 7. Vinyl Sound Space | VNL-01..08 | 8 |
| 8. Focus Blocks and Added Time | BLK-01..05 | 5 |
| 9. Tasks and Time Blocks | TSK-01..05 | 5 |
| 10. Session Logs and Reflection | LOG-01..06 | 6 |
| **Total** | | **76** |

All 76 v1 requirements are mapped to exactly one phase. No orphans, no duplicates.

## Verification Note

No test runner exists in this repo and none is being introduced. Every success criterion above is
verified by exercising the running app (`bun run web`, `bun run api`, or the live deployment for
FND-01), or by running the repo's own `bun run check` / `bun run turbo:build` scripts.

---
*Roadmap created: 2026-09-23*
*Phases 7-10 added: 2026-10-04*
