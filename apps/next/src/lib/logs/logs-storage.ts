import type { BlockRecord } from '@repo/types/blocks'
import {
  type BlockLog,
  blockLogSchema,
  type History,
  type SessionNote,
  sessionNoteSchema,
} from '@repo/types/logs'
import type { TaskLink } from '@repo/types/plan'
import type { Task } from '@repo/types/tasks'
import { z } from 'zod'
import { toHistoryLinks } from '~/lib/logs/summary'

export const GUEST_LOGS_KEY = 'befocus.blockLogs'
export const GUEST_NOTES_KEY = 'befocus.sessionNotes'
const MAX_LOGS = 500
const MAX_NOTES = 200
const DAY_MS = 86_400_000

// Items stay unknown here so one bad item cannot discard its valid siblings.
export const guestItemsSchema = z.object({
  version: z.literal(1),
  items: z.array(z.unknown()).max(5000),
})

function parseItems<T>(raw: unknown, schema: z.ZodType<T, z.ZodTypeDef, unknown>): T[] {
  const env = guestItemsSchema.safeParse(raw)
  if (!env.success) return []
  const out: T[] = []
  for (const item of env.data.items) {
    const parsed = schema.safeParse(item)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

/** Guest storage is untrusted: this is the only path from it to block logs. */
export const parseGuestLogs = (raw: unknown): BlockLog[] =>
  parseItems(raw, blockLogSchema).slice(-MAX_LOGS)

/** Guest storage is untrusted: this is the only path from it to session notes. */
export const parseGuestNotes = (raw: unknown): SessionNote[] =>
  parseItems(raw, sessionNoteSchema).slice(-MAX_NOTES)

// Replaced item moves to the end, so the cap drops the least recently saved.
function upsert<T>(items: T[], next: T, same: (a: T) => boolean, cap: number) {
  return { version: 1 as const, items: [...items.filter(i => !same(i)), next].slice(-cap) }
}

export const upsertGuestLog = (raw: unknown, log: BlockLog) =>
  upsert(parseGuestLogs(raw), log, l => l.blockId === log.blockId, MAX_LOGS)

export const upsertGuestNote = (raw: unknown, note: SessionNote) =>
  upsert(parseGuestNotes(raw), note, n => n.sessionId === note.sessionId, MAX_NOTES)

export type GuestHistoryInput = {
  records: BlockRecord[]
  linkHistory: TaskLink[]
  liveLinks: TaskLink[]
  tasks: Task[]
  logs: BlockLog[]
  notes: SessionNote[]
}

/**
 * History for guests in the same shape the account API returns. A session belongs to the window
 * when its latest record started inside [before - days, before); it then comes back whole.
 * `nextBefore` is set when a session older than the window exists.
 */
export function guestHistory(
  input: GuestHistoryInput,
  window: { before: number; days: number },
): History {
  const start = window.before - window.days * DAY_MS
  const latest = new Map<string, number>()
  for (const r of input.records) {
    latest.set(r.sessionId, Math.max(latest.get(r.sessionId) ?? 0, r.startedAt))
  }
  const inWindow = new Set<string>()
  let older = false
  for (const [id, at] of latest) {
    if (at >= start && at < window.before) inWindow.add(id)
    else if (at < start) older = true
  }
  const records = input.records
    .filter(r => inWindow.has(r.sessionId))
    .sort((a, b) => a.startedAt - b.startedAt)
  const blockIds = new Set(records.map(r => r.id))
  // Live links win over the stored copy of the same block and task.
  const key = (l: TaskLink) => `${l.blockId}:${l.taskId}`
  const merged = new Map(input.linkHistory.map(l => [key(l), l]))
  for (const l of input.liveLinks) merged.set(key(l), l)
  return {
    records,
    logs: input.logs.filter(l => inWindow.has(l.sessionId)),
    notes: input.notes.filter(n => inWindow.has(n.sessionId)),
    links: toHistoryLinks(
      [...merged.values()].filter(l => blockIds.has(l.blockId)),
      input.tasks,
    ),
    nextBefore: older ? new Date(start).toISOString() : null,
  }
}
