# 07-06 Summary - Add flow, rename and delete

## Built
- API: `insertSoundSchema`/`updateSoundSchema` accept only YouTube links via shared `isYouTubeUrl` (`packages/api/src/lib/youtube.ts`); non-YouTube POST is rejected (422 from zod-openapi), a YouTube POST saves. `sounds.check.ts` covers the validator.
- `AddSoundDialog.tsx`: add and rename modes. YouTube link validation, name prefilled from oEmbed (abortable, never overrides typing, focus moves to Name if the lookup fails), Record/Ambience radiogroup, inline error keeps the dialog open, focus lands on the new item.
- `RecordRoomBody.tsx`: paste anywhere in the room opens the dialog. Non-YouTube text toasts "Only YouTube links can be added for now."; guests get "Sign in to add and keep your own records."; input fields and other dialogs are ignored.
- `Shelf.tsx` / `KnobRow.tsx`: Add record / Add ambience tiles (signed in), `data-sound-id` on items, guest footnote links to `/sign-in`.
- `SoundOptions.tsx`: "Options for {name}" menu with Rename (non-starters) and Delete, confirm alert dialog (starter copy is per browser). Shown on hover and focus-within, always on touch devices. Focus moves to a neighbouring item or the add tile after delete.
- `RecordRoom.tsx`: Escape no longer closes the room while a dialog or menu is open.

## Deviations
- Rename has no optimistic cache update: invalidate on success is enough.
- Non-YouTube rejection returns 422, not 400 (zod-openapi default).

## Verified
- tsc, biome, sounds.check green. Browser at 1440 and 390: paste with oEmbed prefill, add (persists across reload), rename, delete, Escape with menu open keeps room, guest toasts and sign-in link. Curl: non-YouTube POST rejected, YouTube POST saved.
