'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useHistory } from '~/hooks/useLogs'
import { groupSessions, sessionDigest, splitSessions } from '~/lib/logs/history'
import { makeFormat } from '~/lib/logs/summary'
import { HistoryList } from './HistoryList'
import { ImprovePanel } from './ImprovePanel'
import styles from './log.module.css'

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

  const loading = status === 'loading' || now === null
  const empty = !loading && status === 'ready' && sessions.length === 0

  return (
    <main className={styles.page} data-log-page aria-busy={loading || undefined}>
      <div className={styles.top}>
        <button
          type='button'
          className={styles.back}
          aria-label='Back to timer'
          onClick={() => router.push(home)}
        >
          <ChevronLeft aria-hidden size={16} />
          <span className={styles.backLabel}>Timer</span>
        </button>
        <h1 className={styles.title}>Log</h1>
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
          <div className={styles.listCol}>
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
                  onSelect={setPicked}
                  hasOlder={hasOlder}
                  onOlder={fetchOlder}
                />
              </>
            )}
            {mode === 'guest' && <p className={styles.footnote}>{GUEST_NOTE}</p>}
          </div>
        </div>
      )}
    </main>
  )
}
