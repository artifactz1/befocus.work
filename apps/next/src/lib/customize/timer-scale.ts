/**
 * Pure geometry for the D-20 timer transform while the Customize panel is open.
 *
 * These constants mirror values baked into CSS elsewhere and must stay in sync by hand:
 * - DOCK_WIDTH (520) and DESKTOP_MIN_WIDTH (1024) mirror customize-panel.module.css's
 *   desktop aside width and the `(min-width: 1024px)` switch in CustomizePanel.tsx.
 * - SHEET_FRACTION (0.6) mirrors the mobile sheet's `height: 60dvh` in customize-panel.module.css.
 */
export const DOCK_WIDTH = 520
export const SHEET_FRACTION = 0.6
export const DESKTOP_MIN_WIDTH = 1024
export const TIMER_GUTTER = 24
export const TIMER_MAX_SCALE = 0.72
export const CENTERED_MIN_SCALE = 0.4

export interface TimerTransformInput {
  panelOpen: boolean
  vw: number
  vh: number
  timerW: number
  timerH: number
  centerY: number
}

export interface TimerTransform {
  tx: number
  ty: number
  scale: number
}

const IDENTITY: TimerTransform = { tx: 0, ty: 0, scale: 1 }

// ponytail: floor so a degenerate viewport can never mirror (negative) or collapse (0) the timer.
const MIN_SCALE = 0.2

export function computeTimerTransform({
  panelOpen,
  vw,
  vh,
  timerW,
  timerH,
  centerY,
}: TimerTransformInput): TimerTransform {
  if (!panelOpen || timerW <= 0 || timerH <= 0) return IDENTITY

  const isDesktop = vw >= DESKTOP_MIN_WIDTH

  if (isDesktop) {
    const featherStart = vw - DOCK_WIDTH
    const centered = Math.min(
      TIMER_MAX_SCALE,
      ((featherStart - vw / 2 - TIMER_GUTTER) * 2) / timerW,
    )

    if (centered >= CENTERED_MIN_SCALE) {
      return { tx: 0, ty: 0, scale: Math.max(MIN_SCALE, centered) }
    }

    const tx = featherStart / 2 - vw / 2
    const scale = Math.min(TIMER_MAX_SCALE, (featherStart - 2 * TIMER_GUTTER) / timerW)
    return { tx, ty: 0, scale: Math.max(MIN_SCALE, scale) }
  }

  const sheetH = SHEET_FRACTION * vh
  const scale = Math.min(TIMER_MAX_SCALE, (vh - sheetH - 40) / timerH)
  const ty = (vh - sheetH) / 2 - centerY
  return { tx: 0, ty, scale: Math.max(MIN_SCALE, scale) }
}
