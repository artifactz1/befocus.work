// Shared fixture for summary.check.ts and export.check.ts: the UI-SPEC section 7 (#mdtext) session.
import type { BlockRecord } from '@repo/types/blocks'
import type { BlockLog, HistoryLink, SessionNote } from '@repo/types/logs'
import type { Task } from '@repo/types/tasks'
import type { SummaryInput } from './summary'

export const SID = '11111111-1111-4111-8111-111111111111'
const at = (h: number, m: number) => Date.UTC(2026, 9, 21, h, m)

function rec(
  id: string,
  kind: BlockRecord['kind'],
  index: number,
  start: number,
  end: number,
  planned: number,
  actual: number,
  added: number,
  outcome: BlockRecord['outcome'],
): BlockRecord {
  return {
    id,
    sessionId: SID,
    kind,
    index,
    plannedSeconds: planned,
    actualSeconds: actual,
    addedSeconds: added,
    startedAt: start,
    endedAt: end,
    outcome,
  }
}

const link = (blockId: string, taskId: string, text: string, completed: boolean): HistoryLink => ({
  blockId,
  taskId,
  text,
  planned: true,
  worked: completed,
  completed,
  completedAt: completed ? '2026-10-21T09:20:00.000Z' : null,
})

const log = (blockId: string, text: string, rating: BlockLog['rating']): BlockLog => ({
  blockId,
  sessionId: SID,
  text,
  rating,
})

export function mdFixture(): SummaryInput {
  const tasks: Task[] = [
    { id: 't1', text: 'Write notes', completed: true, archived: false },
    { id: 't2', text: 'Review PR', completed: true, archived: false },
    { id: 't3', text: 'Reply to Alex', completed: true, archived: false },
    { id: 't4', text: 'Fix flaky timer test', completed: false, archived: false },
    { id: 't5', text: 'Draft Phase 10 board', completed: false, archived: false },
    {
      id: 't6',
      text: 'Update README',
      completed: false,
      archived: false,
      later: true,
      laterAt: '2026-10-19T10:00:00.000Z',
    },
  ]
  const note: SessionNote = {
    sessionId: SID,
    nextTime: 'Silence Slack before the third block.',
    extraDone: [],
    carried: [{ taskId: 't4', text: 'Fix flaky timer test', fate: 'later' }],
  }
  return {
    sessionId: SID,
    records: [
      rec('b1', 'focus', 0, at(9, 0), at(9, 30), 1500, 1800, 300, 'finished'),
      rec('k1', 'break', 1, at(9, 30), at(9, 35), 300, 300, 0, 'finished'),
      rec('b2', 'focus', 2, at(9, 35), at(10, 0), 1500, 1500, 0, 'finished'),
      rec('k2', 'break', 3, at(10, 0), at(10, 2), 300, 120, 0, 'skipped'),
      rec('b3', 'focus', 4, at(10, 2), at(10, 14), 1500, 720, 0, 'skipped'),
      rec('k3', 'break', 5, at(10, 14), at(10, 19), 300, 300, 0, 'finished'),
      rec('b4', 'focus', 6, at(10, 19), at(10, 44), 1500, 1500, 0, 'finished'),
    ],
    links: [
      link('b1', 't1', 'Write notes', true),
      link('b2', 't2', 'Review PR', true),
      link('b2', 't3', 'Reply to Alex', true),
      link('b3', 't4', 'Fix flaky timer test', false),
      link('b4', 't5', 'Draft Phase 10 board', false),
    ],
    logs: [
      log('b1', 'Outline done, intro drafted.', 'deep'),
      log(
        'b2',
        'Reviewed the Phase 9 PR, left 3 comments. Answered Alex about the release.',
        'okay',
      ),
      log('b3', 'Could not reproduce it, got pulled into Slack.', 'scattered'),
      log('b4', 'Mocks half done, export section left.', 'deep'),
    ],
    note,
    tasks,
    live: true,
  }
}

export function must<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('fixture value missing')
  return value
}
