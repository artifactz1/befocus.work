// ~/types/tasks.ts
export interface Task {
  id: number
  text: string
  completed: boolean
  archived: boolean
  createdAt?: string
  editMode: boolean // always required
}