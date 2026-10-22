// Pure export text for a session summary (UI-SPEC section 7). Only user text is escaped.
import type { FocusRating, TaskFate } from '@repo/types/logs'
import type { Format, Summary } from './summary'

const RATING: Record<FocusRating, string> = { scattered: 'Scattered', okay: 'Okay', deep: 'Deep' }
const FATE: Record<TaskFate, string> = { next: 'next session', later: 'later', drop: 'dropped' }

/** Backslash-escapes the Markdown characters that could turn user text into markup. */
export const escapeMd = (text: string) => text.replace(/[\\`*_[\]<>#|]/g, '\\$&')

const oneLine = (text: string) => text.replace(/\s*[\r\n]+\s*/g, ' ').trim()

function render(s: Summary, fmt: Format, md: boolean): string {
  const esc = md ? escapeMd : (t: string) => t
  const line = (t: string) => esc(oneLine(t))
  const multi = (t: string, indent: string) =>
    t
      .split(/\r?\n/)
      .map(l => (l ? indent + esc(l) : ''))
      .join('\n')
  const h1 = (t: string) => (md ? `# ${t}` : t)
  const h2 = (t: string) => (md ? `## ${t}` : t)
  const box = (done: boolean) => (md ? `- [${done ? 'x' : ' '}] ` : '- ')

  const { stats } = s
  const meta = [
    fmt.range(s.start, s.end),
    `${fmt.compact(s.focusSeconds)} focused`,
    `${stats.blocksDone} of ${stats.blocksTotal} blocks`,
    stats.skipped > 0 && `${stats.skipped} skipped`,
    stats.addedSeconds > 0 && `${fmt.added(stats.addedSeconds)} added`,
  ].filter(Boolean)

  const sections: string[] = [
    `${h1(`Focus session · ${fmt.dayWithYear(s.start)}`)}\n${meta.join(' · ')}`,
  ]
  const add = (title: string, rows: string[]) => {
    if (rows.length) sections.push(`${h2(title)}\n${rows.join('\n')}`)
  }

  add('Done', [
    ...s.done.map(d => box(true) + line(d.text)),
    ...s.extraDone.map(t => box(true) + line(t)),
  ])
  add(
    'Not done',
    s.notDone.map(n => `${box(false)}${line(n.text)} (${FATE[n.fate]})`),
  )
  add(
    'Later',
    s.later.map(l => `- ${line(l.text)}`),
  )
  add(
    'Blocks',
    s.blocks
      .filter(b => b.kind === 'focus')
      .map(b => {
        const head = [
          fmt.range(b.start, b.end),
          ...b.tasks.map(t => line(t.text)),
          b.addedSeconds > 0 && fmt.added(b.addedSeconds),
          b.outcome === 'skipped' && 'skipped',
          b.log?.rating && RATING[b.log.rating],
        ].filter(Boolean)
        const text = b.log?.text.trim()
        return `${b.focusNumber}. ${head.join(' · ')}${text ? `\n${multi(text, '   ')}` : ''}`
      }),
  )
  const next = s.nextTime.trim()
  if (next) sections.push(`${h2('Next time')}\n${multi(next, '')}`)
  return sections.join('\n\n')
}

export const toMarkdown = (s: Summary, fmt: Format) => render(s, fmt, true)
export const toText = (s: Summary, fmt: Format) => render(s, fmt, false)

/** Built only from the digits of the start time, never from user text. */
export const exportFileName = (start: number, ext: 'md' | 'txt', fmt: Format) =>
  `befocus-${fmt.stamp(start)}.${ext}`
