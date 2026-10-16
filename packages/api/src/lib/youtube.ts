const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'])

// Host allowlist on the parsed URL, never a regex over the whole string (look-alike hosts).
export function youTubeVideoId(input: string): string | null {
  if (input.length > 2048) return null
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null
  if (!HOSTS.has(url.hostname)) return null
  return (
    url.searchParams.get('v') || /^\/(?:live|shorts|embed)\/([^/]+)/.exec(url.pathname)?.[1] || null
  )
}

export const isYouTubeUrl = (input: string) => youTubeVideoId(input) !== null
