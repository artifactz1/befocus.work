'use client'

import CommandDialogConent from './CommandDialogContent'
import { ClientOnly } from './helper/ClientOnly'

export default function CommandMenu() {
  return (
    <>
      <ClientOnly fallback={null}>
        <CommandDialogConent />
      </ClientOnly>

    </>

  )
}