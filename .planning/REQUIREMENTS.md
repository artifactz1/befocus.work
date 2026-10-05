# Requirements: beFocus - Dashboard Customization

**Defined:** 2026-09-23
**Core Value:** A user can change how their focus dashboard looks and have that look still be there
the next time they open it - signed in on any device, or as a guest on the same browser.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Foundation

- [x] **FND-01**: Server-fetched user settings reach the dashboard in production (the `__Secure-`
      cookie prefix is handled), verified against the live deployment
- [x] **FND-02**: `apps/next` declares a real Tailwind dependency; the bogus `tailwind@^4.0.0`
      package is gone and the app compiles against one known Tailwind version
- [x] **FND-03**: `globals.css` contains no syntax the installed Tailwind version silently ignores,
      and no duplicate conflicting token definitions
- [x] **FND-04**: `bun run check` (format + lint + organize-imports) exits clean on a fresh install
- [x] **FND-05**: User settings hydrate from exactly one source, with no competing client-side
      re-fetch racing the server-fetched values

### Customization Engine

- [x] **ENG-01**: A customization state store writes the full token set (`--bg-*`, `--user-accent`,
      `--text-contrast`, `--grain-opacity`, `--font-*`) and data attributes (`data-progress`,
      `data-density`) onto the document root
- [x] **ENG-02**: Changing any control updates the dashboard live, before anything is persisted
- [x] **ENG-03**: Three states are distinct and correct: active theme, unsaved preview, persisted
      state
- [x] **ENG-04**: Apply commits the preview; Cancel or closing the panel reverts to the active theme
      without persisting
- [ ] **ENG-05**: The dashboard paints the user's customizations on first render with no flash of
      default styling

### Customization Controls

- [x] **CTL-01**: User can set the background to one of 8 solid preset swatches (no curated image backgrounds)
- [x] **CTL-02**: User can set the background to a solid color of their choosing
- [x] **CTL-03**: User can adjust background overlay tint, overlay opacity and blur
- [x] **CTL-04**: User can choose among 4 typography families and see the dashboard change
- [x] **CTL-05**: User can pick an accent color from swatches or a custom color picker
- [x] **CTL-06**: User can adjust foreground text contrast
- [x] **CTL-07**: User can set the timer progress style to Edge (default), Ruler, Ink or None; the circular ring is removed
- [x] **CTL-08**: User can set layout density to compact, comfortable or roomy
- [x] **CTL-09**: User can adjust atmospheric grain intensity
- [x] **CTL-10**: User can reset everything to default with one action
- [x] **CTL-11**: The session tracker renders as an accent-colored contribution grid (no outlines), and dashboard chrome fades while a session runs, returning on pointer move or focus
- [x] **CTL-12**: Timer controls show keyboard hints under the digits alongside the footer pill; Space plays/pauses and R resets
- [x] **CTL-13**: Dashboard menu buttons use a bare style (no outlines, muted icons, customize icon in accent)

### Persistence & Sync

- [ ] **SYN-01**: A signed-in user's customizations persist server-side and survive a page refresh
- [ ] **SYN-02**: A signed-in user's customizations appear on a different device after sign-in
- [ ] **SYN-03**: A guest's customizations persist in localStorage and survive a page refresh
- [ ] **SYN-04**: A guest with local customizations who signs up has them migrated to the account on
      first sign-in, exactly once
- [ ] **SYN-05**: Rapid repeated Apply actions converge to a single correct persisted state

### Themes

- [ ] **THM-01**: User can save the current preview as a named theme
- [ ] **THM-02**: User can see their saved themes and switch the active theme between them
- [ ] **THM-03**: User can rename and delete their own themes
- [ ] **THM-04**: User can load a curated preset into the editor as a starting point without it
      applying instantly
- [ ] **THM-05**: Curated themes cannot be edited or deleted; attempts are rejected by the server
- [ ] **THM-06**: Deleting the active theme falls back to the built-in Default theme

### Media Uploads

- [ ] **MED-01**: A signed-in user can upload a background image (JPEG/PNG/WebP, up to 15 MB) by
      clicking or drag-and-drop, and see upload progress
