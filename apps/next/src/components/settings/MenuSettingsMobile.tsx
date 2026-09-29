'use client'

import CustomizeButton from '~/components/customize/CustomizeButton'
import ToDoListMobile from '../to-do-list/ToDoListMobile'
import SessionSettingsMobile from './SessionSettingsMobile'
import SoundSettingsMobile from './SoundSettingsMobile'

export default function MenuSettingsMobile() {
  return (
    <main className='flex h-fit flex-row items-center justify-center sm:hidden gap-1'>
      <ToDoListMobile />
      <SoundSettingsMobile />
      <SessionSettingsMobile />
      <CustomizeButton />
    </main>
  )
}
