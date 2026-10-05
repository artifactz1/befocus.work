# Phase 7: Vinyl Sound Space - Context

**Gathered:** 2026-10-05
**Status:** Ready for planning
**Source:** Captain decisions from the vinyl design board (report: firstmate/data/befocus-vinyl-board/report.md, "Final decisions") plus ROADMAP.md Phase 7 entry. Discuss step is covered by these decisions.

<domain>
## Phase Boundary

Turn the saved sounds into a record room. The footer Sounds button becomes Records and opens a
Material-style listening room (top-view turntable, ambience knobs, shelf of record sleeves). It
fills the left half of the dashboard while open; the timer shrinks into the right half and keeps
running. One record plays at a time, ambience layers under it. Requirements VNL-01..VNL-08.

First, fix sound delete (GitHub issues #101 and #102) end to end, before any room code.

Out of scope: Phases 8-10, Phase 5 storage/uploads, any source other than YouTube, current-UI
observations in the board report.
</domain>

<decisions>
## Implementation Decisions (locked)

### Delete fix (first plan)
- Reproduce #101/#102 in a real browser first (chrome-devtools-axi), fix the root cause at the shared
  delete path (`useDeleteUserSound` in `hooks/useSounds.ts`, `DELETE /user/sounds/:id`), add a
  regression test. Starter sounds are seeded client-side in `useSoundsStore.tsx` (not DB rows);
  delete must handle them and a deleted sound must never come back after refresh.
- Reference both issues in the PR body.

### Entry and alarms
- Footer Sounds button becomes Records and opens the record room.
- Alarm selection moves into Session settings (`MenuSettings.tsx`); `soundType: 'alarm'` rows unchanged.

### Room
- Material-style listening room: top-view turntable, ambience knobs under it, shelf of sleeves.
- Fills the left half while open; timer shrinks to the right and keeps running. This deliberately
  relaxes the "timer stays full size" rule from PRs #113/#114. Session counter cells hidden or
  offset so they do not sit under the room. Decide how room and customize inspector coexist.
- Phone: bottom sheet (`vaul`), timer visible above it.

### Records
- Shelf of sleeves, each with a generated label ink (seeded from name, no migration) plus the name.
- Load by click (accessible path) or native drag onto the platter. Reduced motion: instant swap, no spin.
- Platter spins and tonearm rests on record while playing; both stop on pause.
- One record plays at a time (store enforces one `bgMusic` playing). Starting one replaces the other.

### Ambience
- Row of knobs under the turntable, each with its own volume, several at once, layered under the record.

### Add flow
- Paste a YouTube link anywhere in the room; user confirms record or ambience (prefilled from link
  title); saves as `bgMusic` / `ambient`, persists across refresh. Replaces `AddSoundButton.tsx`.
- Guests: starter records and knobs only, no saving. YouTube only.

### Now-playing chip
- Room closed while a record plays: chip in footer, fades with footer idle behaviour
  (`useChromeIdle`, `.bf-chrome`, `data-chrome-idle`), can pause the record or reopen the room.

### Accessibility
- Keyboard navigable, screen-reader labelled, reduced motion honoured (`useReducedMotion`).

### Technical constraints
- New view over the existing sound system, not a new audio engine. Playback stays
  `GlobalSoundsPlayer.tsx` (hidden ReactPlayer per non-alarm sound, `playing`/`volume` in `useSoundsStore`).
- Turntable from CSS/SVG + framer-motion. No new animation, 3D or drag-and-drop dependency.
- No test runner configured in repo; the regression test for delete must be a runnable one-off
  (`bun test` file or script) - the plan decides the minimal harness without inventing a framework.
- Biome style (single quotes, no semicolons, 100 col).

### Claude's Discretion
- Exact component structure, knob interaction details, label ink algorithm, how room and
  customize inspector coexist, drag payload details, layout math for shrinking timer.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` - Phase 7 section (goal, success criteria, planning notes)
- `.planning/REQUIREMENTS.md` - VNL-01..VNL-08
- `/Users/artifactz1/firstmate/data/befocus-vinyl-board/report.md` - design decisions, mocks (read-only)
- `apps/next/src/store/useSoundsStore.tsx`, `apps/next/src/hooks/useSounds.ts`,
  `apps/next/src/components/sounds/`, `apps/next/src/components/useChromeIdle.ts`
- `packages/api/src/db/tables/sounds.ts`, `packages/api/src/routes/` (user sounds routes)
- `.planning/phases/BFC-02-customization-engine-and-panel/` - inspector/sheet patterns
- GitHub issues #101, #102 - delete bug reports
</canonical_refs>

<specifics>
## Specific Ideas

- Footer button label "Records". Chip shows record name + play/pause + open-room.
- Label ink derived by hashing the sound name to a hue.
</specifics>

<deferred>
## Deferred Ideas

- Upload sources (Phase 5), pick-ink/sticker labels, record store catalogue, Phases 8-10.
</deferred>

---

*Phase: BFC-07-vinyl-sound-space*
*Context gathered: 2026-10-05*
