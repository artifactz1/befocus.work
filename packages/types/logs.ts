// ~/types/logs.ts
// Shared block log, session note and history contract. Imports only zod plus sibling types: the API
// pulls it in with a relative path.
import { z } from 'zod'
import type { BlockRecord } from './blocks'
import { TASK_TEXT_MAX } from './tasks'

export const FOCUS_RATINGS = ['scattered', 'okay', 'deep'] as const
export type FocusRating = (typeof FOCUS_RATINGS)[number]

export const TASK_FATES = ['next', 'later', 'drop'] as const
export type TaskFate = (typeof TASK_FATES)[number]

export const LOG_LIMITS = {
  text: 2000,
  nextTime: 500,
  extraDone: 20,
  extraDoneText: 500,
  carried: 64,
} as const

export const HISTORY_DAYS = { default: 35, max: 62 } as const

export const blockLogSchema = z
  .object({
    blockId: z.string().uuid(),
    sessionId: z.string().uuid(),
    text: z.string().max(LOG_LIMITS.text),
    rating: z.enum(FOCUS_RATINGS).nullable(),
  })
  .strict()
export type BlockLog = z.infer<typeof blockLogSchema>

export const carriedTaskSchema = z
  .object({
    taskId: z.string().min(1).max(64),
    text: z.string().trim().min(1).max(TASK_TEXT_MAX),
    fate: z.enum(TASK_FATES),
  })
  .strict()
export type CarriedTask = z.infer<typeof carriedTaskSchema>

export const sessionNoteSchema = z
  .object({
    sessionId: z.string().uuid(),
    nextTime: z.string().max(LOG_LIMITS.nextTime),
    extraDone: z
      .array(z.string().trim().min(1).max(LOG_LIMITS.extraDoneText))
      .max(LOG_LIMITS.extraDone),
    carried: z.array(carriedTaskSchema).max(LOG_LIMITS.carried),
  })
  .strict()
export type SessionNote = z.infer<typeof sessionNoteSchema>

export interface HistoryLink {
  blockId: string
  taskId: string
  text: string
  planned: boolean
  worked: boolean
  completed: boolean
  completedAt: string | null
}

export interface History {
  records: BlockRecord[]
  logs: BlockLog[]
  notes: SessionNote[]
  links: HistoryLink[]
  nextBefore: string | null
}
