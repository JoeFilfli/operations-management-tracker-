import client from './client'

export const listEquipment = (params) =>
  client.get('/equipment', { params }).then((r) => r.data)

export const getEquipment = (id) =>
  client.get(`/equipment/${id}`).then((r) => r.data)

export const updateEquipment = (id, payload) =>
  client.patch(`/equipment/${id}`, payload).then((r) => r.data)
