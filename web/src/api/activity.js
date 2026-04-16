import client from './client'

export const listActivity = (params) =>
  client.get('/activity', { params }).then((r) => r.data)
