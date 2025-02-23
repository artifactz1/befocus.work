export type CookieStore = {
  getItem: <T>(key: string) => T | null
  setItem: <T>(key: string, value: T) => void
  removeItem: (key: string) => void
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

export const setItem = <T>(key: string, value: T): void => {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year
  const cookieValue = encodeURIComponent(JSON.stringify(value))
  document.cookie = `${key}=${cookieValue};expires=${expires.toUTCString()};path=/`
}

export const removeItem = (key: string): void => {
  if (typeof document === 'undefined') return
  document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
}
