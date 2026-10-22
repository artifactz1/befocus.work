// Guest ids are client UUIDs; signed-in ids are the server id as a string.
export interface Task {
  id: string
  text: string
  completed: boolean
  archived: boolean
  createdAt?: string
}

export const TASK_TEXT_MAX = 500
