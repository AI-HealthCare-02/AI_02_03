import api from '../lib/api'

export const dashboardService = {
  get: () =>
    api.get('/api/v1/dashboard').then((res) => res.data),

  predict: () =>
    api.post('/api/v1/predictions').then((res) => res.data),

  getPredictions: () =>
    api.get('/api/v1/predictions/me').then((res) => res.data),
}
