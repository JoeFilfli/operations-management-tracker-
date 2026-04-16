import client from './client'

export const listTickets = (params) =>
  client.get('/tickets', { params }).then((r) => r.data)

export const getTicket = (id) =>
  client.get(`/tickets/${id}`).then((r) => r.data)

export const updateTicket = (id, payload) =>
  client.patch(`/tickets/${id}`, payload).then((r) => r.data)

export const createTicket = (payload) =>
  client.post('/tickets', payload).then((r) => r.data)
