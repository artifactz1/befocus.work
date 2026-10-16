'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { useRef, useState } from 'react'
import { useDeleteUserSound } from '~/hooks/useSounds'
import { isStarterId } from '~/lib/sounds/sounds'
import type { Sound } from '~/store/useSoundsStore'
import styles from './records.module.css'

const FOCUSABLE = 'button, [role="slider"]'

export default function SoundOptions({
  sound,
  onRename,
}: {
  sound: Sound
  onRename: (sound: Sound) => void
}) {
  const del = useDeleteUserSound()
  const [confirm, setConfirm] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  // Dialogs open once the menu has closed, so its focus trap and focus return keep off them.
  const pending = useRef<(() => void) | null>(null)
  const starter = isStarterId(sound.id)

  // The trigger unmounts with its item, so hand focus to a neighbour. The crate keeps its front
  // slot and shows another record there, so focus stays in that slot.
  const remove = () => {
    const item = trigger.current?.closest('[data-sound-id]')
    const next = item?.nextElementSibling ?? item?.previousElementSibling
    del.mutate(sound.id)
    requestAnimationFrame(() => {
      const slot = item?.isConnected && item.getAttribute('data-sound-id') !== sound.id
      const at = slot ? item : next
      const target = at?.matches(FOCUSABLE) ? at : at?.querySelector(FOCUSABLE)
      if (target instanceof HTMLElement) target.focus()
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            ref={trigger}
            type='button'
            className={styles.options}
            aria-label={`Options for ${sound.name}`}
          >
            <MoreHorizontal size={16} aria-hidden='true' />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          onCloseAutoFocus={e => {
            const open = pending.current
            if (!open) return
            pending.current = null
            e.preventDefault()
            open()
          }}
        >
          {!starter && (
            <DropdownMenuItem
              onSelect={() => {
                pending.current = () => onRename(sound)
              }}
            >
              Rename
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() => {
              pending.current = () => setConfirm(true)
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent
          onCloseAutoFocus={e => {
            if (!trigger.current?.isConnected) return
            e.preventDefault()
            trigger.current.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {sound.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {starter
                ? 'It will be removed from your room on this browser.'
                : "It will be removed from your room on every device. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
