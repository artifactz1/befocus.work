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
    <div
      role='toolbar'
      aria-label='Tools'
      aria-orientation='vertical'
      // Ghost-icon-only override: descendants render as 36px square ghost buttons
      // regardless of their internal variant prop, so the rail reads as a unified
      // pill rather than a column of outline rectangles.
      className='[&_button]:h-11 [&_button]:w-11 [&_button]:rounded-full [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-muted-foreground [&_button]:shadow-none [&_button]:transition-colors [&_button:hover]:bg-foreground/10 [&_button:hover]:text-foreground [&_svg]:h-5 [&_svg]:w-5 fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-1 rounded-full border border-border/40 bg-card/60 p-2 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:flex md:left-6'
    >
      <ToDoList />
      <SoundSettings />
      <SessionSettings />
      <CustomizeRailButton />
      <AccountButton />
    </div>
  )
}
