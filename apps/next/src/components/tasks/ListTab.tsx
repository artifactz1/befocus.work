'use client'

import { TASK_TEXT_MAX, type Task } from '@repo/types/tasks'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { Archive, ArchiveRestore, Check, ChevronDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useTaskActions } from '~/hooks/useTasks'
import { useTasksStore } from '~/store/useToDoStore'
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

function Row({ task }: { task: Task }) {
  const { toggle, archive, restore } = useTaskActions()
  return (
    <li className={cn(styles.row, task.completed && styles.done)}>
      <Checkbox
        className={styles.box}
        checked={task.completed}
        aria-label={task.text}
        onCheckedChange={() => toggle(task.id)}
      >
        <Check aria-hidden='true' />
      </Checkbox>
      <EditableText task={task} />
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

function AddRow({ empty }: { empty: boolean }) {
  const { add } = useTaskActions()
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
        Add a task
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
        placeholder='Add a task'
        aria-label='Add a task'
        maxLength={TASK_TEXT_MAX}
        // biome-ignore lint/a11y/noAutofocus: the row was just activated
        autoFocus
        onChange={e => setValue(e.target.value)}
        onBlur={() => {
          if (!value.trim()) setActive(false)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            add(value)
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

export default function ListTab() {
  const tasks = useTasksStore(s => s.tasks)
  const mode = useTasksStore(s => s.mode)
  const [showArchived, setShowArchived] = useState(false)
  const open = tasks.filter(t => !t.archived && !t.completed)
  const done = tasks.filter(t => !t.archived && t.completed)
  const archived = tasks.filter(t => t.archived)

  return (
    <div className={styles.list}>
      {tasks.length === 0 && (
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
      <AddRow empty={tasks.length === 0} />
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
