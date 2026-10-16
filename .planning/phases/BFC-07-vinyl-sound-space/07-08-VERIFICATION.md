---
phase: BFC-07-vinyl-sound-space
plan: 08
verified: 2026-10-16T02:29:47Z
status: gaps_found
score: 9/10 must-haves verified (truth 1 holds except the "full size" clause, a documented deviation awaiting an owner override)
overrides_applied: 0
gaps:
  - truth: "An uploaded label image is stored in an owner-scoped R2 bucket, checked for type and size, readable only by its owner, and removed with the sound"
    status: partial
    reason: "The 1 MB cap is enforced before buffering only when Content-Length is sent. A chunked or HTTP/2 request without Content-Length is read whole into memory by c.req.arrayBuffer() (up to the Workers 100 MB request limit) before byteLength is compared. Truth holds functionally; hardening the requester asked for is missing."
    artifacts:
      - path: "packages/api/src/routes/user/user.handler.ts"
        issue: "lines 380-386: header check, then full arrayBuffer() buffer, then size check"
    missing:
      - "Use hono/body-limit (present in hono 4.7.2) on the PUT label route with maxSize LABEL_MAX_BYTES, or read c.req.raw.body with a byte counter and abort past 1 MB"
      - "Optionally move the Content-Length check above the DB ownership query"
  - truth: "On desktop the room is a 400px card at the left; the timer stays centred and full size while it is open"
    status: partial
    reason: "Card and centring verified. Timer scales to 0.8 on desktop while the room is open (timer-progress.module.css:135). Documented in 07-08-SUMMARY.md Deviation and a CSS comment, matches the board shot, but the PLAN truth is unamended and no override is recorded. Needs an owner override, not code."
    artifacts:
      - path: "apps/next/src/components/timer/timer-progress.module.css"
        issue: "line 135: transform: scale(0.8) under html[data-room=open] at >=1024px"
    missing:
      - "Owner records an override in this file's frontmatter (suggested YAML in the report body), or the timer is restored to full size"
---

# Phase 7 plan 07-08: Quiet Deck redesign and vinyl labels - Verification Report

**Plan goal:** The record room looks and feels like the Customize inspector, records can be personalised (label, picture, disc finish), and the room stays calm to use.
**Verified:** 2026-10-16T02:29:47Z
**Status:** gaps_found (no blockers in the shipped feature; one security-hardening gap and one override to record)
**Re-verification:** No. This is the first verification of 07-08. 07-VERIFICATION.md was left untouched.

