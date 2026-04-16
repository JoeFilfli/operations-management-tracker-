import client from './client'

export const listUsers = (params) =>
  client.get('/users', { params }).then((r) => r.data)

export const getUser = (id) =>
  client.get(`/users/${id}`).then((r) => r.data)

export const createUser = (payload) =>
  client.post('/users', payload).then((r) => r.data)

export const updateUser = (id, payload) =>
  client.patch(`/users/${id}`, payload).then((r) => r.data)

export const deleteUser = (id) =>
  client.delete(`/users/${id}`)

export const updateMyProfile = (payload) =>
  client.patch('/users/me', payload).then((r) => r.data)
