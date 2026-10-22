// Pure "now task" rules for the current focus block. No React or DOM here.
import type { TaskLink } from '@repo/types/plan'
import type { Task } from '@repo/types/tasks'

type OpenTask = Pick<Task, 'id' | 'completed' | 'archived'>

const isOpen = (tasks: OpenTask[], id: string) =>
  tasks.some(t => t.id === id && !t.completed && !t.archived)

/** Open tasks planned in the block, in the order the block row lists them (store link order). */
export const openInBlock = (links: TaskLink[], tasks: OpenTask[], blockId: string): string[] => [
  ...new Set(
    links
      .filter(l => l.planned && l.blockId === blockId && isOpen(tasks, l.taskId))
      .map(l => l.taskId),
  ),
]

/** The open task worked on last (latest workedAt), else the first in block order, else null. */
export function deriveNow(links: TaskLink[], tasks: OpenTask[], blockId: string): string | null {
  const ids = openInBlock(links, tasks, blockId)
  let best: string | null = null
  let bestAt = ''
  for (const id of ids) {
    const at = links.find(l => l.taskId === id && l.blockId === blockId)?.workedAt ?? ''
    if (at > bestAt) {
      best = id
      bestAt = at
    }
  }
  return best ?? ids[0] ?? null
}

/** After `doneTaskId` is completed: the next open task in block order after it, wrapping, else null. */
export function nextNowAfterDone(
  links: TaskLink[],
  tasks: OpenTask[],
  blockId: string,
  doneTaskId: string,
): string | null {
  const all = openInBlock(
    links,
    tasks.map(t => (t.id === doneTaskId ? { ...t, completed: true } : t)),
    blockId,
  )
  // position the done task held, from the unfiltered order
  const order = [
    ...new Set(links.filter(l => l.planned && l.blockId === blockId).map(l => l.taskId)),
  ]
  const from = order.indexOf(doneTaskId)
  const after = [...order.slice(from + 1), ...order.slice(0, Math.max(from, 0))]
  return after.find(id => all.includes(id)) ?? null
}

/** Tasks a block's links record as worked on and as completed (completed ones only under completed). */
export function blockRecordTasks(links: TaskLink[], tasks: Task[], blockId: string) {
  const worked: Task[] = []
  const completed: Task[] = []
  const seen = new Set<string>()
  for (const l of links) {
    if (l.blockId !== blockId || seen.has(l.taskId) || !(l.worked || l.completed)) continue
    const task = tasks.find(t => t.id === l.taskId)
    if (!task) continue
    seen.add(l.taskId)
    ;(l.completed ? completed : worked).push(task)
  }
  return { worked, completed }
}
