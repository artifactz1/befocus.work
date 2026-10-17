import { type Look, lookSchema } from '@repo/types/look'
import { z } from 'zod'
import { readStored, writeStored } from '~/lib/storage/browser-storage'
import { lookToTokens } from './catalog'

// Guest storage mirrors the account shape (themes plus an active pointer) so Phase 4 and the
// guest-to-account move read the same records. lookPaint is the derived cache the first-frame
// script reads before any module loads.
export const GUEST_THEMES_KEY = 'befocus.themes'
export const GUEST_ACTIVE_KEY = 'befocus.activeThemeId'
export const GUEST_PAINT_KEY = 'befocus.lookPaint'

const themesSchema = z.array(
  z.object({ id: z.string().uuid(), name: z.string().max(80), look: lookSchema }),
)
const idSchema = z.string().uuid()

type Reader = Pick<Storage, 'getItem'>
type Writer = Pick<Storage, 'setItem'>

function activeEntry(storage?: Reader) {
  const id = readStored(GUEST_ACTIVE_KEY, idSchema, storage)
  const themes = readStored(GUEST_THEMES_KEY, themesSchema, storage)
  return { themes, entry: id ? themes?.find(t => t.id === id) : undefined }
}

/** The guest's saved look, or null when there is none or any record is corrupt. */
export function readGuestLook(storage?: Reader): Look | null {
  return activeEntry(storage).entry?.look ?? null
}

/** Stores `look` as the one active guest theme and refreshes the paint cache. True only if all writes land. */
export function writeGuestLook(look: Look, storage?: Reader & Writer): boolean {
  const { entry } = activeEntry(storage)
  const id = entry?.id ?? crypto.randomUUID()
  const name = entry?.name ?? 'My look'
  const a = writeStored(GUEST_THEMES_KEY, [{ id, name, look }], storage)
  const b = writeStored(GUEST_ACTIVE_KEY, id, storage)
  const c = writeStored(GUEST_PAINT_KEY, lookToTokens(look), storage)
  return a && b && c
}
