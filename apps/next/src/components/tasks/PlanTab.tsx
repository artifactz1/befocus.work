'use client'

import { PLAN_LIMITS } from '@repo/types/plan'
import type { Task } from '@repo/types/tasks'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, GripVertical, Minus, Plus } from 'lucide-react'
import { type DragEvent, useState } from 'react'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { usePlanActions, useSessionView } from '~/hooks/usePlan'
import { useTaskActions } from '~/hooks/useTasks'
import { api } from '~/lib/api.client'
import {
  formatClock,
  formatDuration,
  formatRange,
  type LiveBlock,
  planSummary,
} from '~/lib/plan/plan'
import { useTasksStore, useTasksStoreApi } from '~/store/useToDoStore'
import records from '../records/records.module.css'
import { AddRow, Skeleton } from './ListTab'
import styles from './tasks.module.css'

const EASE = [0.2, 0.7, 0.2, 1] as const
const PX_PER_MINUTE = 2.4
const DRAG_TYPE = 'application/x-befocus-task'

// One checklist row: checked means planned in this block; checking a task planned elsewhere moves it.
function AssignRow({
  task,
  blockId,
  blockName,
  elsewhere,
  draggable,
  onAssign,
}: {
  task: Task
  blockId: string
  blockName: string
  elsewhere: number | null
  draggable: boolean
  onAssign: (taskId: string, blockId: string | null) => void
}) {
  const here = useTasksStore(s =>
    s.links.some(l => l.taskId === task.id && l.blockId === blockId && l.planned),
  )
  const hintId = `planned-${task.id}`
  return (
    <li
      className={cn(styles.row, styles.assignRow)}
      draggable={draggable || undefined}
      onDragStart={
        draggable
          ? e => {
              e.dataTransfer.setData(DRAG_TYPE, task.id)
              e.dataTransfer.effectAllowed = 'move'
            }
          : undefined
      }
    >
      {draggable && <GripVertical className={styles.grip} aria-hidden='true' />}
      <Checkbox
        className={styles.box}
        checked={here}
        aria-label={`${task.text}, in ${blockName}`}
        aria-describedby={elsewhere !== null ? hintId : undefined}
        onCheckedChange={checked => onAssign(task.id, checked === true ? blockId : null)}
      >
        <Check aria-hidden='true' />
      </Checkbox>
      <span className={styles.text}>{task.text}</span>
      {elsewhere !== null && (
        <>
          <span className={styles.chip} aria-hidden='true'>
            B{elsewhere}
          </span>
          <span id={hintId} className='sr-only'>
            Planned in Block {elsewhere}. Checking moves it here.
          </span>
        </>
      )}
    </li>
  )
}

function AssignList({
  blockId,
  name,
  draggable,
}: {
  blockId: string
  name: string
  draggable: boolean
}) {
  const tasks = useTasksStore(s => s.tasks)
  const links = useTasksStore(s => s.links)
  const plan = useTasksStore(s => s.plan)
  const { assignTask } = usePlanActions()
  const { addToBlock } = useTaskActions()
  const focusIds = plan?.blocks.filter(b => b.kind === 'focus').map(b => b.id) ?? []
  // number of the block each open task is planned in (null = unplanned)
  const planned = (taskId: string) => {
    const link = links.find(l => l.taskId === taskId && l.planned)
    const i = link ? focusIds.indexOf(link.blockId) : -1
    return i < 0 ? null : { blockId: link?.blockId, number: i + 1 }
  }
  const open = tasks.filter(t => !t.archived && !t.completed)
  const rank = (t: Task) => {
    const p = planned(t.id)
    return p === null ? 1_000 : p.blockId === blockId ? 0 : p.number + 1_000
  }
  // this block, then unplanned, then other blocks by index (sort is stable)
  const ordered = [...open].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    const bucket = (r: number) => (r === 0 ? 0 : r === 1_000 ? 1 : 2)
    return bucket(ra) - bucket(rb) || (bucket(ra) === 2 ? ra - rb : 0)
  })

  return (
    <>
      <fieldset className={styles.checklist}>
        <legend className='sr-only'>Tasks in {name}</legend>
        {ordered.length === 0 ? (
          <p className={styles.noOpen}>No open tasks yet.</p>
        ) : (
          <ul className={styles.rows}>
            {ordered.map(t => {
              const p = planned(t.id)
              return (
                <AssignRow
                  key={t.id}
                  task={t}
                  blockId={blockId}
                  blockName={name}
                  elsewhere={p && p.blockId !== blockId ? p.number : null}
                  draggable={draggable}
                  onAssign={assignTask}
                />
              )
            })}
          </ul>
        )}
      </fieldset>
      <AddRow
        empty={false}
        label={`Add a task to ${name}`}
        onAdd={text => addToBlock(text, blockId)}
      />
    </>
  )
}

