'use client'

import { TASK_TEXT_MAX, type Task } from '@repo/types/tasks'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { Archive, ArchiveRestore, Check, ChevronDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useNow } from '~/hooks/usePlan'
import { useTaskActions, useUserTasks } from '~/hooks/useTasks'
import { makeFormat } from '~/lib/logs/summary'
import { plannedBlockNumber } from '~/lib/plan/plan'
import { useTasksStore, useTasksStoreApi } from '~/store/useToDoStore'
import records from '../records/records.module.css'
import styles from './tasks.module.css'

function EditableText({ task }: { task: Task }) {
  const { edit } = useTaskActions()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(task.text)
  // Escape sets this so the blur it triggers does not save
  const cancelled = useRef(false)

  if (!editing) {
    return (
      <button
        type='button'
        className={styles.text}
        aria-label={`Edit ${task.text}`}
        onClick={() => {
          setValue(task.text)
          setEditing(true)
        }}
      >
        {task.text}
      </button>
    )
  }

  const finish = (save: boolean) => {
    if (save) edit(task.id, value)
    setEditing(false)
  }

  return (
    <input
      className={styles.input}
      value={value}
      maxLength={TASK_TEXT_MAX}
      aria-label={`Edit ${task.text}`}
      // biome-ignore lint/a11y/noAutofocus: focus moves to the field the user just opened
      autoFocus
      onChange={e => setValue(e.target.value)}
      onBlur={() => {
        if (cancelled.current) cancelled.current = false
        else finish(true)
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') finish(true)
        else if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          cancelled.current = true
          finish(false)
        }
      }}
    />
  )
}

function Row({ task, laterRow }: { task: Task; laterRow?: boolean }) {
  const { completeTask, archive, restore, setLater } = useTaskActions()
  const block = useTasksStore(s =>
    s.plan ? plannedBlockNumber(s.plan.blocks, s.links, task.id) : null,
  )
  const now = useNow()
  const isNow = now.task?.id === task.id
  const inCurrent = block !== null && now.blockTasks.some(t => t.id === task.id)
  return (
    <li className={cn(styles.row, task.completed && styles.done, isNow && styles.nowRow)}>
      <Checkbox
        className={cn(styles.box, laterRow && styles.laterBox)}
        checked={task.completed}
        aria-label={task.text}
        onCheckedChange={checked => completeTask(task.id, checked === true)}
      >
        <Check aria-hidden='true' />
      </Checkbox>
      <EditableText task={task} />
      {isNow && <span className={styles.nowTagRow}>Now</span>}
      {block !== null && !task.archived && (
        <span className={styles.chip} data-current={inCurrent || undefined}>
          <span aria-hidden='true'>B{block}</span>
          <span className='sr-only'>Planned in Block {block}</span>
        </span>
      )}
      {laterRow && task.laterAt && (
        <span className={styles.laterDate}>{makeFormat().since(task.laterAt, Date.now())}</span>
      )}
      {laterRow && (
        <button type='button' className={styles.bringBack} onClick={() => setLater(task.id, false)}>
          Bring back
        </button>
      )}
      {task.archived ? (
        <button
          type='button'
          className={styles.act}
          aria-label={`Restore ${task.text}`}
          onClick={() => restore(task.id)}
        >
          <ArchiveRestore aria-hidden='true' />
        </button>
      ) : (
        <button
          type='button'
          className={styles.act}
          aria-label={`Archive ${task.text}`}
          onClick={() => archive(task.id)}
        >
          <Archive aria-hidden='true' />
        </button>
      )}
    </li>
  )
}

