import client from './client'

export const listLocations = (params) =>
  client.get('/locations', { params }).then((r) => r.data)

export const getLocation = (id) =>
  client.get(`/locations/${id}`).then((r) => r.data)

export const createLocation = (payload) =>
  client.post('/locations', payload).then((r) => r.data)

export const updateLocation = (id, payload) =>
  client.patch(`/locations/${id}`, payload).then((r) => r.data)

export const deleteLocation = (id) =>
  client.delete(`/locations/${id}`)
