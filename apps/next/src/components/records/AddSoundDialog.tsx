'use client'

import { isYouTubeUrl } from '@repo/api/lib/youtube'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { useEffect, useRef, useState } from 'react'
import { useSound, useUpdateUserSound } from '~/hooks/useSounds'
import panel from '../customize/customize-panel.module.css'
import styles from './records.module.css'

export type DialogState =
  | { mode: 'add'; url: string; type: 'bgMusic' | 'ambient' }
  | { mode: 'rename'; id: string; name: string }

const BAD_URL = "That isn't a YouTube link. Paste a youtube.com or youtu.be link."
const HELP = {
  bgMusic: 'Plays on the turntable, one at a time.',
  ambient: 'A knob that layers under the record.',
} as const

// Waits for the new item to render, then scrolls to it and focuses it.
function focusSound(id: string) {
  let tries = 0
  const tick = () => {
    const el = document.querySelector<HTMLElement>(`[data-sound-id="${id}"]`)
    if (el) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      el.querySelector<HTMLElement>('button, [role="slider"]')?.focus()
    } else if (tries++ < 30) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function Form({ state, close }: { state: DialogState; close: () => void }) {
  const adding = state.mode === 'add'
  const add = useSound()
  const rename = useUpdateUserSound(state.mode === 'rename' ? state.id : '')
  const [url, setUrl] = useState(adding ? state.url : '')
  const [name, setName] = useState(adding ? '' : state.name)
  const [type, setType] = useState<'bgMusic' | 'ambient'>(adding ? state.type : 'bgMusic')
  const [urlError, setUrlError] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const typed = useRef(!adding)
  const nameRef = useRef<HTMLInputElement>(null)
  const pending = add.isPending || rename.isPending

  const validUrl = isYouTubeUrl(url.trim())

  // Prefill the name from the video title. The title is only ever an input value.
  useEffect(() => {
    if (!adding || !validUrl) return
    const ctrl = new AbortController()
    setFetching(true)
    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url.trim())}&format=json`, {
      signal: ctrl.signal,
    })
      .then(r =>
        r.ok ? (r.json() as Promise<{ title?: unknown }>) : Promise.reject(new Error('oembed')),
      )
      .then(data => {
        if (typeof data.title === 'string' && !typed.current)
          setName(data.title.trim().slice(0, 80))
        setFetching(false)
      })
      .catch(err => {
        if (err?.name === 'AbortError') return
        setFetching(false)
        if (!typed.current) nameRef.current?.focus()
      })
    return () => ctrl.abort()
  }, [adding, validUrl, url])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Give it a name.')
    setError('')
    if (state.mode === 'rename') {
      return rename.mutate(trimmed, { onSuccess: close, onError: err => setError(err.message) })
    }
    if (!validUrl) return setUrlError(true)
    add.mutate(
      { name: trimmed, url: url.trim(), soundType: type },
      {
        onSuccess: row => {
          close()
          focusSound(row.id)
        },
        onError: err => setError(err.message),
      },
    )
  }

  return (
    <form onSubmit={submit} className={styles.dialogForm}>
      <DialogTitle className='text-base font-semibold'>
        {adding ? 'Add to your room' : 'Rename'}
      </DialogTitle>
      <DialogDescription className='sr-only'>
        {adding ? 'Save a YouTube link as a record or ambience.' : 'Change the name.'}
      </DialogDescription>
      {adding && (
        <div className={styles.field}>
          <Label htmlFor='add-sound-url'>YouTube link</Label>
          <Input
            id='add-sound-url'
            className='text-base'
            value={url}
            onChange={e => {
              setUrl(e.target.value)
              setUrlError(false)
            }}
            onBlur={() => setUrlError(url.trim() !== '' && !validUrl)}
            aria-invalid={urlError || undefined}
            aria-describedby={urlError ? 'add-sound-url-error' : undefined}
            autoComplete='off'
          />
          {urlError && (
            <p id='add-sound-url-error' className={styles.error} role='alert'>
              {BAD_URL}
            </p>
          )}
        </div>
      )}
      <div className={styles.field}>
        <Label htmlFor='add-sound-name'>Name</Label>
        <Input
          id='add-sound-name'
          ref={nameRef}
          className='text-base'
          value={name}
          maxLength={80}
          placeholder={fetching ? 'Fetching title...' : undefined}
          onChange={e => {
            typed.current = true
            setName(e.target.value)
          }}
          autoComplete='off'
        />
      </div>
      {adding && (
        <div className={styles.field}>
          <div className={panel.seg} role='radiogroup' aria-label='Add as'>
            {(
              [
                ['bgMusic', 'Record'],
                ['ambient', 'Ambience'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className={panel.segItem}>
                <input
                  type='radio'
                  name='add-as'
                  checked={type === value}
                  onChange={() => setType(value)}
                />
                <span className={panel.segLabel}>{label}</span>
              </label>
            ))}
          </div>
          <p className={styles.help}>{HELP[type]}</p>
        </div>
      )}
      {error && (
        <p className={styles.error} role='alert'>
          {error}
        </p>
      )}
      <div className={styles.dialogActions}>
        <Button type='button' variant='ghost' onClick={close}>
          Cancel
        </Button>
        <Button type='submit' disabled={pending}>
          {pending
            ? adding
              ? 'Adding...'
              : 'Saving...'
            : adding
              ? type === 'bgMusic'
                ? 'Add record'
                : 'Add ambience'
              : 'Save name'}
        </Button>
      </div>
    </form>
  )
}

export default function AddSoundDialog({
  state,
  onClose,
}: {
  state: DialogState | null
  onClose: () => void
}) {
  return (
    <Dialog open={state !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className={styles.dialog}>
        {state && <Form state={state} close={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
