'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useHistory } from '~/hooks/useLogs'
import { useSummaryModel } from '~/hooks/useSummary'
import {
  groupSessions,
  type HistorySession,
  sessionDigest,
  splitSessions,
} from '~/lib/logs/history'
import { makeFormat } from '~/lib/logs/summary'
import { ExportMenu } from './ExportMenu'
import { HistoryList } from './HistoryList'
import { ImprovePanel } from './ImprovePanel'
import styles from './log.module.css'
import { SessionSummary } from './SessionSummary'

const GUEST_NOTE = 'Saved in this browser. Sign in to keep your log on every device.'

function Loading() {
  return (
    <div className={styles.skeletons}>
      <div className={styles.skeleton} style={{ height: 160 }} />
      {[0, 1, 2, 3].map(i => (
        <div key={i} className={styles.skeleton} style={{ height: 72 }} />
      ))}
    </div>
  )
}

// Past session: fates stay read-only (no fate handler), logs and Next time stay editable.
function Detail({ mode, session }: { mode: 'account' | 'guest'; session: HistorySession }) {
  const { summary, handlers } = useSummaryModel({
    mode,
    store: null,
    input: { ...session, tasks: [], live: false },
  })
  return (
    <SessionSummary
      summary={summary}
      live={false}
      handlers={handlers}
      actions={<ExportMenu summary={summary} />}
      phoneActions={<ExportMenu summary={summary} className='col-span-full w-full' />}
    />
  )
}

export function LogPage({ mode }: { mode: 'account' | 'guest' }) {
  const router = useRouter()
  const home = mode === 'account' ? '/' : '/guest'
  const { history, status, refetch, fetchOlder, hasOlder } = useHistory(mode, null)
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => setNow(Date.now()), [])

  const fmt = useMemo(() => makeFormat(), [])
  const sessions = useMemo(() => splitSessions(history), [history])
  const groups = useMemo(
    () =>
      now === null
        ? []
        : groupSessions(
            sessions.map(s => sessionDigest(s, fmt)),
            now,
            fmt,
          ),
    [sessions, now, fmt],
  )
  const [picked, setPicked] = useState<string | null>(null)
  const selectedId = picked ?? groups[0]?.sessions[0]?.sessionId ?? null

  const selected = sessions.find(x => x.sessionId === selectedId) ?? null
  const selectedDigest = groups.flatMap(g => g.sessions).find(d => d.sessionId === selectedId)

  // Phone only: list or detail. CSS decides whether it matters, so SSR and client agree.
  const [view, setView] = useState<'list' | 'detail'>('list')
  const listRef = useRef<HTMLDivElement>(null)
  const detailTitle = useRef<HTMLHeadingElement>(null)
  const listScroll = useRef(0)
  const opened = useRef<string | null>(null)

  const open = (id: string) => {
    listScroll.current = listRef.current?.scrollTop ?? 0
    opened.current = id
    setPicked(id)
    setView('detail')
  }
  const backToList = () => setView('list')

  useEffect(() => {
    if (view === 'detail') {
      detailTitle.current?.focus({ preventScroll: true })
    } else if (opened.current) {
      if (listRef.current) listRef.current.scrollTop = listScroll.current
      document
        .querySelector<HTMLElement>(`[data-session-row="${opened.current}"]`)
        ?.focus({ preventScroll: true })
    }
  }, [view])

  const loading = status === 'loading' || now === null
  const empty = !loading && status === 'ready' && sessions.length === 0

  return (
    <main className={styles.page} data-log-page data-view={view} aria-busy={loading || undefined}>
      <div className={styles.top}>
        <button
          type='button'
          className={`${styles.back} ${styles.backTimer}`}
          aria-label='Back to timer'
          onClick={() => router.push(home)}
        >
          <ChevronLeft aria-hidden size={16} />
          <span className={styles.backLabel}>Timer</span>
        </button>
        <h1 className={styles.title}>Log</h1>
        <div className={styles.topDetail}>
          <button
            type='button'
            className={styles.back}
            aria-label='Back to log'
            onClick={backToList}
          >
            <ChevronLeft aria-hidden size={16} />
          </button>
          <h2 ref={detailTitle} tabIndex={-1} className={styles.detailTitle}>
            {selectedDigest && now !== null ? fmt.day(selectedDigest.start, now) : ''}
          </h2>
        </div>
        {mode === 'guest' && (
          <p className={styles.guestTop}>
            Saved in this browser ·{' '}
            <Link href='/sign-in' className={styles.link}>
              Sign in
            </Link>
          </p>
        )}
      </div>
      {empty ? (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>No sessions yet</h2>
          <p className={styles.emptyBody}>
            Finish a focus session and it shows up here with what you got done.
          </p>
          <Link href={home} className={styles.primary}>
            Start a session
          </Link>
        </div>
      ) : (
        <div className={styles.body}>
          <div ref={listRef} className={styles.listCol}>
            {status === 'error' && (
              <div className={styles.error} role='alert'>
                <span>Couldn't load your log.</span>
                <button type='button' className={styles.ghost} onClick={() => refetch()}>
                  Try again
                </button>
              </div>
            )}
            {loading ? (
              status !== 'error' && <Loading />
            ) : (
              <>
                {sessions.length > 0 && <ImprovePanel sessions={sessions} now={now} />}
                <HistoryList
                  groups={groups}
                  selectedId={selectedId}
                  onSelect={open}
                  hasOlder={hasOlder}
                  onOlder={fetchOlder}
                />
              </>
            )}
            {mode === 'guest' && <p className={styles.footnote}>{GUEST_NOTE}</p>}
          </div>
          <div className={styles.detailCol}>
            {selected && (
              <div className={styles.panel} key={selected.sessionId}>
                <Detail mode={mode} session={selected} />
              </div>
            )}
          </div>
          <p className='sr-only' role='status'>
            {selectedDigest ? `Showing session ended ${selectedDigest.endClock}` : ''}
          </p>
        </div>
      )}
    </main>
  )
}