Scope: commits cfdfb86, b57f8d9, 914e01d, 00a393f, 0451e04, 7d44686 (6e1177f..HEAD).

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Desktop room is a 400px left card; timer centred and full size | PARTIAL (deviation) | `records.module.css:18-31` `.room` fixed, left 24px, width 400px, rendered when `useMediaQuery('(min-width: 1024px)')` (`RecordRoom.tsx:22,103-122`). Phone/tablet is a vaul bottom sheet (`.sheet`, top 132px). The old `translateX(25vw) scale(0.6)` is gone, so the timer stays centred, but it is `scale(0.8)` (`timer-progress.module.css:133-136`). Not full size. |
| 2 | Floating vinyl, hairline tonearm, no inner ring; arm-lift swaps; instant under reduced motion | VERIFIED | `Vinyl.tsx`: base circle, grooves, label circle r*0.33, marker, spindle, sheen; no ring stroke around the label. `Turntable.tsx:24-62` arm is 1.5px line plus headshell. Swap effect (`:96-120`) fades disc while the arm effect (`:127-131`) lifts on `swapping`; `reduced` sets `shown` and `swing` immediately and skips spin. CSS `.deckDisc`/`.sq` transitions off under reduced motion (`records.module.css:733-752`). |
| 3 | Transport row: accent play button, title with shelf position, volume slider | VERIFIED | `Turntable.tsx:175-217`: `.play` button, title, `{position} of {recordIds.length}`, range `aria-label='Record volume'`. |
| 4 | Ambience slider rows read Off at 0 and work by keyboard | VERIFIED | `Ambience.tsx:14-56`: native range, `aria-valuetext` "Off" at 0, visible "Off", `knobKeyValue` handles arrows, Page, Home/End, Enter/Space toggle (`sounds.ts:165-187`). Moving off 0 starts, 0 stops. |
| 5 | Square-sleeve shelf, 4 columns desktop and phone, current sleeve ringed in accent | VERIFIED | `.sleeves` `repeat(4, minmax(0, 1fr))` with no breakpoint override (`records.module.css:531-538`); `.sleeve[data-loaded] .sq` accent border and inset ring (`:588-591`). |
| 6 | Outside the room: desktop pill above footer, phone spinning vinyl on Records icon with caption; no footer item moves | VERIFIED | `NowPlayingChip` moved into `Footer.tsx` as an absolutely positioned pill (`now-playing.module.css:3-24`, shown >=768px). `RecordsButton.tsx` swaps the Disc3 icon for a 26px spinning `Vinyl` below 768px and renders an absolutely positioned caption (`now-playing.module.css:107-140`). Neither takes layout space. |
| 7 | Add dialog: label Auto / 7 colours / thumbnail / upload, disc Black/Smoke/Tinted, live preview, disc slides out | VERIFIED | `AddSoundDialog.tsx`: Auto plus `LABEL_SWATCHES` (7) radios, thumbnail radio, upload button with 512px centre-crop to webp/jpeg (`toLabelBlob`), `FINISHES` segmented radios, preview built from the same `look` (`:155-165, 268-287`). `.out` keyframe slides the disc from -42% (`add-sound.module.css:251-254, 473-477`); spin and slide off under reduced motion (`spin={!reduced}`, `:498-503`). Label and disc controls only for records. |
| 8 | Label colour, picture choice, disc finish saved on the sound row, survive reload elsewhere | VERIFIED | Columns in `tables/sounds.ts:26-28`; migration `0009_vinyl_labels.sql` matches (nullable text, nullable text, `text DEFAULT 'black' NOT NULL`); 0009 snapshot diff vs 0008 adds exactly these three columns; journal idx 9. Create handler persists them (`user.handler.ts:243-248`), returns `...saved`. Client `useSound` posts them via typed `api.user.sounds.$post`; `reconcileSounds` compares all three (`sounds.ts:66-73`). |
| 9 | Uploaded label in owner-scoped R2 bucket, type and size checked, owner-only read, removed with the sound | VERIFIED with hardening gap | `wrangler.toml` `[[r2_buckets]] LABELS / befocus-labels`. PUT: owner query, size cap, magic-byte sniff (JPEG/PNG/WebP, SVG and WAV rejected by `label-image.check.ts`), key `labels/{userId}/{soundId}`, then `label_image='upload'`. GET reads only `labelKey(user.id, id)` so it cannot reach another user's object; `Cache-Control: private, no-cache`, ETag/304, Content-Type from stored metadata; `nosniff` comes from `secureHeaders` defaults. Delete removes the object (`:305`); a PUT /user/sounds that changes `labelImage` off `upload` removes it (`:356-358`). Size cap is enforced pre-buffer only when Content-Length is present (see Gaps). |
| 10 | Options reachable on touch and keyboard | VERIFIED | `.options` opacity 0 but always in tab order; shown on `:focus-within` and `:hover`, always under `@media (hover: none)` (`records.module.css:654-705`); Radix dropdown gives keyboard menu. |

**Score:** 9/10 (truth 1 partial on the "full size" clause only).

### Timer deviation (truth 1) - is it documented adequately?