function PlanLoadError() {
  const store = useTasksStoreApi()
  const [busy, setBusy] = useState(false)
  if (busy) return <Skeleton rows={3} height={60} gap={16} />
  return (
    <div className={styles.loadError} role='alert'>
      <span>Couldn't load your plan.</span>
      <button
        type='button'
        className={styles.retry}
        onClick={async () => {
          setBusy(true)
          try {
            const res = await api.user.plan.$get()
            if (!res.ok) return
            const data = await res.json()
            store.getState().hydratePlan(
              data.plan
                ? {
                    sessionId: data.plan.sessionId,
                    blocks: data.plan.blocks,
                    wentLive: data.plan.wentLive,
                  }
                : null,
              data.links.map(l => ({ ...l, taskId: String(l.taskId) })),
            )
          } catch {
            // stays on the error row
          } finally {
            setBusy(false)
          }
        }}
      >
        Try again
      </button>
    </div>
  )
}

const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
const minutesOf = (seconds: number) => Math.round(seconds / 60)

// "25 min" or "25 + 5 min"
const lengthText = (b: LiveBlock) =>
  b.addedSeconds > 0
    ? `${minutesOf(b.plannedSeconds)} + ${minutesOf(b.addedSeconds)} min`
    : formatDuration(minutesOf(b.plannedSeconds))

// Done rows: a static tick per task (untick from the List tab).
function StaticTick({ done }: { done: boolean }) {
  return (
    <span className={styles.tick} data-done={done || undefined}>
      {done && <Check aria-hidden='true' />}
      <span className='sr-only'>{done ? 'done' : 'not done'}</span>
    </span>
  )
}

// Current block: every assigned task is a completion row (checked = completed).
function CompletionRow({ task, draggable }: { task: Task; draggable: boolean }) {
  const { completeTask } = useTaskActions()
  return (
    <li
      className={cn(styles.row, styles.liveRow, task.completed && styles.done)}
      draggable={draggable || undefined}
      onDragStart={
        draggable
          ? e => {
              e.dataTransfer.setData(DRAG_TYPE, task.id)
              e.dataTransfer.effectAllowed = 'move'
            }
          : undefined
      }
    >
      {draggable && <GripVertical className={styles.grip} aria-hidden='true' />}
      <Checkbox
        className={styles.box}
        checked={task.completed}
        aria-label={task.text}
        onCheckedChange={checked => completeTask(task.id, checked === true)}
      >
        <Check aria-hidden='true' />
      </Checkbox>
      <span className={styles.text}>{task.text}</span>
    </li>
  )
}

