'use client'

import CustomizeButton from '~/components/customize/CustomizeButton'
import RecordsButton from '../records/RecordsButton'
import ToDoListMobile from '../to-do-list/ToDoListMobile'
import SessionSettingsButton from './SessionSettingsButton'

export default function MenuSettingsMobile() {
  return (
    <main className='relative flex h-fit flex-row items-center justify-center sm:hidden gap-1'>
      <ToDoListMobile />
      <RecordsButton caption />
      <SessionSettingsButton size='lg' className='lg:h-12 lg:w-32' />
      <CustomizeButton />
    </main>
  )
}
