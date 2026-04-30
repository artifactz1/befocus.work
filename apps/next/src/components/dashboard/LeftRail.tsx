'use client'

import AccountButton from '~/components/AccountButton'
import CustomizeRailButton from '~/components/customize/CustomizeRailButton'
import { SessionSettings } from '~/components/settings/SessionSettings'
import SoundSettings from '~/components/settings/SoundSettings'
import ToDoList from '~/components/to-do-list/ToDoList'

/**
 * Desktop-only vertical glass rail at the left edge of the viewport.
 * Hosts all peripheral tools (todo, sounds, sessions, account, customize).
 */
export default function LeftRail() {
  return (
    <aside
      className='fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-border/40 bg-card/50 px-1.5 py-2.5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-md sm:flex md:left-6'
      aria-label='Tools'
    >
      <ToDoList />
      <SoundSettings />
      <SessionSettings />
      <CustomizeRailButton />
      <AccountButton />
    </aside>
  )
}
