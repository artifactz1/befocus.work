'use client'

import { type BlockLog, type CarriedTask, LOG_LIMITS, type SessionNote } from '@repo/types/logs'
import { useRef, useState } from 'react'
import type { LogFormValues } from '~/components/logs/LogForm'
import { type TasksStoreApi, useLogActions } from '~/hooks/useLogs'
import { buildSummary, type SummaryBlock, type SummaryInput } from '~/lib/logs/summary'
import type { TasksMode } from '~/store/useToDoStore'

export type Tick = { blockId: string; taskId: string; completed: boolean }

export type SummaryHandlers = {
  saveLog: (block: SummaryBlock, values: LogFormValues) => Promise<void>
  setTicks: (items: Tick[]) => Promise<void>
  addDone: (text: string) => void
  removeDone: (index: number) => void
  setNextTime: (text: string) => void
  setCarried: (carried: CarriedTask[]) => void
  note: () => SessionNote
  /** Supplied by the stage (needs plan actions); absent on /log, where fates are read-only. */
  setFate?: (taskId: string, fate: CarriedTask['fate']) => void
}

const tickKey = (t: { blockId: string; taskId: string }) => `${t.blockId}:${t.taskId}`

const clampNote = (n: SessionNote): SessionNote => ({
  ...n,
  nextTime: n.nextTime.slice(0, LOG_LIMITS.nextTime),
  extraDone: n.extraDone
    .map(t => t.trim().slice(0, LOG_LIMITS.extraDoneText))
    .filter(Boolean)
    .slice(0, LOG_LIMITS.extraDone),
  carried: n.carried.slice(0, LOG_LIMITS.carried),
})

/**
 * Summary plus optimistic overrides for logs, note and ticks. The overrides are kept after a save
 * (the source catches up on its own) and dropped only when the save fails.
 */
export function useSummaryModel({
  mode,
  store,
  input,
}: {
  mode: TasksMode
  store: TasksStoreApi | null
  input: SummaryInput
}) {
  const { saveLog, saveTicks, saveNote } = useLogActions(mode, store)
  const [logOv, setLogOv] = useState<Record<string, BlockLog>>({})
  const [noteOv, setNoteOv] = useState<SessionNote | null>(null)
  const [tickOv, setTickOv] = useState<Record<string, boolean>>({})

  const summary = buildSummary({
    ...input,
    links: input.links.map(l => {
      const completed = tickOv[tickKey(l)]
      return completed === undefined ? l : { ...l, worked: true, completed }
    }),
    logs: [...input.logs.filter(l => !(l.blockId in logOv)), ...Object.values(logOv)],
    note: noteOv ?? input.note,
  })

  const base: SessionNote = noteOv ??
    input.note ?? { sessionId: input.sessionId, nextTime: '', extraDone: [], carried: [] }
  const noteRef = useRef(base)
  noteRef.current = base

  const writeNote = (patch: Partial<SessionNote>) => {
    const before = noteRef.current
    const next = clampNote({ ...before, ...patch })
    noteRef.current = next
    setNoteOv(next)
    void saveNote(next).then(ok => {
      if (ok) return
      noteRef.current = before
      setNoteOv(before)
    })
  }

  const setTicks = async (items: Tick[]) => {
    if (items.length === 0) return
    const before = items.map(i => [tickKey(i), tickOv[tickKey(i)]] as const)
    setTickOv(o => ({ ...o, ...Object.fromEntries(items.map(i => [tickKey(i), i.completed])) }))
    if (await saveTicks(items)) return
    setTickOv(o => {
      const n = { ...o }
      for (const [key, was] of before) {
        if (was === undefined) delete n[key]
        else n[key] = was
      }
      return n
    })
  }

  const saveBlockLog = async (block: SummaryBlock, values: LogFormValues) => {
    const log: BlockLog = {
      blockId: block.id,
      sessionId: input.sessionId,
      text: values.text.trim().slice(0, LOG_LIMITS.text),
      rating: values.rating,
    }
    const before = logOv[block.id]
    setLogOv(o => ({ ...o, [block.id]: log }))
    void setTicks(
      block.tasks
        .filter(t => values.ticks[t.taskId] !== undefined && values.ticks[t.taskId] !== t.completed)
        .map(t => ({
          blockId: block.id,
          taskId: t.taskId,
          completed: values.ticks[t.taskId] === true,
        })),
    )
    if (await saveLog(log, block.focusNumber ?? 0)) return
    setLogOv(o => {
      const n = { ...o }
      if (before) n[block.id] = before
      else delete n[block.id]
      return n
    })
  }

  const handlers: SummaryHandlers = {
    saveLog: saveBlockLog,
    setTicks,
    addDone: text => {
      const t = text.trim()
      if (t) writeNote({ extraDone: [...noteRef.current.extraDone, t] })
    },
    removeDone: index =>
      writeNote({ extraDone: noteRef.current.extraDone.filter((_, i) => i !== index) }),
    setNextTime: text => writeNote({ nextTime: text }),
    setCarried: carried => writeNote({ carried }),
    note: () => noteRef.current,
  }

  return { summary, handlers }
}
