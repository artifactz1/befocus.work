# 07-08 Summary - Quiet Deck redesign and vinyl label uploads

Requirements: VNL-01..VNL-08 (redesign of the shipped room). Source: second design board,
Direction A "Quiet Deck", owner review rounds 3-5 (2026-10-15).

## Built

| Area | What |
|------|------|
| Schema | `sounds.label_color`, `label_image` (`thumbnail` or `upload`), `disc_finish` (`black` default, `smoke`, `tinted`); migration `0009_vinyl_labels.sql` |
| Label bucket | R2 binding `LABELS` (bucket `befocus-labels`). `PUT /user/sounds/:id/label` stores `labels/{userId}/{soundId}` after an owner check, a 1MB cap and a magic-byte sniff (PNG, JPEG, WebP). `GET` streams it to the owner only, with ETag and 304. Delete, and switching away from an upload, remove the object |
| Headers | `secureHeaders({ crossOriginResourcePolicy: 'same-site' })` so the web origin can show label images |
| Client | Store, `useSounds` and `lib/sounds` carry the new fields; `labelImageUrl`; label upload after create |
| Room | 400px left card on desktop, bottom sheet under 1024px; floating vinyl deck with hairline tonearm, transport row (play, title, `n of m`, volume), ambience slider rows, 4-column square sleeve shelf |
| Vinyl | One `Vinyl` component for deck, sleeves, chip and dialog: label colour, thumbnail or upload, finish, no inner ring |
| Outside the room | Desktop now-playing pill above the footer; phone Records icon becomes a spinning 26px vinyl with a "Name · tap to open" caption |
| Add dialog | 440px card (bottom sheet on phone): link, Record or Ambience, square cover with the disc sliding out and spinning (off under reduced motion), label Auto / 7 swatches / thumbnail / upload, disc Black / Smoke / Tinted, name on sleeve, sticky footer |
| Timer | Desktop digits scale to 0.8 while the room is open (board a-desk); under 1024px the timer is one 64px line above the sheet |

## Fixes found in E2E

| Finding | Root cause | Fix |
|---------|-----------|-----|
| Label image blank after reload | R2 304 had no Content-Type, so Chrome's ORB blocked it | Content-Type on 304 too |
| Record swap hung with the arm up | Swap awaited a swing animation that the arm effect interrupts | Swap drives only the disc opacity; arm effect owns the swing |
| Phone add dialog: focus pulled back to the room heading, one Escape closed both | vaul installed its own `@radix-ui/react-dialog@1.1.6`, so the drawer and the dialog ran separate focus and dismiss stacks | Root `overrides` keeps one `@radix-ui/react-dialog` |
| Focus lost after closing the add dialog on touch | A tap does not focus the add button | The opener element is passed in and focused on close |
| Phone page 9px wider than the screen | Styled `::-webkit-scrollbar` takes width on touch | Scrollbar styles under `@media (pointer: fine)` |
| Sleeve options unreachable on touch | Shown on hover only | Always shown under `@media (hover: none)` |
| Records tooltip stuck after a tap | Tooltip opened on focus | Opens on hover or `:focus-visible` only |
| 768px page overflow (on master too) | 9 footer buttons at 80px need 764px | `md:w-16` on footer menu buttons |
| Hydration mismatch from GlobalSoundsPlayer | react-player renders its lazy players only in the browser | Player renders after mount |

## Deviation

- The plan's first truth says the timer stays full size. On desktop the digits scale to 0.8 while the
  room is open, matching the approved board shot (a-desk), so they clear the card at 1440.

## Verification

- `bun run check`, Next and API `tsc --noEmit`, `sounds.check`, `label-image.check`, `turbo:build` pass.
- Browser (chrome-devtools-axi, local API + Postgres + R2 via wrangler): 1440, 768 and 390x844 touch;
  no horizontal overflow; add, upload, thumbnail, finish, rename, delete and reload all persist;
  keyboard Escape order dialog then room, focus returns to the opener.
- curl against the local API with two users: no session 401, fake SVG 415, over 1MB 413, another
  user's sound 404 on PUT and GET, upload 200 then GET 200 same bytes with CORP same-site, nosniff and
  ETag, conditional 304, switch to thumbnail then GET 404, delete then GET 404.
- Console: only the pre-existing react-player YouTube postMessage origin warning.

## After verification (07-08-VERIFICATION.md)

- PUT label route caps the body with `hono/body-limit` before buffering, with or without
  Content-Length (curl: chunked 1.1MB 413, chunked junk 415, chunked valid 200).
- R2 deletes after a row change are caught and logged, so a failed delete no longer turns a
  committed change into a 500.
- Deleting the last ambience row hands focus to "Add ambience" (browser check).
- Label image URL percent-encodes the id.
- `label-image.check` covers the sound schemas: only the PUT route can set an uploaded label.
- Timer at 0.8 is left for the owner (see Deviation).

## Owner review rounds (Lavish board, after verification)

The owner reviewed the built room on a local Lavish board over 13 rounds and closed it with
"looks good end it". Commit b3b7748 carries the result:

- Deck vinyl centred in the deck (desktop and phone).
- Shelf is a record crate: the front sleeve shows its disc out to the right, the next four
  sleeves stand behind it. Flip by arrows, Left/Right keys, clicking an edge or swiping on touch.
  Flips use a small bounce (edges glide to their new slot, the new front pops in over the old).
  Reduced motion flips instantly.
- Crate discs are always black; the label keeps its colour or picture. Smoke and Tinted finishes
  stay in the add dialog and show on the deck.
- Desktop: Add a record, Add ambience and Rename open inside the room card with a Back button
  instead of a second dialog. Phone and tablet keep the bottom sheet. A new record comes to the
  crate front with focus on it.
- Timer stays at 0.8 while the room is open (the owner did not ask to change it).

## Deploy notes

- Create R2 bucket `befocus-labels` and apply migration 0009 before deploying the API.

## Not done

- A video with no YouTube thumbnail shows YouTube's grey placeholder as its label picture.
- `document.title` is empty on the dashboard (pre-existing, out of scope).
