'use client'

import { type MotionValue, motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { labelImageUrl } from '~/hooks/useSounds'
import { discBase, labelFill, thumbnailUrl } from '~/lib/sounds/sounds'
import type { Sound } from '~/store/useSoundsStore'
import styles from './records.module.css'

export interface Look {
  label: string
  base: string
  // a picture label: the video thumbnail or an uploaded image
  pic?: string | null
  // thumbnails are 4:3 with letterbox bars, so they are cropped harder
  letterbox?: boolean
}

export function soundLook(s: Sound): Look {
  const label = labelFill(s)
  const base = discBase(s.discFinish, label)
  if (s.labelImage === 'thumbnail')
    return { label, base, pic: thumbnailUrl(s.url), letterbox: true }
  if (s.labelImage === 'upload') return { label, base, pic: labelImageUrl(s.id) }
  return { label, base }
}

// Background for a round label or sleeve disc: the picture if there is one, else the label colour.
export function labelBackground({ label, pic, letterbox }: Omit<Look, 'base'>): CSSProperties {
  if (!pic) return { background: label }
  return {
    backgroundColor: label,
    backgroundImage: `url("${pic}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: letterbox ? 'auto 134%' : 'cover',
  }
}

const GROOVES = [0, 1, 2, 3, 4, 5, 6, 7]

// A record: grooves, label and marker turn; the sheen stays put. No inner ring on any disc.
// Spin with the CSS loop (`spin`) or drive it from a motion value (`rotate`).
export default function Vinyl({
  size,
  look,
  spin = false,
  rotate,
  className,
}: {
  size: number
  look: Look
  spin?: boolean
  rotate?: MotionValue<number>
  className?: string
}) {
  const r = size / 2
  return (
    <span
      className={`${styles.vinyl} ${className ?? ''}`}
      style={{ width: size, height: size }}
      aria-hidden='true'
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden='true'>
        <circle cx={r} cy={r} r={r - 0.5} fill={look.base} stroke='rgb(255 255 255 / 0.09)' />
      </svg>
      <motion.span className={`${styles.turn} ${spin ? styles.spin : ''}`} style={{ rotate }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden='true'>
          {GROOVES.map(i => (
            <circle
              key={i}
              cx={r}
              cy={r}
              r={r * (0.4 + i * 0.068)}
              fill='none'
              stroke='rgb(255 255 255 / 0.035)'
            />
          ))}
          {!look.pic && <circle cx={r} cy={r} r={r * 0.33} fill={look.label} />}
          <rect
            x={r - 1}
            y={r - r * 0.26}
            width='2'
            height={r * 0.1}
            rx='1'
            fill='rgb(0 0 0 / 0.3)'
          />
        </svg>
        {look.pic && (
          <span
            className={styles.vpic}
            style={{ width: r * 0.66, height: r * 0.66, ...labelBackground(look) }}
          />
        )}
      </motion.span>
      {!look.pic && (
        <svg
          className={styles.spindle}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden='true'
        >
          <circle cx={r} cy={r} r='2.5' fill='#d6d3d1' />
        </svg>
      )}
      <span className={styles.sheen} />
    </span>
  )
}

export function Eq() {
  return (
    <span className={styles.eq} aria-hidden='true'>
      <i />
      <i />
      <i />
    </span>
  )
}
