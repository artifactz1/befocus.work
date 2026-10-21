'use client'

import type { Task } from '@repo/types/tasks'
import { Check } from 'lucide-react'
import { blockRecordTasks } from '~/lib/plan/now'
import { useTasksStore } from '~/store/useToDoStore'
import styles from './tasks.module.css'

function Group({ title, list, done }: { title: string; list: Task[]; done: boolean }) {
  if (list.length === 0) return null
  return (
    <div>
      <h4 className={styles.recordSec}>{title}</h4>
      <ul className={styles.rows}>
        {list.map(t => (
          <li key={t.id} className={`${styles.row} ${styles.doneTask}`}>
            <span className={styles.tick} data-done={done || undefined}>
              {done && <Check aria-hidden='true' />}
            </span>
            <span className={styles.text}>{t.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A done focus row's record: what was worked on and what was completed, from the store links. */
export default function BlockTasks({ blockId }: { blockId: string }) {
  const links = useTasksStore(s => s.links)
  const tasks = useTasksStore(s => s.tasks)
  const { worked, completed } = blockRecordTasks(links, tasks, blockId)
  if (worked.length + completed.length === 0)
    return <span className={styles.noTasks}>No tasks</span>
  return (
    <div className={styles.record}>
      <Group title='Worked on' list={worked} done={false} />
      <Group title='Completed' list={completed} done />
    </div>
  )
}
