'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { isYouTubeUrl } from '@repo/api/lib/youtube'
import { useReducedMotion } from 'framer-motion'
import { Disc3, ImageUp, Link2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { useSound, useUpdateUserSound } from '~/hooks/useSounds'
import {
  autoLabel,
  type DiscFinish,
  discBase,
  LABEL_SWATCHES,
  thumbnailUrl,
} from '~/lib/sounds/sounds'
import styles from './add-sound.module.css'
import Vinyl, { type Look, labelBackground } from './Vinyl'

export type DialogState =
  | { mode: 'add'; url: string; type: 'bgMusic' | 'ambient'; from?: HTMLElement }
  | { mode: 'rename'; id: string; name: string }

const BAD_URL = "That isn't a YouTube link. Paste a youtube.com or youtu.be link."
const BAD_IMAGE = "That image couldn't be read. Try a JPG, PNG or WebP."
const SWATCH_NAMES = ['Rose', 'Peach', 'Lemon', 'Mint', 'Sky', 'Lilac', 'Chalk'] as const
const FINISHES = [
  ['black', 'Black'],
  ['smoke', 'Smoke'],
  ['tinted', 'Tinted'],
] as const
const TYPES = [
  ['bgMusic', 'Record'],
  ['ambient', 'Ambience'],
] as const

// 'auto', a swatch colour, or a picture
type LabelChoice = 'auto' | (typeof LABEL_SWATCHES)[number] | 'thumbnail' | 'upload'

// Waits for the new item to render, then scrolls to it and focuses it.
function focusSound(id: string) {
  let tries = 0
  const tick = () => {
    const el = document.querySelector<HTMLElement>(`[data-sound-id="${id}"]`)
    if (el) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      el.querySelector<HTMLElement>('button, input')?.focus()
    } else if (tries++ < 30) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// Centre-crops a picture to a 512px square, as webp (jpeg where the browser can't encode webp).
async function toLabelBlob(file: File): Promise<Blob> {
  if (file.size > 20_000_000) throw new Error('too large')
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  canvas
    .getContext('2d')
    ?.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      512,
      512,
    )
  bitmap.close()
  const encode = (type: string) =>
    new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.86))
  const webp = await encode('image/webp')
  if (webp?.type === 'image/webp') return webp
  const jpeg = await encode('image/jpeg')
  if (!jpeg) throw new Error('encode')
  return jpeg
}

// The video title, for the name placeholder. It is only ever shown as text.
function useVideoTitle(url: string, valid: boolean) {
  const [title, setTitle] = useState<{ url: string; text: string | null } | null>(null)
  useEffect(() => {
    if (!valid) return
    const ctrl = new AbortController()
    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
      signal: ctrl.signal,
    })
      .then(r => (r.ok ? (r.json() as Promise<{ title?: unknown }>) : null))
      .then(data => {
        const text = typeof data?.title === 'string' ? data.title.trim().slice(0, 80) : ''
        setTitle({ url, text: text || null })
      })
      .catch(err => {
        if (err?.name !== 'AbortError') setTitle({ url, text: null })
      })
    return () => ctrl.abort()
  }, [url, valid])
  if (!valid) return { title: null, fetching: false }
  return { title: title?.url === url ? title.text : null, fetching: title?.url !== url }
}

function Head({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.head}>
      <DialogPrimitive.Title className={styles.title}>{title}</DialogPrimitive.Title>
      <DialogPrimitive.Description className='sr-only'>{description}</DialogPrimitive.Description>
      <DialogPrimitive.Close className={styles.x} aria-label='Close'>
        <X aria-hidden='true' />
      </DialogPrimitive.Close>
    </div>
  )
}

function Footer({ pending, label }: { pending: boolean; label: string }) {
  return (
    <div className={styles.foot}>
      <DialogPrimitive.Close className={styles.ghost} type='button'>
        Cancel
      </DialogPrimitive.Close>
      <button type='submit' className={styles.primary} disabled={pending}>
        {label}
      </button>
    </div>
  )
}

