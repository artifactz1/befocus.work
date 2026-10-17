import type { Look } from '@repo/types/look'

interface LookSaverOptions {
  send: (look: Look) => Promise<void>
  onSaved: (look: Look) => void
  onError: (error: unknown) => void
}

// One request in flight, one slot for the latest look waiting behind it. The last look passed to
// save() is always the last one sent, so rapid Apply converges on what the user applied last.
export function createLookSaver({ send, onSaved, onError }: LookSaverOptions) {
  let inFlight = false
  let pending: Look | null = null

  async function run() {
    inFlight = true
    while (pending) {
      const look = pending
      pending = null
      try {
        await send(look)
        onSaved(look)
      } catch (error) {
        onError(error)
      }
    }
    inFlight = false
  }

  return {
    save(look: Look) {
      pending = look
      if (!inFlight) void run()
    },
  }
}