export function AddRow({
  empty,
  label = 'Add a task',
  onAdd,
}: {
  empty: boolean
  label?: string
  onAdd: (text: string) => void
}) {
  const [active, setActive] = useState(empty)
  const [value, setValue] = useState('')
  const input = useRef<HTMLInputElement>(null)

  // With no tasks the input is focused on open
  useEffect(() => {
    if (empty) input.current?.focus()
  }, [empty])

  if (!active) {
    return (
      <button type='button' className={styles.add} onClick={() => setActive(true)}>
        <Plus aria-hidden='true' />
        {label}
      </button>
    )
  }

  return (
    <div className={styles.add}>
      <Plus aria-hidden='true' />
      <input
        ref={input}
        className={styles.input}
        value={value}
        placeholder={label}
        aria-label={label}
        maxLength={TASK_TEXT_MAX}
        // biome-ignore lint/a11y/noAutofocus: the row was just activated
        autoFocus
        onChange={e => setValue(e.target.value)}
        onBlur={() => {
          if (!value.trim()) setActive(false)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onAdd(value)
            setValue('')
          } else if (e.key === 'Escape' && !value.trim()) {
            e.preventDefault()
            e.stopPropagation()
            setActive(false)
          }
        }}
      />
    </div>
  )
}

export function Skeleton({ rows, height, gap }: { rows: number; height: number; gap: number }) {
  return (
    <div className={styles.skeletons} style={{ gap }} aria-busy='true'>
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
        <div key={i} className={styles.skeleton} style={{ height }} />
      ))}
    </div>
  )
}

function LoadError() {
  const store = useTasksStoreApi()
  const { refetch, isFetching } = useUserTasks()
  if (isFetching) return <Skeleton rows={3} height={36} gap={4} />
  return (
    <div className={styles.loadError} role='alert'>
      <span>Couldn't load your tasks.</span>
      <button
        type='button'
        className={styles.retry}
        disabled={isFetching}
        onClick={async () => {
          const { data } = await refetch()
          if (data) store.getState().hydrateTasks(data)
        }}
      >
        Try again
      </button>
    </div>
  )
}

export default function ListTab() {
  const { add } = useTaskActions()
  const tasks = useTasksStore(s => s.tasks)
  const mode = useTasksStore(s => s.mode)
  const loadState = useTasksStore(s => s.loadState)
  const [showArchived, setShowArchived] = useState(false)
  const open = tasks.filter(t => !t.archived && !t.completed && !t.later)
  const later = tasks
    .filter(t => !t.archived && !t.completed && t.later)
    .sort((a, b) => (b.laterAt ?? '').localeCompare(a.laterAt ?? ''))
  const done = tasks.filter(t => !t.archived && t.completed)
  const archived = tasks.filter(t => t.archived)

  return (
    <div className={styles.list}>
      {loadState === 'error' && <LoadError />}
      {tasks.length === 0 && loadState === 'ready' && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No tasks yet</p>
          <p>Add what you want to get done this session.</p>
        </div>
      )}
      <h3 className={records.sec}>
        Open <em>{open.length}</em>
      </h3>
      <ul className={styles.rows}>
        {open.map(t => (
          <Row key={t.id} task={t} />
        ))}
      </ul>
      <AddRow empty={tasks.length === 0} onAdd={add} />
      {later.length > 0 && (
        <div className={styles.laterGroup}>
          <h3 className={cn(records.sec, styles.later)}>
            Later <em>{later.length}</em>
          </h3>
          <ul className={styles.rows}>
            {later.map(t => (
              <Row key={t.id} task={t} laterRow />
            ))}
          </ul>
        </div>
      )}
      {done.length > 0 && (
        <>
          <h3 className={cn(records.sec, styles.later)}>
            Done <em>{done.length}</em>
          </h3>
          <ul className={styles.rows}>
            {done.map(t => (
              <Row key={t.id} task={t} />
            ))}
          </ul>
        </>
      )}
      {archived.length > 0 && (
        <>
          <button
            type='button'
            className={cn(records.sec, styles.later, styles.disclosure)}
            aria-expanded={showArchived}
            onClick={() => setShowArchived(v => !v)}
          >
            <span>
              Archived <em>{archived.length}</em>
            </span>
            <ChevronDown aria-hidden='true' data-open={showArchived || undefined} />
          </button>
          {showArchived && (
            <ul className={styles.rows}>
              {archived.map(t => (
                <Row key={t.id} task={t} />
              ))}
            </ul>
          )}
        </>
      )}
      {mode === 'guest' && (
        <p className={styles.note}>
          Saved in this browser. <Link href='/sign-in'>Sign in</Link> to keep tasks on every device.
        </p>
      )}
    </div>
  )
}
