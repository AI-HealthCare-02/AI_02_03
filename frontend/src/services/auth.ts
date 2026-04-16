import api from '../lib/api'

export const authService = {
  signup: (data: { email: string; password: string; nickname: string }) =>
    api.post('/api/v1/auth/signup', data),

  login: async (data: { email: string; password: string }) => {
    const res = await api.post('/api/v1/auth/login', data)
    localStorage.setItem('access_token', res.data.access_token)
    return res.data
  },

  logout: async () => {
    await api.post('/api/v1/auth/logout')
    localStorage.removeItem('access_token')
  },

  me: () => api.get('/api/v1/users/me').then((res) => res.data),

  updateUser: (data: { nickname?: string; password?: string }) =>
    api.put('/api/v1/users/me', data).then((res) => res.data),

  deleteUser: () =>
    api.delete('/api/v1/users/me').then((res) => res.data),
}
