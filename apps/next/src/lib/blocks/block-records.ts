import { type BlockRecord, blockRecordSchema } from '@repo/types/blocks'
import { z } from 'zod'
import { defaultStorage, readStored, writeStored } from '~/lib/storage/browser-storage'

export const GUEST_RECORDS_KEY = 'befocus.blockRecords'
export const MAX_STORED_RECORDS = 500

/** Stored guest records; invalid entries are dropped, never throws. */
export function readGuestRecords(
  storage: Pick<Storage, 'getItem'> | undefined = defaultStorage(),
): BlockRecord[] {
  const raw = readStored(GUEST_RECORDS_KEY, z.array(z.unknown()), storage) ?? []
  const valid: BlockRecord[] = []
  for (const item of raw) {
    const parsed = blockRecordSchema.safeParse(item)
    if (parsed.success) valid.push(parsed.data)
  }
  return valid.slice(-MAX_STORED_RECORDS)
}

/** Upsert by id: incoming copies replace existing ones and sit at the end; keeps the newest `cap`. */
export function mergeRecords(
  existing: BlockRecord[],
  incoming: BlockRecord[],
  cap: number,
): BlockRecord[] {
  const latest = new Map(incoming.map(r => [r.id, r]))
  const kept = existing.filter(r => !latest.has(r.id))
  return [...kept, ...latest.values()].slice(-cap)
}

export function appendGuestRecords(
  records: BlockRecord[],
  storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = defaultStorage(),
): boolean {
  return writeStored(
    GUEST_RECORDS_KEY,
    mergeRecords(readGuestRecords(storage), records, MAX_STORED_RECORDS),
    storage,
  )
}
