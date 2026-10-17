import type { ZodType } from 'zod'

// The property access itself throws in Safari with blocked site data, and on the server.
export function defaultStorage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

/** Parsed value for `key`, or null when storage is missing or throws, or the value is absent, bad JSON or fails `schema`. */
export function readStored<T>(
  key: string,
  schema: ZodType<T>,
  storage: Pick<Storage, 'getItem'> | undefined = defaultStorage(),
): T | null {
  try {
    const raw = storage?.getItem(key)
    if (raw == null) return null
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** Writes `value` as JSON. False when storage is missing or throws (quota, private mode). */
export function writeStored(
  key: string,
  value: unknown,
  storage: Pick<Storage, 'setItem'> | undefined = defaultStorage(),
): boolean {
  try {
    if (!storage) return false
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
