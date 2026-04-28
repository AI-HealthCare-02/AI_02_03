import api from '../lib/api'

const TOKEN_KEY = 'access_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export const authService = {
  signup: (data: { email: string; password: string; nickname: string }) =>
    api.post('/api/v1/auth/signup', data),

  login: async (data: { email: string; password: string }, autoLogin = false) => {
    const res = await api.post('/api/v1/auth/login', data)
    const token = res.data.access_token
    if (autoLogin) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      sessionStorage.setItem(TOKEN_KEY, token)
      localStorage.removeItem(TOKEN_KEY)
    }
    return res.data
  },

  logout: async () => {
    await api.post('/api/v1/auth/logout')
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  },

  me: () => api.get('/api/v1/users/me').then((res) => res.data),

  updateUser: (data: { nickname?: string; password?: string }) =>
    api.patch('/api/v1/users/me', data).then((res) => res.data),

  deleteUser: () =>
    api.delete('/api/v1/users/me').then((res) => res.data),

}
