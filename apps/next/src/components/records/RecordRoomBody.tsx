'use client'

import { isYouTubeUrl } from '@repo/api/lib/youtube'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { useSession } from '~/lib/auth.client'
import { useDeckStore } from '~/store/useDeckStore'
import { type Sound, useSoundsStore } from '~/store/useSoundsStore'
import AddSoundDialog, { type DialogState } from './AddSoundDialog'
import Ambience from './Ambience'
import styles from './records.module.css'
import Shelf from './Shelf'
import Turntable from './Turntable'

export default function RecordRoomBody() {
  const closeDeck = useDeckStore(state => state.closeDeck)
  const record = useSoundsStore(state => state.sounds[state.bgMusicId])
  const { data: session } = useSession()
  const [dialog, setDialog] = useState<DialogState | null>(null)
  // a record just added comes to the front of the crate
  const [added, setAdded] = useState<string | null>(null)
  const signedIn = Boolean(session)
  // On desktop the add and rename forms open in the room card itself, in place of the room.
  const inline = useMediaQuery('(min-width: 1024px)')
  const swapped = inline && dialog !== null
  const rename = (s: Sound) => setDialog({ mode: 'rename', id: s.id, name: s.name })

  // Pasting a link anywhere in the room starts the add flow.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target?.closest(
          'input, textarea, [contenteditable="true"], [role="dialog"]:not([data-record-room]), [role="alertdialog"]',
        )
      )
        return
      const text = e.clipboardData?.getData('text').trim()
      if (!text) return
      if (!isYouTubeUrl(text)) return void toast('Only YouTube links can be added for now.')
      if (!signedIn) return void toast('Sign in to add and keep your own records.')
      setDialog({ mode: 'add', url: text, type: 'bgMusic' })
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [signedIn])

  const status = !record
    ? 'Pick a record'
    : `${record.playing ? 'Now playing' : 'Paused'} - ${record.name}`

  return (
    <>
      <div className={styles.head} hidden={swapped}>
        <h2 id='records-heading' className={styles.heading} tabIndex={-1}>
          Records
        </h2>
        <p className='sr-only' aria-live='polite'>
          {status}
        </p>
        <button
          type='button'
          className={styles.close}
          aria-label='Close records'
          onClick={closeDeck}
        >
          <X aria-hidden='true' />
        </button>
      </div>
      <div className={styles.body} hidden={swapped}>
        <Turntable />
        <Ambience
          onAdd={from => setDialog({ mode: 'add', url: '', type: 'ambient', from })}
          onRename={rename}
        />
        <Shelf
          show={added}
          onAdd={from => setDialog({ mode: 'add', url: '', type: 'bgMusic', from })}
          onRename={rename}
        />
      </div>
      <AddSoundDialog
        state={dialog}
        onClose={() => setDialog(null)}
        onAdded={row => row.soundType === 'bgMusic' && setAdded(row.id)}
        inline={inline}
      />
    </>
  )
}
