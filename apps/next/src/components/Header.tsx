'use client'

import { useChromeIdle } from '~/hooks/useChromeIdle'
import SessionMobileCount from './sessions/SessionMobileCount'
import SessionsUI from './sessions/SessionsUI'
import SessionTitleDisplay from './sessions/SessionTitleDisplay'

function Header() {
  // ponytail: lives here (not a shared provider) because Header is the one
  // dashboard-only component both (app) and guest pages mount.
  useChromeIdle()

  return (
    <div className='bf-chrome flex w-screen flex-col-reverse px-10 pt-10 sm:mt-0 sm:h-[calc(11vh+var(--pad-y))] sm:w-full sm:flex-row sm:items-center sm:justify-between sm:px-[var(--pad-x)]'>
      <SessionsUI />
      <div className='mb-4 flex items-end justify-between sm:mb-1'>
        <SessionTitleDisplay />
        <SessionMobileCount />
      </div>
    </div>
  )
}

export default Header
