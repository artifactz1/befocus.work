'use client'

import { isYouTubeUrl } from '@repo/api/lib/youtube'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSession } from '~/lib/auth.client'
import { type Sound, useSoundsStore } from '~/store/useSoundsStore'
import panel from '../customize/customize-panel.module.css'
import AddSoundDialog, { type DialogState } from './AddSoundDialog'
import KnobRow from './KnobRow'
import styles from './records.module.css'
import Shelf from './Shelf'
import Turntable from './Turntable'

export default function RecordRoomBody() {
  const setRoomOpen = useSoundsStore(state => state.setRoomOpen)
  const record = useSoundsStore(state => state.sounds[state.bgMusicId])
  const { data: session } = useSession()
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const signedIn = Boolean(session)
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
      <div className={panel.head}>
        <h2 id='records-heading' className={panel.heading} tabIndex={-1}>
          Records
        </h2>
        <p className={styles.status} aria-live='polite'>
          {status}
        </p>
        <button
          type='button'
          className={panel.closeBtn}
          aria-label='Close records'
          onClick={() => setRoomOpen(false)}
        >
          <X size={16} />
        </button>
      </div>
      <div className={styles.body}>
        <Turntable />
        <KnobRow
          onAdd={() => setDialog({ mode: 'add', url: '', type: 'ambient' })}
          onRename={rename}
        />
        <Shelf
          onAdd={() => setDialog({ mode: 'add', url: '', type: 'bgMusic' })}
          onRename={rename}
        />
      </div>
      <AddSoundDialog state={dialog} onClose={() => setDialog(null)} />
    </>
  )
}
