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
  const starter = isStarterId(sound.id)

  // The trigger unmounts with its item, so hand focus to a neighbour or the add tile.
  const remove = () => {
    const item = trigger.current?.closest('[data-sound-id]')
    const next = item?.nextElementSibling ?? item?.previousElementSibling
    del.mutate(sound.id)
    requestAnimationFrame(() => next?.querySelector<HTMLElement>(FOCUSABLE)?.focus())
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
        <DropdownMenuContent align='end'>
          {!starter && <DropdownMenuItem onSelect={() => onRename(sound)}>Rename</DropdownMenuItem>}
          <DropdownMenuItem onSelect={() => setConfirm(true)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
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
