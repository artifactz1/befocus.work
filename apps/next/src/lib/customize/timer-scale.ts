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

// RED stub: always identity. Implemented after the failing assertions are confirmed.
export function computeTimerTransform(_input: TimerTransformInput): TimerTransform {
  return { tx: 0, ty: 0, scale: 1 }
}
