const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'])

// Host allowlist on the parsed URL, never a regex over the whole string (look-alike hosts).
export function isYouTubeUrl(input: string): boolean {
  if (input.length > 2048) return false
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
  if (url.hostname === 'youtu.be') return url.pathname.length > 1
  if (!HOSTS.has(url.hostname)) return false
  return url.searchParams.has('v') || /^\/(live|shorts|embed)\/[^/]+/.test(url.pathname)
}
