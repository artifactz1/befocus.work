# 07-07 Summary - Phone, keyboard, screen reader and reduced-motion audit

Requirement: VNL-08.

## Audit (1440x900, 1024x768, 390x844 touch, 844x390 landscape touch)

| Check | Finding | Fix |
|-------|---------|-----|
| Layout, landscape 844x390 | Turntable row collapsed to 0 and overlapped the ambience row | `.body` rows `minmax(180px, 1fr) auto auto` |
| Hit targets (44px) | Close 30px, volume slider 16px wide, Sign in link 15px high, retry link small | `.close` 44px with negative margin, `.volume` 44px, link padding, `.retry` padding; re-audit lists no small target at any viewport |
| Overflow | Add dialog overflowed right on 390 | `width: calc(100vw - 32px)` (07-06) |
| Keyboard | Order: close, turntable, knobs, shelf, options; Escape closes menus and dialogs before the room | Shared `:focus-visible` outline for sleeve, add tiles, options, retry, knob, play button |
| Screen reader | Sliders have name, value text ("Off" or percent); sleeves and options named; decorative icons exposed | `aria-hidden` on Play, Pause and X icons |
| Reduced motion | Reviewed in code: spin and tonearm use `useReducedMotion`, swaps are instant | none needed |

Screenshots (scratchpad): /private/tmp/claude-501/-Users-artifactz1--treehouse-befocus-work-e32439-1-befocus-work/43a8b518-ef45-4168-8eef-e8472e61356a/scratchpad/shots/{desktop-room-playing,desktop-chip,mobile-sheet-playing,mobile-add-dialog,desktop-add-dialog}.png

## Owner review

Choices flagged for sign-off, recorded in the PR body:

- Starter delete is per browser (localStorage `befocus.hiddenStarters`); user sounds delete on every device.
- Room and customize inspector are mutually exclusive.
- The old Sounds popover and delete mode were removed.
- Guests get starter records only; YouTube links only until Phase 5.

Captain's decisions already cover these; PR review is the owner checkpoint.

## Verification

sounds.check, next and api tsc, `bun run check`, `next build` all pass.
