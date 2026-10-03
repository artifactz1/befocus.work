/**
 * Pure geometry for the timer transform while the Customize panel is open.
 * The timer only translates into the free area, it never scales: it keeps its full size.
 *
 * These constants mirror values baked into CSS elsewhere and must stay in sync by hand:
 * - DOCK_WIDTH (520) and DESKTOP_MIN_WIDTH (1024) mirror customize-panel.module.css's
 *   desktop aside width and the `(min-width: 1024px)` switch in CustomizePanel.tsx.
 * - SHEET_FRACTION (0.6) mirrors the mobile sheet's `height: 60dvh` in customize-panel.module.css.
 */
export const DOCK_WIDTH = 520
export const SHEET_FRACTION = 0.6
export const DESKTOP_MIN_WIDTH = 1024

export interface TimerTransformInput {
  panelOpen: boolean
  vw: number
  vh: number
  centerY: number
}

export interface TimerTransform {
  tx: number
  ty: number
  scale: 1
}

const IDENTITY: TimerTransform = { tx: 0, ty: 0, scale: 1 }

export function computeTimerTransform({
  panelOpen,
  vw,
  vh,
  centerY,
}: TimerTransformInput): TimerTransform {
  if (!panelOpen) return IDENTITY

  if (vw >= DESKTOP_MIN_WIDTH) return { tx: (vw - DOCK_WIDTH) / 2 - vw / 2, ty: 0, scale: 1 }

  return { tx: 0, ty: (vh - SHEET_FRACTION * vh) / 2 - centerY, scale: 1 }
}
