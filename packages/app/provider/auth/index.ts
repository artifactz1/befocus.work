import { create } from 'zustand'

import { createSelectors } from '../utils'
import type { TokenType } from './utils'
import { getToken, removeToken, setToken } from './utils'

type AuthStatus = 'idle' | 'signOut' | 'signIn'

type AuthState = {
  token: TokenType | null
  status: AuthStatus
  signIn: (data: TokenType) => void
  signOut: () => void
  hydrate: () => void
}

const _useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  signIn: token => {
    setToken(token)
    set({ status: 'signIn', token })
  },
  signOut: () => {
    removeToken()
    set({ status: 'signOut', token: null })
  },
  hydrate: async () => {
    try {
      const userToken = await getToken()
      if (userToken !== null) {
        get().signIn(userToken)
      } else {
        get().signOut()
      }
    } catch (_error) {
      get().signOut() // Signout if there is an error
    }
  },
}))

export const useAuth = createSelectors(_useAuth)

export const signOut = () => _useAuth.getState().signOut()
export const signIn = (token: TokenType) => _useAuth.getState().signIn(token)
export const hydrateAuth = () => _useAuth.getState().hydrate()
