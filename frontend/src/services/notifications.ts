import api from '../lib/api'

export type NotificationSettings = {
  push_enabled: boolean
  appointment_reminder: boolean
  challenge_reminder: boolean
  weekly_report: boolean
}

export const notificationsService = {
  getSettings: () =>
    api.get('/api/v1/notifications/settings').then((res) => res.data as NotificationSettings),

  updateSettings: (data: Partial<NotificationSettings>) =>
    api.put('/api/v1/notifications/settings', data).then((res) => res.data),
}
