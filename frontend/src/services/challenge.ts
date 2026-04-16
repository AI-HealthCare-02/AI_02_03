import api from '../lib/api'

export const challengeService = {
  getAll: () =>
    api.get('/api/v1/challenges').then((res) => res.data),

  join: (challengeId: number) =>
    api.post(`/api/v1/challenges/${challengeId}/join`).then((res) => res.data),

  getMy: (status?: '진행중' | '완료' | '포기') =>
    api.get('/api/v1/user-challenges/me', { params: status ? { status } : {} }).then((res) => res.data),

  complete: (userChallengeId: number) =>
    api.patch(`/api/v1/user-challenges/${userChallengeId}/complete`).then((res) => res.data),

  log: (userChallengeId: number, isCompleted: boolean) =>
    api.post(`/api/v1/user-challenges/${userChallengeId}/logs`, { is_completed: isCompleted }).then((res) => res.data),
}
