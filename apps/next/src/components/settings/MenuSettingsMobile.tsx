'use client'

import CustomizeButton from '~/components/customize/CustomizeButton'
import LogButton from '../logs/LogButton'
import RecordsButton from '../records/RecordsButton'
import TasksButton from '../tasks/TasksButton'
import SessionSettingsButton from './SessionSettingsButton'

export default function MenuSettingsMobile() {
  return (
    <main className='relative flex h-fit flex-row items-center justify-center sm:hidden gap-1'>
      <TasksButton />
      <LogButton />
      <RecordsButton caption />
      <SessionSettingsButton size='lg' className='lg:h-12 lg:w-32' />
      <CustomizeButton />
    </main>
  )
}
