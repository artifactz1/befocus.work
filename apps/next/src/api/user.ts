import axios from 'axios'

export type sessionObject = {
  id: 'string' // primary key
  expiresAt: 'Date' // not null
  token: 'string' // unique, not null
  createdAt: 'Date' // not null
  updatedAt: 'Date' // not null
  ipAddress: 'string | null'
  userAgent: 'string | null'
  userId: 'string' // foreign key to user.id, not null
}
export type userObject = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export async function getUser() {
  const { data } = await axios.get<userObject>('api/user/')
  return data
}

export async function getUserSession() {
  const { data } = await axios.get<sessionObject>('api/user/session')
  return data
}