export default function PlanTab() {
  const plan = useTasksStore(s => s.plan)
  const planLoad = useTasksStore(s => s.planLoad)
  const { addFocus, removeFocus, nudge, assignTask } = usePlanActions()
  const reduced = useReducedMotion()
  const view = useSessionView()
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const fine = useMediaQuery('(pointer: fine)')
  const tasks = useTasksStore(s => s.tasks)
  const links = useTasksStore(s => s.links)

  if (planLoad === 'error') return <PlanLoadError />
  if (!plan || !view) return <Skeleton rows={3} height={60} gap={16} />

  const blocks = plan.blocks
  const live = view.state === 'live'
  const { summary } = view
  const focus = blocks.filter(b => b.kind === 'focus')
  // Planning: the picked block, else Block 1. Live: only an ahead block can be selected.
  const pickable = (id: string | null) =>
    view.blocks.find(b => b.id === id && b.kind === 'focus' && b.state === 'ahead')?.id
  const selectedId = pickable(pickedId) ?? (live ? undefined : focus[0]?.id)
  const atLimit = focus.length >= PLAN_LIMITS.maxFocus
  const taskOf = (id: string) => tasks.find(t => t.id === id)

  const hasTask = (e: DragEvent) => e.dataTransfer.types.includes(DRAG_TYPE)
  const dropProps = (blockId: string) =>
    fine
      ? {
          onDragEnter: (e: DragEvent) => hasTask(e) && setOverId(blockId),
          onDragOver: (e: DragEvent) => {
            if (!hasTask(e)) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          },
          onDragLeave: (e: DragEvent<HTMLElement>) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverId(null)
          },
          onDrop: (e: DragEvent) => {
            setOverId(null)
            if (!hasTask(e)) return
            e.preventDefault()
            // only ids of tasks we know are honoured; foreign drag data is ignored
            const id = e.dataTransfer.getData(DRAG_TYPE)
            if (tasks.some(t => t.id === id && !t.archived)) assignTask(id, blockId)
          },
        }
      : {}

  return (
    <div className={styles.plan}>
      <div className={records.sec}>
        <span>
          {live
            ? `Focus ${minutesOf(summary.focusElapsedSeconds)} min · ${summary.doneTasks}/${summary.plannedTasks} tasks${
                summary.addedTotal > 0 ? ` · +${minutesOf(summary.addedTotal)} min` : ''
              }`
            : planSummary(blocks)}
        </span>
        <em>Ends {formatClock(summary.endsAt)}</em>
      </div>
      <fieldset className={styles.column}>
        <legend className='sr-only'>Blocks</legend>
        {view.blocks.map(vb => {
          const block = blocks.find(b => b.id === vb.id)
          if (!block) return null
          const lengthSeconds =
            vb.state === 'done' ? vb.actualSeconds : vb.plannedSeconds + vb.addedSeconds
          const height = (lengthSeconds / 60) * PX_PER_MINUTE
          if (vb.kind === 'break') {
            const current = vb.state === 'current'
            return (
              <div
                key={vb.id}
                className={styles.breakCell}
                data-state={vb.state}
                style={{ height: Math.max(16, height) }}
              >
                <span className={styles.gutter} aria-hidden='true' />
                <span className={styles.breakRow} data-current={current || undefined}>
                  {current
                    ? `Break · ${mmss(Math.max(0, vb.plannedSeconds + vb.addedSeconds - vb.elapsedSeconds))} left`
                    : `Break · ${formatDuration(minutesOf(vb.plannedSeconds))}`}
                </span>
              </div>
            )
          }
          const name = `Block ${vb.focusNumber}`
          const isSelected = vb.id === selectedId
          const taskList = vb.taskIds.flatMap(id => taskOf(id) ?? [])
          const names = taskList.map(t => t.text)
          const count = `${names.length === 0 ? 'no' : names.length} ${names.length === 1 ? 'task' : 'tasks'}`
          const span = vb.plannedSeconds + vb.addedSeconds
          const meta =
            vb.state === 'ahead'
              ? formatRange(vb.start, vb.end)
              : vb.state === 'done'
                ? lengthText(vb)
                : `${mmss(vb.elapsedSeconds)} of ${
                    vb.addedSeconds > 0 ? lengthText(vb) : formatDuration(minutesOf(span))
                  }${vb.paused ? ' · paused' : ''}`
          const hatch =
            vb.addedSeconds > 0 ? (
              <span
                className={styles.hatch}
                data-done={vb.state === 'done' || undefined}
                style={{ height: (vb.addedSeconds / 60) * PX_PER_MINUTE }}
                aria-hidden='true'
              />
            ) : null
          const cell = (children: React.ReactNode, droppable: boolean) => (
            <div key={vb.id} className={styles.focusCell}>
              <span className={styles.gutter} aria-hidden='true'>
                {formatClock(vb.start)}
              </span>
              <div
                className={styles.focus}
                data-state={vb.state}
                data-selected={isSelected || undefined}
                data-over={overId === vb.id || undefined}
                style={{ minHeight: Math.max(44, height) }}
                {...(droppable ? dropProps(vb.id) : {})}
              >
                {children}
                {hatch}
              </div>
            </div>
          )

          if (vb.state === 'done') {
            return cell(
              <>
                <span className={styles.focusHead}>
                  <span className={styles.focusTitle}>
                    <Check className={styles.doneCheck} aria-hidden='true' />
                    {name}
                  </span>
                  <span className={styles.meta}>{meta}</span>
                </span>
                {taskList.length === 0 ? (
                  <span className={styles.noTasks}>No tasks</span>
                ) : (
                  <ul className={styles.rows}>
                    {taskList.map(t => (
                      <li key={t.id} className={cn(styles.row, styles.doneTask)}>
                        <StaticTick
                          done={links.some(
                            l => l.taskId === t.id && l.blockId === vb.id && l.completed,
                          )}
                        />
                        <span className={styles.text}>{t.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>,
              false,
            )
          }

          if (vb.state === 'current') {
            return cell(
              <>
                <span className={styles.focusHead}>
                  <span className={styles.focusTitle}>{name} · now</span>
                  <span className={styles.meta}>{meta}</span>
                </span>
                <span className={styles.bar} aria-hidden='true'>
                  <span
                    className={styles.barFill}
                    style={{ transform: `scaleX(${Math.min(1, vb.elapsedSeconds / span)})` }}
                  />
                </span>
                {taskList.length === 0 ? (
                  <span className={styles.noTasks}>No tasks</span>
                ) : (
                  <ul className={styles.rows}>
                    {taskList.map(t => (
                      <CompletionRow key={t.id} task={t} draggable={fine} />
                    ))}
                  </ul>
                )}
                {overId === vb.id && <span className={styles.drop}>Drop here</span>}
              </>,
              true,
            )
          }

          const nameText = `${name}, ${formatClock(vb.start)} to ${formatClock(vb.end)}, ${block.minutes} minutes, ${count}`
          return cell(
            <>
              <label className={styles.focusLabel}>
                <input
                  type='radio'
                  name='plan-block'
                  className={styles.radio}
                  checked={isSelected}
                  onChange={() => setPickedId(vb.id)}
                />
                <span className={styles.focusHead}>
                  <span className={styles.focusTitle} aria-hidden='true'>
                    {name}
                  </span>
                  <span className={styles.meta} aria-hidden='true'>
                    {meta}
                  </span>
                </span>
                <span className='sr-only'>{nameText}</span>
                <span className={styles.namesLine} aria-hidden='true'>
                  <span className={names.length === 0 ? styles.noTasks : styles.names}>
                    {names.length === 0 ? 'No tasks' : names.join(' · ')}
                  </span>
                  {overId === vb.id && <span className={styles.drop}>Drop here</span>}
                </span>
              </label>
              <AnimatePresence initial={false}>
                {isSelected && (
                  <motion.div
                    className={styles.assign}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.25, ease: EASE }}
                  >
                    <div className={styles.assignInner}>
                      <div className={styles.length}>
                        <span>Length</span>
                        <button
                          type='button'
                          className={styles.nudge}
                          aria-label={`Shorten ${name}`}
                          disabled={block.minutes <= PLAN_LIMITS.minMinutes}
                          onClick={() => nudge(vb.id, -PLAN_LIMITS.step)}
                        >
                          <Minus aria-hidden='true' />
                        </button>
                        <output className={styles.value} aria-live='polite'>
                          {block.minutes} min
                        </output>
                        <button
                          type='button'
                          className={styles.nudge}
                          aria-label={`Lengthen ${name}`}
                          disabled={block.minutes >= PLAN_LIMITS.maxMinutes}
                          onClick={() => nudge(vb.id, PLAN_LIMITS.step)}
                        >
                          <Plus aria-hidden='true' />
                        </button>
                      </div>
                      <AssignList blockId={vb.id} name={name} draggable={fine} />
                      <div className={styles.assignFoot}>
                        <button
                          type='button'
                          className={styles.remove}
                          disabled={focus.length <= 1}
                          onClick={() => removeFocus(vb.id)}
                        >
                          Remove block
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>,
            true,
          )
        })}
        <div className={styles.focusCell}>
          <span className={styles.gutter} aria-hidden='true'>
            {formatClock(summary.endsAt)}
          </span>
        </div>
      </fieldset>
      {!live && (
        <>
          <button
            type='button'
            className={cn(styles.add, styles.addBlock)}
            disabled={atLimit}
            aria-describedby={atLimit ? 'plan-limit' : undefined}
            onClick={addFocus}
          >
            <Plus aria-hidden='true' />
            Add focus block
          </button>
          {atLimit && (
            <p id='plan-limit' className={styles.note}>
              16 blocks is the limit for one session.
            </p>
          )}
          <p className={styles.note}>
            Changes here apply to this session only.
            {fine && (
              <>
                <br />
                Drag a task onto a block to move it.
              </>
            )}
          </p>
        </>
      )}
    </div>
  )
}
