import api from '../lib/api'

export const appointmentService = {
  getAll: () =>
    api.get('/api/v1/appointments/me').then((res) => res.data),

  create: (data: { hospital_name: string; visit_date: string; memo?: string }) =>
    api.post('/api/v1/appointments', data).then((res) => res.data),

  delete: (id: number) =>
    api.delete(`/api/v1/appointments/${id}`).then((res) => res.data),
}

export const medicationService = {
  getAll: () =>
    api.get('/api/v1/medications/me').then((res) => res.data),

  create: (data: { name: string; dosage: string; schedule: string }) =>
    api.post('/api/v1/medications', data).then((res) => res.data),

  checkTaken: (id: number, takenToday: boolean) =>
    api.patch(`/api/v1/medications/${id}/taken`, { taken_today: takenToday }).then((res) => res.data),

  delete: (id: number) =>
    api.delete(`/api/v1/medications/${id}`).then((res) => res.data),
}
