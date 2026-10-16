export const LABEL_MAX_BYTES = 1024 * 1024

export const labelKey = (userId: string, soundId: string) => `labels/${userId}/${soundId}`

// The type comes from the bytes, never the request header, so a renamed file is refused.
export function sniffLabelImage(
  bytes: Uint8Array,
): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  const at = (i: number, ...sig: number[]) => sig.every((b, j) => bytes[i + j] === b)
  if (at(0, 0xff, 0xd8, 0xff)) return 'image/jpeg'
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png'
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'image/webp'
  return null
}
