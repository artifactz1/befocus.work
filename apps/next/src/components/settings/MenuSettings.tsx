'use client'
import AccountButton from '../AccountButton'
import CustomizeButton from '../customize/CustomizeButton'
import RecordsButton from '../records/RecordsButton'
import ToDoList from '../to-do-list/ToDoList'
import { SessionSettings } from './SessionSettings'

export default function MenuSettings() {
  return (
    <main className='hidden sm:flex sm:items-center sm:justify-center sm:space-x-1'>
      <ToDoList />
      <RecordsButton />
      <SessionSettings />
      <CustomizeButton />
      <AccountButton />
    </main>
  )
}
