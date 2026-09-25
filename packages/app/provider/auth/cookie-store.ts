// The Cookie Store API isn't in TS's default lib.dom.d.ts yet; declare the
// minimal surface we use so `window.cookieStore` type-checks.
declare global {
  interface CookieStoreSetOptions {
    name: string
    value: string
    expires?: number
    path?: string
  }
  interface Window {
    cookieStore?: {
      set: (options: CookieStoreSetOptions) => Promise<void>
      delete: (name: string) => Promise<void>
    }
  }
}

export type CookieStore = {
  getItem: <T>(key: string) => T | null
  setItem: <T>(key: string, value: T) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

export const getItem = <T>(key: string): T | null => {
  if (typeof document === 'undefined') return null
  const name = `${key}=`
  const decodedCookie = decodeURIComponent(document.cookie)
  const cookieArray = decodedCookie.split(';')
  for (let i = 0; i < cookieArray.length; i++) {
    const cookie = cookieArray[i]?.trim()
    if (cookie && cookie.indexOf(name) === 0) {
      return JSON.parse(cookie.substring(name.length, cookie.length))
    }
  }
  return null
}

export const setItem = async <T>(key: string, value: T): Promise<void> => {
  if (typeof window === 'undefined' || !window.cookieStore) return
  const expires = Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
  await window.cookieStore.set({
    name: key,
    value: encodeURIComponent(JSON.stringify(value)),
    expires,
    path: '/',
  })
}

export const removeItem = async (key: string): Promise<void> => {
  if (typeof window === 'undefined' || !window.cookieStore) return
  await window.cookieStore.delete(key)
}
