import { parse } from 'tldts'

export function extractDomain(url: string): string {
  try {
    const domain = parse(url).domain
    return domain ?? ''
  } catch (error) {
    console.error('Invalid URL:', error)
    return ''
  }
}
