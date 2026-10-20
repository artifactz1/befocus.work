import { buildPaintScript, type PaintTokens } from '~/lib/customize/look-paint'

// Runs before the first content node so the first frame already wears the saved look.
// buildPaintScript owns all the escaping and allow-listing.
export function LookPaintScript({ tokens }: { tokens: PaintTokens | null }) {
  return <script dangerouslySetInnerHTML={{ __html: buildPaintScript(tokens) }} />
}
