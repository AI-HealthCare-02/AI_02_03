import { create } from 'zustand'
import { authService, getStoredToken } from '../services/auth'

interface User {
  id: number
  email: string
  nickname: string
  is_onboarded: boolean
}

interface AuthStore {
  user: User | null
  isLoggedIn: boolean
  fetchMe: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoggedIn: !!getStoredToken(),

  fetchMe: async () => {
    const user = await authService.me()
    set({ user, isLoggedIn: true })
  },

  logout: async () => {
    await authService.logout()
    set({ user: null, isLoggedIn: false })
  },
}))