function AddForm({
  state,
  close,
}: {
  state: Extract<DialogState, { mode: 'add' }>
  close: () => void
}) {
  const reduced = useReducedMotion()
  const phone = useMediaQuery('(max-width: 639px)')
  const [cs, ds] = phone ? [132, 124] : [168, 156] // cover and disc sizes
  const add = useSound()
  const [url, setUrl] = useState(state.url)
  const [type, setType] = useState<'bgMusic' | 'ambient'>(state.type)
  const [name, setName] = useState('')
  const [label, setLabel] = useState<LabelChoice>('auto')
  const [disc, setDisc] = useState<DiscFinish>('black')
  const [upload, setUpload] = useState<{ blob: Blob; src: string } | null>(null)
  const [urlError, setUrlError] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const trimmedUrl = url.trim()
  const validUrl = isYouTubeUrl(trimmedUrl)
  const { title, fetching } = useVideoTitle(trimmedUrl, validUrl)
  const record = type === 'bgMusic'
  const sleeveName = name.trim() || title || ''
  const thumb = validUrl ? thumbnailUrl(trimmedUrl) : null

  useEffect(
    () => () => {
      if (upload) URL.revokeObjectURL(upload.src)
    },
    [upload],
  )

  const colour =
    label === 'auto' || label === 'thumbnail' || label === 'upload'
      ? autoLabel(sleeveName || 'Record')
      : label
  const look: Look = {
    label: colour,
    base: discBase(disc, colour),
    pic: label === 'thumbnail' ? thumb : label === 'upload' ? upload?.src : null,
    letterbox: label === 'thumbnail',
  }
  const swatch = LABEL_SWATCHES.indexOf(label as (typeof LABEL_SWATCHES)[number])
  const labelName =
    label === 'auto'
      ? 'Auto'
      : label === 'thumbnail'
        ? 'Video thumbnail'
        : label === 'upload'
          ? 'Uploaded image'
          : (SWATCH_NAMES[swatch] ?? 'Auto')
  const caption = [
    thumb ? 'thumbnail cover' : 'plain cover',
    label === 'thumbnail' || label === 'upload'
      ? 'picture label'
      : `${labelName.toLowerCase()} label`,
    `${disc} disc`,
  ].join(', ')

  const pick = async (file: File | undefined) => {
    if (!file) return
    setError('')
    try {
      const blob = await toLabelBlob(file)
      setUpload({ blob, src: URL.createObjectURL(blob) })
      setLabel('upload')
    } catch {
      setError(BAD_IMAGE)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validUrl) return setUrlError(true)
    if (!sleeveName) {
      setError('Give it a name.')
      return nameRef.current?.focus()
    }
    setError('')
    add.mutate(
      {
        name: sleeveName,
        url: trimmedUrl,
        soundType: type,
        ...(record && {
          labelColor: swatch >= 0 ? LABEL_SWATCHES[swatch] : null,
          labelImage: label === 'thumbnail' ? 'thumbnail' : null,
          discFinish: disc,
          upload: label === 'upload' ? upload?.blob : undefined,
        }),
      },
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
    <form onSubmit={submit} noValidate>
      <Head
        title={record ? 'Add a record' : 'Add ambience'}
        description='Save a YouTube link as a record or ambience.'
      />
      <div className={styles.field}>
        <label htmlFor='add-sound-url' className={styles.sec}>
          YouTube link
        </label>
        <div className={styles.input} data-invalid={urlError || undefined}>
          <Link2 aria-hidden='true' />
          <input
            id='add-sound-url'
            value={url}
            placeholder='https://youtu.be/...'
            onChange={e => {
              setUrl(e.target.value)
              setUrlError(false)
            }}
            onBlur={() => setUrlError(trimmedUrl !== '' && !validUrl)}
            aria-invalid={urlError || undefined}
            aria-describedby={urlError ? 'add-sound-url-error' : undefined}
            autoComplete='off'
            inputMode='url'
          />
        </div>
        {urlError && (
          <p id='add-sound-url-error' className={styles.error} role='alert'>
            {BAD_URL}
          </p>
        )}
      </div>
      <div className={styles.field}>
        <span className={styles.sec} id='add-as'>
          Add as
        </span>
        <div className={styles.seg} role='radiogroup' aria-labelledby='add-as'>
          {TYPES.map(([value, text]) => (
            <label key={value}>
              <input
                type='radio'
                name='add-as'
                className='sr-only'
                checked={type === value}
                onChange={() => setType(value)}
              />
              <span>{text}</span>
            </label>
          ))}
        </div>
        {!record && <p className={styles.help}>Layers under the record, with its own volume.</p>}
      </div>
      {record && (
        <>
          <div
            className={styles.hero}
            style={{ width: cs * 0.46 + ds, height: cs }}
            aria-hidden='true'
          >
            <span className={styles.out} style={{ left: cs * 0.46, top: (cs - ds) / 2 }}>
              <Vinyl size={ds} look={look} spin={!reduced} />
            </span>
            <span
              className={styles.cover}
              style={{
                width: cs,
                height: cs,
                ...(thumb && labelBackground({ label: '#1c1c1c', pic: thumb, letterbox: true })),
              }}
            >
              {!thumb && <Disc3 className={styles.coverIcon} />}
              <span className={styles.ti}>{sleeveName || 'Your record'}</span>
            </span>
          </div>
          <p className={styles.caption}>Live preview · {caption}</p>
          <div className={styles.field} role='radiogroup' aria-labelledby='label-heading'>
            <p className={styles.sec}>
              <span id='label-heading'>Label</span>
              <em>{labelName}</em>
            </p>
            <div className={styles.swatches}>
              <label className={styles.sw} title='Auto'>
                <input
                  type='radio'
                  name='label'
                  className='sr-only'
                  checked={label === 'auto'}
                  onChange={() => setLabel('auto')}
                  aria-label='Auto'
                />
                <span className={`${styles.dot} ${styles.auto}`} />
              </label>
              {LABEL_SWATCHES.map((hex, i) => (
                <label key={hex} className={styles.sw} title={SWATCH_NAMES[i]}>
                  <input
                    type='radio'
                    name='label'
                    className='sr-only'
                    checked={label === hex}
                    onChange={() => setLabel(hex)}
                    aria-label={SWATCH_NAMES[i]}
                  />
                  <span className={styles.dot} style={{ background: hex }} />
                </label>
              ))}
            </div>
            <div className={styles.pics}>
              <label className={styles.pic} data-on={label === 'thumbnail' || undefined}>
                <input
                  type='radio'
                  name='label'
                  className='sr-only'
                  checked={label === 'thumbnail'}
                  onChange={() => setLabel('thumbnail')}
                />
                <span
                  className={styles.picPreview}
                  style={thumb ? labelBackground({ label: '', pic: thumb, letterbox: true }) : {}}
                />
                <em>
                  Video
                  <br />
                  thumbnail
                </em>
              </label>
              <button
                type='button'
                className={styles.pic}
                data-on={label === 'upload' || undefined}
                aria-pressed={label === 'upload'}
                onClick={() =>
                  upload && label !== 'upload' ? setLabel('upload') : fileRef.current?.click()
                }
              >
                <span
                  className={styles.picPreview}
                  style={upload ? labelBackground({ label: '', pic: upload.src }) : {}}
                >
                  {!upload && <ImageUp aria-hidden='true' />}
                </span>
                <em>
                  {upload ? (label === 'upload' ? 'Change' : 'Your') : 'Upload'}
                  <br />
                  image
                </em>
              </button>
              <input
                ref={fileRef}
                type='file'
                accept='image/jpeg,image/png,image/webp'
                hidden
                onChange={e => {
                  pick(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
          </div>
          <div className={styles.field}>
            <p className={styles.sec}>
              <span id='disc-heading'>Disc</span>
              <em>{FINISHES.find(([v]) => v === disc)?.[1]}</em>
            </p>
            <div className={styles.seg} role='radiogroup' aria-labelledby='disc-heading'>
              {FINISHES.map(([value, text]) => (
                <label key={value}>
                  <input
                    type='radio'
                    name='disc'
                    className='sr-only'
                    checked={disc === value}
                    onChange={() => setDisc(value)}
                  />
                  <span>{text}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
      <div className={styles.field}>
        <label htmlFor='add-sound-name' className={styles.sec}>
          {record ? 'Name on sleeve' : 'Name'}
          <em>Optional</em>
        </label>
        <div className={styles.input}>
          <input
            id='add-sound-name'
            ref={nameRef}
            value={name}
            maxLength={80}
            placeholder={fetching ? 'Fetching title...' : (title ?? 'Name it')}
            onChange={e => setName(e.target.value)}
            autoComplete='off'
          />
        </div>
      </div>
      {error && (
        <p className={styles.error} role='alert'>
          {error}
        </p>
      )}
      <Footer
        pending={add.isPending}
        label={add.isPending ? 'Adding...' : record ? 'Add to shelf' : 'Add ambience'}
      />
    </form>
  )
}

function RenameForm({
  state,
  close,
}: {
  state: Extract<DialogState, { mode: 'rename' }>
  close: () => void
}) {
  const rename = useUpdateUserSound(state.id)
  const [name, setName] = useState(state.name)
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Give it a name.')
    setError('')
    rename.mutate(trimmed, { onSuccess: close, onError: err => setError(err.message) })
  }

  return (
    <form onSubmit={submit} noValidate>
      <Head title='Rename' description='Change the name.' />
      <div className={styles.field}>
        <label htmlFor='add-sound-name' className={styles.sec}>
          Name
        </label>
        <div className={styles.input}>
          <input
            id='add-sound-name'
            value={name}
            maxLength={80}
            onChange={e => setName(e.target.value)}
            autoComplete='off'
          />
        </div>
      </div>
      {error && (
        <p className={styles.error} role='alert'>
          {error}
        </p>
      )}
      <Footer pending={rename.isPending} label={rename.isPending ? 'Saving...' : 'Save name'} />
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
  // Rename opens from a menu that is gone by now, so focus goes back to the renamed sleeve.
  // A tap does not focus the add button on touch, so it is passed in to return to.
  const back = useRef<string | HTMLElement | null>(null)
  if (state) back.current = state.mode === 'rename' ? state.id : (state.from ?? null)

  return (
    <DialogPrimitive.Root open={state !== null} onOpenChange={open => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.scrim} />
        <DialogPrimitive.Content
          className={styles.card}
          onOpenAutoFocus={e => {
            e.preventDefault()
            const url = document.getElementById('add-sound-url') as HTMLInputElement | null
            const target = url && !url.value ? url : document.getElementById('add-sound-name')
            target?.focus()
          }}
          onCloseAutoFocus={e => {
            const from = back.current
            const target =
              typeof from === 'string'
                ? document
                    .querySelector(`[data-sound-id="${from}"]`)
                    ?.querySelector<HTMLElement>('button, input')
                : from
            if (!target?.isConnected) return
            e.preventDefault()
            target.focus()
          }}
        >
          <span className={styles.handle} aria-hidden='true' />
          {state?.mode === 'add' && <AddForm state={state} close={onClose} />}
          {state?.mode === 'rename' && <RenameForm state={state} close={onClose} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
