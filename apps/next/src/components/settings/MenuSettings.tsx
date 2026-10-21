'use client'
import AccountButton from '../AccountButton'
import CustomizeButton from '../customize/CustomizeButton'
import RecordsButton from '../records/RecordsButton'
import TasksButton from '../tasks/TasksButton'
import SessionSettingsButton from './SessionSettingsButton'

export default function MenuSettings() {
  return (
    <main className='hidden sm:flex sm:items-center sm:justify-center sm:space-x-1'>
      <TasksButton />
      <RecordsButton />
      <SessionSettingsButton />
      <CustomizeButton />
      <AccountButton />
    </main>
  )
}