Partly. It is stated in `07-08-SUMMARY.md` under "Deviation" with the reason (board a-desk, clears the card at 1440), and a CSS comment explains it (`timer-progress.module.css:132`). `07-CONTEXT.md` Redesign says only "Timer stays centred" and the ROADMAP line says "centred timer", so neither contradicts it. What is missing: the PLAN truth still says "full size" and there is no owner override. It looks intentional and consistent with the approved board. To accept it, the owner adds:

```yaml
overrides:
  - must_have: "On desktop the room is a 400px card at the left; the timer stays centred and full size while it is open"
    reason: "Approved board shot a-desk shows the digits at 0.8 so they clear the 400px card at 1440; timer stays centred"
    accepted_by: "artifactz1"
    accepted_at: "<ISO timestamp>"
```

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/api/src/db/drizzle/0009_vinyl_labels.sql` | label_color, label_image, disc_finish | VERIFIED | 3 ALTERs, matches schema and snapshot |
| `packages/api/wrangler.toml` | LABELS R2 binding | VERIFIED | `[[r2_buckets]]` top-level, no named envs that would drop it |
| `packages/api/src/lib/label-image.ts` | sniff and key helpers | VERIFIED | used by handler, covered by check script |
| `apps/next/src/components/records/Vinyl.tsx` | shared disc | VERIFIED | used by Turntable, NowPlayingChip, RecordsButton, AddSoundDialog; Shelf uses its `soundLook`/`labelBackground` |
| `KnobRow.tsx` | removed | VERIFIED | deleted, replaced by `Ambience.tsx` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useSounds.ts` | `/user/sounds/:id/label` | typed hono client | WIRED (partial typing) | URL from `api.user.sounds[':id'].label.$url(...)`; the PUT itself is a raw `fetch` because the route declares no body schema. Acceptable: raw image body. |
| `user.index.ts` | label handlers | `.openapi()` chain | WIRED | lines 16-17, so both routes are on `AppType` (tsc on Next passes using `.label.$url`) |
| `Vinyl.soundLook` | GET label | CSS `background-image` | WIRED | `labelImage === 'upload'` maps to `labelImageUrl(s.id)` |
| `create-app.ts` | label GET from web origin | CORP `same-site` | WIRED | needed for cross-subdomain image load |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| Shelf / Turntable / chip | `labelColor`, `labelImage`, `discFinish` | `useUserSounds` -> `GET /user/sounds` (DB) -> `syncUserSounds` -> `reconcileSounds` | Yes | FLOWING |
| Uploaded label picture | R2 object | `PUT` after create in `useSound`, `GET` per render | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Lint/format/imports | `bun run check` | 193 files, no fixes | PASS |
| Next types | `cd apps/next && bunx tsc --noEmit` | exit 0 | PASS |
| API types | `cd packages/api && bunx tsc --noEmit` | exit 0 | PASS |
| Reconcile, auto label, finish, thumbnail, video id | `bun run src/lib/sounds/sounds.check.ts` | `sounds.check OK` | PASS |
| Sniff and key | `bun run src/lib/label-image.check.ts` | `label-image checks passed` | PASS |
| Schema validation (one-off script in scratchpad) | insert/update schema safeParse | bad hex and `#aabbcc;x` rejected, `labelImage: 'upload'` rejected on insert and update, `gold` finish rejected | PASS |

Not run (out of scope for this verifier: no dev servers): curl matrix and browser E2E listed in the SUMMARY.

### Probe Execution

Step 7c: SKIPPED (no probes declared or present).

### Requirements Coverage

VNL-01..VNL-08 are claimed as a redesign of already-verified behaviour (see 07-VERIFICATION.md). The redesign keeps record play/pause, ambience layering, add/rename/delete, chip and room open/close paths wired; no requirement regressed in code review.

### Anti-Patterns and Bugs Found

