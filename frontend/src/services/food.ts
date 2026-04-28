import api from '../lib/api'

export const foodService = {
  analyze: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/api/v1/food/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data)
  },

  getMy: () =>
    api.get('/api/v1/food/me').then((res) => res.data),

  delete: (id: number) =>
    api.delete(`/api/v1/food/${id}`),
}
