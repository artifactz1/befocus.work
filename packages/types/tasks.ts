// Guest ids are client UUIDs; signed-in ids are the server id as a string.
export interface Task {
  id: string
  text: string
  completed: boolean
  archived: boolean
  createdAt?: string
  /** Parked for later; `laterAt` is stamped by the server. */
  later?: boolean
  laterAt?: string | null
}

export const TASK_TEXT_MAX = 500
