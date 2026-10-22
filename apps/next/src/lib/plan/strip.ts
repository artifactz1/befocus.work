export type StripBlock = { kind: 'focus' | 'break'; minutes: number }
export type StripLimits = { gap: number; minFocus: number; minBreak: number }

/**
 * Widths for the Strip row: proportional to minutes (planned + added, actual for done blocks).
 * When any block would fall under its minimum, every block takes max(min, proportional) and the
 * row scrolls (overflow true).
 */
export function stripWidths(
  blocks: StripBlock[],
  width: number,
  { gap, minFocus, minBreak }: StripLimits,
): { widths: number[]; per: number; overflow: boolean } {
  const total = blocks.reduce((sum, b) => sum + b.minutes, 0)
  const per = total > 0 ? Math.max(0, width - gap * Math.max(0, blocks.length - 1)) / total : 0
  const minOf = (b: StripBlock) => (b.kind === 'focus' ? minFocus : minBreak)
  const overflow = blocks.some(b => b.minutes * per < minOf(b))
  const widths = blocks.map(b => (overflow ? Math.max(minOf(b), b.minutes * per) : b.minutes * per))
  return { widths, per, overflow }
}
