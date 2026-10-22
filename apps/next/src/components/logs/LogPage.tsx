'use client'

export function LogPage({ mode }: { mode: 'account' | 'guest' }) {
  return <main data-log-page data-mode={mode} />
}
