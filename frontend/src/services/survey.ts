import api from '../lib/api'

export const surveyService = {
  submit: (data: object) =>
    api.post('/api/v1/surveys', data).then((res) => res.data),

  getMy: () =>
    api.get('/api/v1/surveys/me').then((res) => res.data),

  update: (data: object) =>
    api.put('/api/v1/surveys/me', data).then((res) => res.data),
}
