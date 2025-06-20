'use client'

import { ClientOnly } from '../helper/ClientOnly'
import CommandDialogConent from './CommandDialogContent'

export default function CommandMenu() {
  return (
    <>
      <ClientOnly fallback={null}>
        <CommandDialogConent />
      </ClientOnly>

    </>

  )
}