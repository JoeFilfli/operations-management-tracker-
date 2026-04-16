import client from './client'

export const getDashboard = async () => {
  const [equipmentRes, openTickets, inProgressTickets] = await Promise.all([
    client.get('/equipment', { params: { per_page: 1 } }),
    client.get('/tickets', { params: { status: 'open', per_page: 1 } }),
    client.get('/tickets', { params: { status: 'in_progress', per_page: 1 } }),
  ])

  const [available, inUse, maintenance, retired] = await Promise.all([
    client.get('/equipment', { params: { status: 'available', per_page: 1 } }),
    client.get('/equipment', { params: { status: 'in_use', per_page: 1 } }),
    client.get('/equipment', { params: { status: 'maintenance', per_page: 1 } }),
    client.get('/equipment', { params: { status: 'retired', per_page: 1 } }),
  ])

  const recentTickets = await client.get('/tickets', {
    params: { status: 'open', per_page: 5 },
  })

  return {
    equipment: {
      total: equipmentRes.data.total,
      available: available.data.total,
      in_use: inUse.data.total,
      maintenance: maintenance.data.total,
      retired: retired.data.total,
    },
    tickets: {
      open: openTickets.data.total,
      in_progress: inProgressTickets.data.total,
    },
    recentTickets: recentTickets.data.items,
  }
}
