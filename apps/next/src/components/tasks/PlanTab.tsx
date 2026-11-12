'use client'

import { PLAN_LIMITS } from '@repo/types/plan'
import type { Task } from '@repo/types/tasks'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, GripVertical, Minus, Plus, X } from 'lucide-react'
import { type DragEvent, useRef, useState } from 'react'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { useNow, usePlanActions, useSessionView } from '~/hooks/usePlan'
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
import BlockTasks from './BlockTasks'
import { AddRow, Skeleton } from './ListTab'
import styles from './tasks.module.css'

const EASE = [0.2, 0.7, 0.2, 1] as const
const PX_PER_MINUTE = 2.4
const DRAG_TYPE = 'application/x-befocus-task'

// Where an open task sits relative to the selected block: in it, unplanned, or in another block (its number).
type Where = 'here' | 'free' | number

const dragProps = (taskId: string, draggable: boolean) =>
  draggable
    ? {
        draggable: true,
        onDragStart: (e: DragEvent) => {
          e.dataTransfer.setData(DRAG_TYPE, taskId)
          e.dataTransfer.effectAllowed = 'move'
        },
      }
    : {}

// In this block: an accent mark (not a check, which reads as done) and an explicit remove button.
// Elsewhere: the whole row is one "Add" or "Move here" button.
function AssignRow({
  task,
  where,
  blockId,
  blockName,
  draggable,
  onAssign,
}: {
  task: Task
  where: Where
  blockId: string
  blockName: string
  draggable: boolean
  onAssign: (taskId: string, blockId: string | null) => void
}) {
  const grip = draggable && <GripVertical className={styles.grip} aria-hidden='true' />
  if (where === 'here') {
    return (
      <li className={cn(styles.row, styles.assignRow)} data-here {...dragProps(task.id, draggable)}>
        {grip}
        <span className={styles.inMark} aria-hidden='true' />
        <span className={styles.text}>{task.text}</span>
        <button
          type='button'
          className={styles.unassign}
          aria-label={`Remove ${task.text} from ${blockName}`}
          onClick={() => onAssign(task.id, null)}
        >
          <X aria-hidden='true' />
        </button>
      </li>
    )
  }
  const other = typeof where === 'number'
  return (
    <li className={styles.assignItem} {...dragProps(task.id, draggable)}>
      <button
        type='button'
        className={styles.assignBtn}
        aria-label={
          other
            ? `Move ${task.text} from Block ${where} to ${blockName}`
            : `Add ${task.text} to ${blockName}`
        }
        onClick={() => onAssign(task.id, blockId)}
      >
        {grip}
        <span className={cn(styles.text, styles.assignText)}>{task.text}</span>
        {other && (
          <span className={styles.chip} aria-hidden='true'>
            B{where}
          </span>
        )}
        <span className={styles.assignAct} aria-hidden='true'>
          {other ? 'Move here' : 'Add'}
        </span>
      </button>
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
  const whereOf = (taskId: string): Where => {
    const link = links.find(l => l.taskId === taskId && l.planned)
    if (link?.blockId === blockId) return 'here'
    const i = link ? focusIds.indexOf(link.blockId) : -1
    return i < 0 ? 'free' : i + 1
  }
  const open = tasks
    .filter(t => !t.archived && !t.completed)
    .map(task => ({ task, where: whereOf(task.id) }))
  const here = open.filter(o => o.where === 'here')
  // unplanned first, then tasks in other blocks by block number (sort is stable)
  const rest = open
    .filter(o => o.where !== 'here')
    .sort((a, b) => (a.where === 'free' ? 0 : +a.where) - (b.where === 'free' ? 0 : +b.where))
  const row = ({ task, where }: { task: Task; where: Where }) => (
    <AssignRow
      key={task.id}
      task={task}
      where={where}
      blockId={blockId}
      blockName={name}
      draggable={draggable}
      onAssign={assignTask}
    />
  )

  return (
    <>
      <section className={styles.assignGroup} aria-label={`In ${name}`}>
        <h4 className={styles.assignSec}>
          In {name}
          <span>{here.length}</span>
        </h4>
        {here.length === 0 ? (
          <p className={styles.noOpen}>
            {rest.length > 0 ? 'Nothing yet. Add tasks from below.' : 'Nothing yet.'}
          </p>
        ) : (
          <ul className={styles.rows}>{here.map(row)}</ul>
        )}
      </section>
      {rest.length > 0 && (
        <section className={styles.assignGroup} aria-label='Your tasks'>
          <h4 className={styles.assignSec}>Your tasks</h4>
          <ul className={styles.rows}>{rest.map(row)}</ul>
        </section>
      )}
      <AddRow
        empty={false}
        label={`Add a new task to ${name}`}
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

// Current block: every assigned task is a completion row (checked = completed).
function CompletionRow({
  task,
  draggable,
  isNow,
}: {
  task: Task
  draggable: boolean
  isNow: boolean
}) {
  const { completeTask } = useTaskActions()
  const { setNow } = usePlanActions()
  return (
    <li
      className={cn(
        styles.row,
        styles.liveRow,
        task.completed && styles.done,
        isNow && styles.nowRow,
      )}
      {...dragProps(task.id, draggable)}
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
      {!task.completed &&
        (isNow ? (
          <span className={styles.nowTagRow}>Now</span>
        ) : (
          <button
            type='button'
            className={styles.setNow}
            aria-label={`Set ${task.text} as now`}
            onClick={() => void setNow(task.id)}
          >
            Set now
          </button>
        ))}
    </li>
  )
}

function BlockNav({
  ahead,
  currentId,
  onGo,
}: {
  ahead: { id: string; focusNumber: number | null }[]
  currentId: string
  onGo: (id: string) => void
}) {
  const i = ahead.findIndex(b => b.id === currentId)
  const prev = ahead[i - 1]
  const next = ahead[i + 1]
  if (!prev && !next) return null
  return (
    <nav className={styles.blockNav} aria-label='Blocks'>
      {prev && (
        <button
          type='button'
          className={styles.navBtn}
          aria-label={`Go to Block ${prev.focusNumber}`}
          onClick={() => onGo(prev.id)}
        >
          <ChevronLeft aria-hidden='true' />
        </button>
      )}
      {next && (
        <button
          type='button'
          className={cn(styles.navBtn, styles.navNext)}
          aria-label={`Go to Block ${next.focusNumber}`}
          onClick={() => onGo(next.id)}
        >
          Block {next.focusNumber}
          <ChevronRight aria-hidden='true' />
        </button>
      )}
    </nav>
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
  const assignRef = useRef<HTMLDivElement>(null)
  const fine = useMediaQuery('(pointer: fine)')
  const tasks = useTasksStore(s => s.tasks)
  const nowId = useNow().task?.id

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
  // Prev / next step through the blocks that can still be planned.
  const ahead = view.blocks.filter(b => b.kind === 'focus' && b.state === 'ahead')
  const goTo = (id: string) => {
    setPickedId(id)
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLInputElement>(`input[name="plan-block"][value="${id}"]`)
        ?.focus({ preventScroll: true }),
    )
  }
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
                <BlockTasks blockId={vb.id} />
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
                      <CompletionRow key={t.id} task={t} draggable={fine} isNow={t.id === nowId} />
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
                  value={vb.id}
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
                    ref={assignRef}
                    className={styles.assign}
                    onAnimationComplete={() =>
                      assignRef.current?.parentElement?.scrollIntoView({
                        block: 'nearest',
                        behavior: reduced ? 'auto' : 'smooth',
                      })
                    }
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
                        <BlockNav ahead={ahead} currentId={vb.id} onGo={goTo} />
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
