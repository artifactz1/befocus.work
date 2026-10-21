import { toast } from 'sonner'

// tempId -> in-flight create, so later actions on a fresh task wait for its server id. Entries
// stay after the create lands (the promise then resolves to the server id) so a late
// whenTaskSaved(tempId) still maps to the real id. ponytail: one small entry per task added.
export const pendingCreates = new Map<string, Promise<string | null>>()

/** Resolves to the server id of a task (null when its create failed). */
export const whenTaskSaved = (id: string): Promise<string | null> =>
  pendingCreates.get(id) ?? Promise.resolve(id)

export const failToast = (text: string) =>
  toast.error(`Couldn't save ${text}. Check your connection and try again.`)
