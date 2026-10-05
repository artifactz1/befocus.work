'use client'

import CustomizeButton from '~/components/customize/CustomizeButton'
import NowPlayingChip from '../records/NowPlayingChip'
import RecordsButton from '../records/RecordsButton'
import ToDoListMobile from '../to-do-list/ToDoListMobile'
import SessionSettingsMobile from './SessionSettingsMobile'

export default function MenuSettingsMobile() {
  return (
    <main className='flex h-fit flex-row items-center justify-center sm:hidden gap-1'>
      <ToDoListMobile />
      <NowPlayingChip variant='compact' />
      <RecordsButton />
      <SessionSettingsMobile />
      <CustomizeButton />
    </main>
  )
}
