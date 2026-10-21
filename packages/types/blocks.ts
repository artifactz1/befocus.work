// ~/types/blocks.ts
// Shared block record contract. Imports only zod: the API pulls it in with a relative path.
import { z } from 'zod'

export const BLOCK_KINDS = ['focus', 'break'] as const
export const BLOCK_OUTCOMES = ['finished', 'skipped', 'reset'] as const
export type BlockKind = (typeof BLOCK_KINDS)[number]
export type BlockOutcome = (typeof BLOCK_OUTCOMES)[number]

export const MAX_BLOCK_INDEX = 199
export const MAX_PLANNED_SECONDS = 21_600
export const MAX_ADDED_SECONDS = 21_600
export const MAX_ACTUAL_SECONDS = 86_400
export const MIN_EPOCH_MS = 1_704_067_200_000 // 2024-01-01
export const MAX_EPOCH_MS = 4_102_444_800_000 // 2100-01-01
export const MAX_BLOCK_RECORDS_PER_REQUEST = 100

export interface BlockRecord {
  id: string
  sessionId: string
  kind: BlockKind
  index: number
  plannedSeconds: number
  actualSeconds: number
  /** Signed net seconds added to (or removed from) the planned length. */
  addedSeconds: number
  startedAt: number
  endedAt: number
  outcome: BlockOutcome
}

const epochMs = z.number().int().min(MIN_EPOCH_MS).max(MAX_EPOCH_MS)

export const blockRecordSchema: z.ZodType<BlockRecord> = z
  .object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    kind: z.enum(BLOCK_KINDS),
    index: z.number().int().min(0).max(MAX_BLOCK_INDEX),
    plannedSeconds: z.number().int().min(1).max(MAX_PLANNED_SECONDS),
    actualSeconds: z.number().int().min(0).max(MAX_ACTUAL_SECONDS),
    addedSeconds: z.number().int().min(-MAX_ADDED_SECONDS).max(MAX_ADDED_SECONDS),
    startedAt: epochMs,
    endedAt: epochMs,
    outcome: z.enum(BLOCK_OUTCOMES),
  })
  .strict()
  .refine(r => r.startedAt <= r.endedAt)
