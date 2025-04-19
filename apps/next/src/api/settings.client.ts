import axios from 'axios'

export type userSettingsObject = {
  id: string
  userId: string
  theme: string
  notificationsEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export async function createDefaultSettings() {
  const { data } = await axios.post<userSettingsObject>('/api/user/settings')

  return data
}
