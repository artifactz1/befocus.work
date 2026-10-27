'use client'

import type { TaskFate } from '@repo/types/logs'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { Check, X } from 'lucide-react'
import { useMemo } from 'react'
import type { SummaryHandlers } from '~/hooks/useSummary'
import { makeFormat, type Summary } from '~/lib/logs/summary'
import { AddRow } from '../tasks/ListTab'
import tasksStyles from '../tasks/tasks.module.css'
import { Seg } from './Seg'
import styles from './summary.module.css'

const LATER_LIMIT = 5

const FATES: { value: TaskFate; label: string }[] = [
  { value: 'next', label: 'Next session' },
  { value: 'later', label: 'Later' },
  { value: 'drop', label: 'Drop' },
]

const TAG: Record<TaskFate, string> = { next: 'next session', later: 'later', drop: 'dropped' }

/** A read-only box for past sessions. */
function StaticBox({ checked }: { checked: boolean }) {
  return (
    <span className={tasksStyles.box} data-state={checked ? 'checked' : 'unchecked'} aria-hidden>
      {checked && <Check aria-hidden='true' />}
    </span>
  )
}

export function DoneList({
  summary,
  live,
  handlers,
  onOpenTasks,
}: {
  summary: Summary
  live: boolean
  handlers: SummaryHandlers
  onOpenTasks?: () => void
}) {
  const fmt = useMemo(() => makeFormat(), [])
  const now = Date.now()
  const doneCount = summary.done.length + summary.extraDone.length
  const hasTasks = summary.done.length + summary.notDone.length > 0
  const setFate = live ? handlers.setFate : undefined

  // Unticking clears every completed link of the task in this session.
  const untick = (taskId: string) =>
    void handlers.setTicks(
      summary.blocks.flatMap(b =>
        b.tasks.some(t => t.taskId === taskId && t.completed)
          ? [{ blockId: b.id, taskId, completed: false }]
          : [],
      ),
    )
  // Ticking completes the task on the last block that touched it.
  const tick = (taskId: string) => {
    const touched = summary.blocks.filter(b => b.tasks.some(t => t.taskId === taskId))
    const last = touched[touched.length - 1]
    if (last) void handlers.setTicks([{ blockId: last.id, taskId, completed: true }])
  }

  const later = summary.later.slice(0, LATER_LIMIT)
  const moreLater = summary.later.length - later.length

  return (
    <div className={styles.lists}>
      {(doneCount > 0 || live) && (
        <section>
          <h3 className={styles.sec}>
            Done <em>{doneCount}</em>
          </h3>
          <ul className={styles.items}>
            {summary.done.map(d => (
              <li key={d.taskId} className={styles.item}>
                {live ? (
                  <Checkbox
                    className={tasksStyles.box}
                    checked
                    aria-label={d.text}
                    onCheckedChange={() => untick(d.taskId)}
                  >
                    <Check aria-hidden='true' />
                  </Checkbox>
                ) : (
                  <StaticBox checked />
                )}
                <span className={cn(styles.text, styles.struck)}>{d.text}</span>
              </li>
            ))}
            {summary.extraDone.map((text, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: free text items have no id and are removed by index
              <li key={`${i}-${text}`} className={styles.item}>
                <StaticBox checked />
                <span className={cn(styles.text, styles.struck)}>{text}</span>
                {live && (
                  <button
                    type='button'
                    className={styles.remove}
                    aria-label={`Remove ${text}`}
                    onClick={() => handlers.removeDone(i)}
                  >
                    <X aria-hidden='true' />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {live && <AddRow empty={false} label='Add something you did' onAdd={handlers.addDone} />}
        </section>
      )}

      {hasTasks && summary.notDone.length > 0 && (
        <section>
          <h3 className={styles.sec}>
            Not done <em>{summary.notDone.length}</em>
          </h3>
          <ul className={styles.items}>
            {summary.notDone.map(n => (
              <li key={n.taskId} className={cn(styles.item, styles.notDone)}>
                {live ? (
                  <Checkbox
                    className={tasksStyles.box}
                    checked={false}
                    aria-label={`${n.text}, not done`}
                    onCheckedChange={() => tick(n.taskId)}
                  >
                    <Check aria-hidden='true' />
                  </Checkbox>
                ) : (
                  <StaticBox checked={false} />
                )}
                <span
                  className={cn(styles.text, styles.ellipsis, n.fate === 'drop' && styles.dim)}
                  title={n.text}
                >
                  {n.text}
                </span>
                {setFate ? (
                  <div className={styles.fate}>
                    <Seg
                      size='xs'
                      legend={`What happens to ${n.text}`}
                      options={FATES}
                      value={n.fate}
                      onChange={v => v && setFate(n.taskId, v as TaskFate)}
                    />
                  </div>
                ) : (
                  <span className={styles.tag}>{TAG[n.fate]}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.later.length > 0 && (
        <section>
          <h3 className={styles.sec}>
            Later <em>{summary.later.length}</em>
          </h3>
          <ul className={styles.items}>
            {later.map(l => (
              <li key={l.taskId} className={styles.item}>
                <span className={styles.laterDot} aria-hidden />
                <span className={cn(styles.text, styles.ellipsis)} title={l.text}>
                  {l.text}
                </span>
                {l.laterAt && <span className={styles.since}>{fmt.since(l.laterAt, now)}</span>}
              </li>
            ))}
          </ul>
          {moreLater > 0 &&
            (onOpenTasks ? (
              <button type='button' className={styles.ghostRow} onClick={onOpenTasks}>
                +{moreLater} more in Tasks
              </button>
            ) : (
              <span className={styles.ghostRow}>+{moreLater} more in Tasks</span>
            ))}
        </section>
      )}
    </div>
  )
}