- [ ] **MED-02**: A signed-in user can upload a background video (MP4/WebM, up to 80 MB)
- [ ] **MED-03**: Uploaded media appears as a selectable background tile and persists across
      refreshes once applied
- [ ] **MED-04**: A signed-in user can delete an upload, removing both the record and the stored
      object
- [ ] **MED-05**: Uploads are capped at a per-user file-count quota, enforced server-side as well as
      in the UI
- [ ] **MED-06**: Uploads do not stream through the Worker; the client uploads directly to storage
      via a server-issued presigned URL
- [ ] **MED-07**: The server validates content type and size before issuing an upload URL, and
      rejects anything outside the allowed set
- [ ] **MED-08**: One user cannot read or delete another user's media
- [ ] **MED-09**: Guests see a sign-in prompt instead of upload controls

### URL Backgrounds

- [ ] **URL-01**: User can paste a remote image or video URL and preview it as a background
- [ ] **URL-02**: The UI warns that URL backgrounds may break due to host restrictions
- [ ] **URL-03**: A broken or blocked URL degrades to a safe fallback background with an inline
      warning, never a broken dashboard

### Panel UX

- [x] **UX-01**: User can open the customize panel from the dashboard and close it again
- [x] **UX-02**: The panel opens showing the active theme's current values in every control
- [x] **UX-03**: The panel is organized into Theme, Background, Type, Color and Style sections
- [x] **UX-04**: On mobile, every control is reachable and usable through a bottom sheet
- [x] **UX-05**: The panel does not obstruct the timer to the point of unusability at any supported
      viewport size
- [x] **UX-06**: The panel is keyboard navigable and its controls are labelled for screen readers

### Vinyl Sound Space

