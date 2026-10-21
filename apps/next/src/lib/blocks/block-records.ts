import {
  type BlockRecord,
  blockRecordSchema,
  MAX_BLOCK_RECORDS_PER_REQUEST,
} from '@repo/types/blocks'
import { z } from 'zod'
import { defaultStorage, readStored, writeStored } from '~/lib/storage/browser-storage'

export const GUEST_RECORDS_KEY = 'befocus.blockRecords'
export const MAX_STORED_RECORDS = 500

function readRecordList(key: string, storage: Pick<Storage, 'getItem'> | undefined): BlockRecord[] {
  const raw = readStored(key, z.array(z.unknown()), storage) ?? []
  const valid: BlockRecord[] = []
  for (const item of raw) {
    const parsed = blockRecordSchema.safeParse(item)
    if (parsed.success) valid.push(parsed.data)
  }
  return valid.slice(-MAX_STORED_RECORDS)
}

/** Stored guest records; invalid entries are dropped, never throws. */
export function readGuestRecords(
  storage: Pick<Storage, 'getItem'> | undefined = defaultStorage(),
): BlockRecord[] {
  return readRecordList(GUEST_RECORDS_KEY, storage)
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

export const queueKey = (userId: string) => `befocus.blockQueue.${userId}`

type SendResult = 'ok' | 'drop' | 'retry'

/**
 * Persisted per-user queue for signed-in records. Merge by id, one send in flight, chunks of 100.
 * A record leaves the queue only after its own send returned 'ok' or 'drop'. Retries happen only on
 * push() or flush(), never on a timer.
 */
export function createRecordQueue({
  send,
  key,
  storage = defaultStorage(),
}: {
  send: (records: BlockRecord[]) => Promise<SendResult>
  key: string
  storage?: Pick<Storage, 'getItem' | 'setItem'>
}) {
  let running: Promise<void> | null = null

  async function drain() {
    for (;;) {
      const chunk = readRecordList(key, storage).slice(0, MAX_BLOCK_RECORDS_PER_REQUEST)
      if (chunk.length === 0) return
      let result: SendResult
      try {
        result = await send(chunk)
      } catch {
        result = 'retry'
      }
      if (result === 'retry') return
      if (result === 'drop') console.warn(`Dropped ${chunk.length} invalid block records`)
      // Keep any newer copy of the same id that was pushed while the send was in flight.
      const sent = new Map(chunk.map(r => [r.id, JSON.stringify(r)]))
      writeStored(
        key,
        readRecordList(key, storage).filter(r => sent.get(r.id) !== JSON.stringify(r)),
        storage,
      )
    }
  }

  function flush(): Promise<void> {
    running ??= drain().finally(() => {
      running = null
    })
    return running
  }

  return {
    flush,
    push(records: BlockRecord[]) {
      // Written before anything async so a pagehide push is on disk when the page goes away.
      writeStored(
        key,
        mergeRecords(readRecordList(key, storage), records, MAX_STORED_RECORDS),
        storage,
      )
      void flush()
    },
  }
}
