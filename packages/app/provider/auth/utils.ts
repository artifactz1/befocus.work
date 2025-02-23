import { getItem, removeItem, setItem } from './cookie-store'

const TOKEN = 'token'

export type TokenType = {
  session: string
  access: string
  refresh: string
}

export const getToken = () => getItem<TokenType>(TOKEN)
export const removeToken = () => removeItem(TOKEN)
export const setToken = (value: TokenType) => setItem<TokenType>(TOKEN, value)