- [ ] **VNL-01**: Deleting a sound works end to end and a deleted sound never comes back (issues
      #101 and #102); fixed before the room is built
- [ ] **VNL-02**: The footer Sounds button opens a Material-style record room with a top-view
      turntable that fills the left half of the dashboard while the timer shrinks to the right and
      keeps running; alarm selection moves to Session settings
- [ ] **VNL-03**: Music sounds sit on a shelf of sleeves, each with a generated label ink and its
      name
- [ ] **VNL-04**: User loads a record by clicking its sleeve or dragging it onto the platter; the
      platter spins and the tonearm rests on it while it plays; only one record plays at a time
- [ ] **VNL-05**: Ambient sounds are a row of knobs under the turntable, each with its own volume,
      layered under the record
- [ ] **VNL-06**: A signed-in user adds a sound by pasting a YouTube link anywhere in the room and
      confirming record or ambience; it saves to the matching shelf and persists. Guests get the
      starter records and knobs only, with no saving. Sources are YouTube only
- [ ] **VNL-07**: While a record plays with the room closed, a now-playing chip in the footer
      shows it, fades with the footer's idle behaviour, and can pause it or reopen the room
- [ ] **VNL-08**: On a phone the room is a bottom sheet; the room is keyboard navigable, labelled
      for screen readers, and under reduced motion a record swaps in instantly with no spin

### Focus Blocks

- [ ] **BLK-01**: When a focus block reaches zero the alarm plays and the timer waits in an ended
      state offering Add time and Start break; it never advances to the break on its own
- [ ] **BLK-02**: User can add time to a just-ended focus block, repeatedly, and the added time
      counts down inside the same block
- [ ] **BLK-03**: Every focus and break block is recorded with planned length, time spent, time
      added, start and end time, and whether it finished, was skipped or was reset
- [ ] **BLK-04**: A signed-in user's block records are stored on the server; a guest's survive a
      refresh in the same browser
- [ ] **BLK-05**: Recorded block lengths match the wall clock, including with the tab in the
      background or across a short sleep

### Tasks and Time Blocks

- [ ] **TSK-01**: A guest's tasks survive a refresh in the same browser
- [ ] **TSK-02**: User can pick the task they are working on in the current focus block, and the
      block's record lists the tasks worked on and completed during it
- [ ] **TSK-03**: User can lay out a plan of time blocks before starting and assign tasks to them,
      and the plan survives a refresh
- [ ] **TSK-04**: While a session runs, one view shows blocks done, the current block and progress
      through it, blocks ahead, time added, and tasks checked off
- [ ] **TSK-05**: The plan and the progress view work on a phone and never obstruct the timer

### Session Logs and Reflection

- [ ] **LOG-01**: When a focus block ends and the break begins, the user is invited to log what
      they did; the prompt is skippable and never pauses the break timer
- [ ] **LOG-02**: A log entry is attached to the block it describes and can be edited later
- [ ] **LOG-03**: When the last session finishes, the user sees a summary built from that
      session's records (focus time, blocks finished or skipped, time added, tasks done, logs)
      in place of the canned completion message
- [ ] **LOG-04**: User can browse past sessions with their blocks and logs
- [ ] **LOG-05**: User sees what to improve, drawn from their history
- [ ] **LOG-06**: A guest's logs survive a refresh in the same browser

## v2 Requirements

Deferred. Tracked but not in this roadmap.

### Themes

- **THM-07**: Theme thumbnails rendered from actual theme values rather than a generic swatch
- **THM-08**: Import/export a theme as a shareable file

### Media

- **MED-10**: Total-storage-MB quota in addition to file count
- **MED-11**: Client-side downscaling of oversized images before upload

### Appearance

- **APP-01**: Light theme variants

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Light theme support | `<html class='dark'>` is hardcoded; untangling `next-themes` is a separate project |
| Public theme sharing / marketplace | Needs moderation and abuse handling that dwarfs the feature |
| Per-session theme overrides | Themes are user-wide, one active at a time; per-session state multiplies the persistence model for no demonstrated need |
| Server-side video transcoding / downscaling | Wrong workload for Workers; size limits make it unnecessary |
| Video poster-frame generation | Same reason; browsers handle first-frame display adequately |
| User-supplied custom CSS | Arbitrary CSS injection is an XSS and support burden |
| Theme version migrations | `version: 1` exists for the future; no migrations written now |
| Subscription tiers / paid customization | No billing exists in the product |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 - Foundation Repair | Complete |
| FND-02 | Phase 1 - Foundation Repair | Complete |
| FND-03 | Phase 1 - Foundation Repair | Complete |
| FND-04 | Phase 1 - Foundation Repair | Complete |
| FND-05 | Phase 1 - Foundation Repair | Complete |
| ENG-01 | Phase 2 - Customization Engine and Panel | Complete |
| ENG-02 | Phase 2 - Customization Engine and Panel | Complete |
| ENG-03 | Phase 2 - Customization Engine and Panel | Complete |
| ENG-04 | Phase 2 - Customization Engine and Panel | Complete |
| ENG-05 | Phase 3 - Persistence and Sync | Pending |
| CTL-01 | Phase 2 - Customization Engine and Panel | Complete |
| CTL-02 | Phase 2 - Customization Engine and Panel | Complete |
| CTL-03 | Phase 2 - Customization Engine and Panel | Complete |
| CTL-04 | Phase 2 - Customization Engine and Panel | Complete |
| CTL-05 | Phase 2 - Customization Engine and Panel | Complete |
| CTL-06 | Phase 2 - Customization Engine and Panel | Complete |
| CTL-07 | Phase 2 - Customization Engine and Panel | Complete |
| CTL-08 | Phase 2 - Customization Engine and Panel | Complete |
| CTL-09 | Phase 2 - Customization Engine and Panel | Complete |
| CTL-10 | Phase 2 - Customization Engine and Panel | Complete |
| CTL-11 | Phase 2 - Customization Engine and Panel | Complete |
| CTL-12 | Phase 2 - Customization Engine and Panel | Complete |
| CTL-13 | Phase 2 - Customization Engine and Panel | Complete |
| SYN-01 | Phase 3 - Persistence and Sync | Pending |
| SYN-02 | Phase 3 - Persistence and Sync | Pending |
| SYN-03 | Phase 3 - Persistence and Sync | Pending |
| SYN-04 | Phase 4 - Saved Themes | Pending |
| SYN-05 | Phase 3 - Persistence and Sync | Pending |
| THM-01 | Phase 4 - Saved Themes | Pending |
| THM-02 | Phase 4 - Saved Themes | Pending |
| THM-03 | Phase 4 - Saved Themes | Pending |
| THM-04 | Phase 4 - Saved Themes | Pending |
| THM-05 | Phase 4 - Saved Themes | Pending |
| THM-06 | Phase 4 - Saved Themes | Pending |
| MED-01 | Phase 5 - Media Uploads | Pending |
| MED-02 | Phase 5 - Media Uploads | Pending |
| MED-03 | Phase 5 - Media Uploads | Pending |
| MED-04 | Phase 5 - Media Uploads | Pending |
| MED-05 | Phase 5 - Media Uploads | Pending |
| MED-06 | Phase 5 - Media Uploads | Pending |
| MED-07 | Phase 5 - Media Uploads | Pending |
| MED-08 | Phase 5 - Media Uploads | Pending |
| MED-09 | Phase 5 - Media Uploads | Pending |
| URL-01 | Phase 6 - URL Backgrounds | Pending |
| URL-02 | Phase 6 - URL Backgrounds | Pending |
| URL-03 | Phase 6 - URL Backgrounds | Pending |
| UX-01 | Phase 2 - Customization Engine and Panel | Complete |
| UX-02 | Phase 2 - Customization Engine and Panel | Complete |
| UX-03 | Phase 2 - Customization Engine and Panel | Complete |
| UX-04 | Phase 2 - Customization Engine and Panel | Complete |
| UX-05 | Phase 2 - Customization Engine and Panel | Complete |
| UX-06 | Phase 2 - Customization Engine and Panel | Complete |
| VNL-01 | Phase 7 - Vinyl Sound Space | Pending |
| VNL-02 | Phase 7 - Vinyl Sound Space | Pending |
| VNL-03 | Phase 7 - Vinyl Sound Space | Pending |
| VNL-04 | Phase 7 - Vinyl Sound Space | Pending |
| VNL-05 | Phase 7 - Vinyl Sound Space | Pending |
| VNL-06 | Phase 7 - Vinyl Sound Space | Pending |
| VNL-07 | Phase 7 - Vinyl Sound Space | Pending |
| VNL-08 | Phase 7 - Vinyl Sound Space | Pending |
| BLK-01 | Phase 8 - Focus Blocks and Added Time | Pending |
| BLK-02 | Phase 8 - Focus Blocks and Added Time | Pending |
| BLK-03 | Phase 8 - Focus Blocks and Added Time | Pending |
| BLK-04 | Phase 8 - Focus Blocks and Added Time | Pending |
| BLK-05 | Phase 8 - Focus Blocks and Added Time | Pending |
| TSK-01 | Phase 9 - Tasks and Time Blocks | Pending |
| TSK-02 | Phase 9 - Tasks and Time Blocks | Pending |
| TSK-03 | Phase 9 - Tasks and Time Blocks | Pending |
| TSK-04 | Phase 9 - Tasks and Time Blocks | Pending |
| TSK-05 | Phase 9 - Tasks and Time Blocks | Pending |
| LOG-01 | Phase 10 - Session Logs and Reflection | Pending |
| LOG-02 | Phase 10 - Session Logs and Reflection | Pending |
| LOG-03 | Phase 10 - Session Logs and Reflection | Pending |
| LOG-04 | Phase 10 - Session Logs and Reflection | Pending |
| LOG-05 | Phase 10 - Session Logs and Reflection | Pending |
| LOG-06 | Phase 10 - Session Logs and Reflection | Pending |

**Coverage:**
- v1 requirements: 76 total
- Mapped to phases: 76
- Unmapped: 0

Every v1 requirement maps to exactly one phase. No orphans, no duplicates.

---
*Requirements defined: 2026-09-23*
*Last updated: 2026-10-05 after the vinyl design board decisions (Phase 7)*
