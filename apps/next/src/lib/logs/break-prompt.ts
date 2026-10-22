import type { Run } from '../blocks/blocks'

/** Pure: is a break log prompt due for this transition? Once per break id (caller tracks `prompted`). */
export function breakPromptFor(
  prev: Run,
  next: Run,
  prompted: ReadonlySet<string>,
  ask: boolean,
): { breakId: string; focusId: string } | null {
  if (!ask || next.status !== 'running') return null
  const i = next.blocks.findIndex(b => b.id === next.currentBlockId)
  const brk = next.blocks[i]
  const focus = next.blocks[i - 1]
  if (brk?.kind !== 'break' || focus?.kind !== 'focus' || focus.endedAt === null) return null
  if (prompted.has(brk.id)) return null
  if (prev.currentBlockId === brk.id && prev.status === 'paused') return null
  return { breakId: brk.id, focusId: focus.id }
}