| File | Line | Finding | Severity |
|------|------|---------|----------|
| `packages/api/src/routes/user/user.handler.ts` | 380-386 | Size cap enforced before buffering only with Content-Length; chunked uploads are buffered whole (up to the platform limit) before rejection. Authenticated only. `hono/body-limit` fixes it. | WARNING |
| `apps/next/src/components/timer/timer-progress.module.css` | 135 | `scale(0.8)` contradicts the PLAN "full size" truth; documented, needs owner override | WARNING (decision) |
| `apps/next/src/lib/sounds/sounds.check.ts` | - | PLAN Task 1 asks it to cover schema validation; it does not (the schema itself behaves, verified by one-off script) | INFO |
| `apps/next/src/components/records/SoundOptions.tsx` | 26, 47 | `FOCUSABLE = 'button, [role="slider"]'` was for the old knob. Deleting the last ambience row: next sibling is the "Add ambience" `<button>` itself, and `querySelector` searches only its descendants, so focus drops to body. Use `button, input` and match the element itself. | INFO (a11y) |
| `packages/api/src/routes/user/user.handler.ts` | 305, 357, 396 | R2 delete runs after the DB write and is not caught. If R2 fails the row change has already happened and the request returns 500, so the object is orphaned. A PUT racing a delete can also orphan an object. Low impact, objects are owner-scoped. | INFO |
| `apps/next/src/hooks/useSounds.ts` | 23-24 | `$url` does not percent-encode params (hono `replaceUrlParam`), and server ids accept any 1-64 chars. Client ids are cuid2, so this is safe in practice. | INFO |
| `packages/api/src/lib/create-app.ts` | 33 | CORP relaxed to `same-site` for every API response, not just the label GET. Acceptable under the same-root-domain deploy model. | INFO |
| `.planning/.../07-08-SUMMARY.md` | Built table | Says `label_image` is `thumb`; code and schema use `thumbnail` | INFO (doc) |
| UI | - | No UI path changes a label after creation, so "switch off upload" deletion is only reachable via the API. Plan did not require an edit UI. | INFO |

Clean: no em dash in any added line of the diff, no LOCALDEV/debug code, no secrets (`password` matches are the auth table in the drizzle snapshot), the only `console.log` is the check script's success line, the only TODO is a pre-existing line in `create-app.ts:29`. Uploaded bytes are served with the sniffed type and `X-Content-Type-Options: nosniff`, so a polyglot cannot render as HTML.

### Human Verification Required

These are visual items the executor reports checking in a browser. The verifier cannot see them:

1. 1440x900 room: 400px card, floating vinyl, arm swing on play and swap, timer at 0.8 clear of the card.
2. 390x844 touch: bottom sheet, 64px timer strip, spinning vinyl on the Records icon with caption, sleeve options visible.
3. Add dialog: disc slides out and spins; static under OS reduced motion; uploaded picture shows after reload on a second browser.

### Gaps Summary

The feature is delivered. Data model, migration, routes, wiring, client model and UI all match the must-haves, and every check passes. Two items remain:

1. **Upload size limit (code):** for requests without Content-Length, the PUT label handler buffers the whole body before applying the 1 MB check. Put `bodyLimit({ maxSize: LABEL_MAX_BYTES })` from `hono/body-limit` on the route, or stream-count the body.
2. **Timer at 0.8 (decision):** this is intentional and matches the board. The SUMMARY documents it, but the PLAN truth was never amended. The owner should record the override above, or ask for full size.

## Resolution (executor, after this report)

- Gap 1 closed: `bodyLimit({ maxSize: LABEL_MAX_BYTES })` on `putUserSoundLabel` (route
  middleware); curl chunked and Content-Length over 1MB both 413, small valid 200.
- INFO items fixed: SoundOptions focus target, R2 delete errors caught, id encoded in the label URL,
  SUMMARY `thumbnail`, schema coverage added to `label-image.check.ts`.
- Gap 2 (timer 0.8) raised for owner review in PR #116. No override recorded here.
- Not changed: CORP same-site for all API responses, no label edit UI after creation.

---

_Verified: 2026-10-16T02:29:47Z_
_Verifier: Claude (gsd-verifier)_
