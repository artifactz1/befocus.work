'use client'

import { cn } from '@repo/ui/lib/utils'
import { type KeyboardEvent, useRef } from 'react'
import styles from './logs.module.css'

type Option = { value: string; label: string }

/** Segmented control with radio semantics: roving tabindex, arrows move and select. */
export function Seg({
  size,
  legend,
  options,
  value,
  onChange,
  allowClear = false,
}: {
  size: 'md' | 'xs'
  legend: string
  options: Option[]
  value: string | null
  onChange: (value: string | null) => void
  allowClear?: boolean
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const selected = options.findIndex(o => o.value === value)
  const tabbable = selected >= 0 ? selected : 0

  const move = (from: number, step: number) => {
    const next = (from + step + options.length) % options.length
    const option = options[next]
    if (!option) return
    onChange(option.value)
    refs.current[next]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0
    if (step === 0) return
    event.preventDefault()
    move(index, step)
  }

  return (
    <div
      role='radiogroup'
      aria-label={legend}
      className={cn(styles.seg, size === 'xs' && styles.xs)}
    >
      {options.map((option, index) => {
        const checked = index === selected
        return (
          // biome-ignore lint/a11y/useSemanticElements: roving-tabindex radio on a button
          <button
            key={option.value}
            ref={el => {
              refs.current[index] = el
            }}
            type='button'
            role='radio'
            aria-checked={checked}
            tabIndex={index === tabbable ? 0 : -1}
            className={styles.segItem}
            onClick={() => onChange(allowClear && checked ? null : option.value)}
            onKeyDown={event => onKeyDown(event, index)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
