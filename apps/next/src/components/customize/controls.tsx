'use client'

import { cn } from '@repo/ui/lib/utils'
import type { ReactNode } from 'react'
import styles from './customize-panel.module.css'

/** One labeled group in the panel list. `value` shows the current choice beside the label. */
export function ControlGroup({
  id,
  label,
  value,
  children,
}: {
  id?: string
  label: string
  value?: string
  children: ReactNode
}) {
  return (
    <fieldset id={id} className={styles.group}>
      <legend className={styles.label}>
        <span>{label}</span>
        {value && <span className={styles.value}>{value}</span>}
      </legend>
      {children}
    </fieldset>
  )
}

export function SwatchGroup({
  name,
  legend,
  options,
  value,
  onChange,
  variant = 'solid',
}: {
  name: string
  legend: string
  options: { value: string; label: string; color: string }[]
  value: string
  onChange: (value: string) => void
  variant?: 'solid' | 'accent'
}) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend className='sr-only'>{legend}</legend>
      <div className={cn(styles.swatches, variant === 'accent' && styles.swatchesAccent)}>
        {options.map(option => (
          <label key={option.value} className={styles.sw}>
            <input
              type='radio'
              name={name}
              value={option.value}
              checked={option.value.toLowerCase() === value.toLowerCase()}
              onChange={() => onChange(option.value)}
              aria-label={option.label}
            />
            <span className={styles.swDot} style={{ backgroundColor: option.color }} />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  return (
    <div className={styles.custom}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type='color'
        className={styles.colorInput}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <output htmlFor={id} className={styles.output}>
        {value}
      </output>
    </div>
  )
}

export function RangeField({
  id,
  label,
  min,
  max,
  step,
  value,
  format,
  onChange,
}: {
  id: string
  label: string
  min: number
  max: number
  step: number
  value: number
  format: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <div className={styles.rangeField}>
      <div className={styles.labRow}>
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} aria-live='polite' className={styles.output}>
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type='range'
        className={styles.range}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export function SegmentedControl({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string
  legend: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      <legend className='sr-only'>{legend}</legend>
      <div className={styles.seg}>
        {options.map(option => (
          <label key={option.value} className={styles.segItem}>
            <input
              type='radio'
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.segLabel}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function PickCard({
  name,
  value,
  checked,
  onChange,
  label,
  className,
  children,
}: {
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={styles.pick}>
      <input
        type='radio'
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        aria-label={label}
      />
      <span className={cn(styles.card, className)}>{children}</span>
    </label>
  )
}
