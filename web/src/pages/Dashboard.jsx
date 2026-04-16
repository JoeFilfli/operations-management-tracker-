import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api/dashboard'
import { SkeletonRow, SkeletonStatCard } from '../components/Skeleton'
import StatusBadge from '../components/StatusBadge'

function StatCard({ label, value, color = 'text-gray-900', loading }) {
  if (loading) return <SkeletonStatCard />
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '0'}</p>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const loading = !data && !error

  useEffect(() => {
    getDashboard().then(setData).catch(setError)
  }, [])

  if (error) return (
    <div className="p-8">
      <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        Failed to load dashboard. Please refresh the page.
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Equipment</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8" aria-busy={loading}>
        <StatCard label="Available"   value={data?.equipment.available}   color="text-green-700"  loading={loading} />
        <StatCard label="In Use"      value={data?.equipment.in_use}      color="text-blue-700"   loading={loading} />
        <StatCard label="Maintenance" value={data?.equipment.maintenance} color="text-yellow-700" loading={loading} />
        <StatCard label="Retired"     value={data?.equipment.retired}     color="text-gray-500"   loading={loading} />
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tickets</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8" aria-busy={loading}>
        <StatCard label="Open"        value={data?.tickets.open}        color="text-red-700"    loading={loading} />
        <StatCard label="In Progress" value={data?.tickets.in_progress} color="text-yellow-700" loading={loading} />
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Open Tickets</h2>
      <div className="card overflow-hidden">
        <table className="w-full text-sm" aria-label="Open tickets" aria-busy={loading}>
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
            <tr>
              <th scope="col" className="px-4 py-2 text-left">ID</th>
              <th scope="col" className="px-4 py-2 text-left">Title</th>
              <th scope="col" className="px-4 py-2 text-left">Priority</th>
              <th scope="col" className="px-4 py-2 text-left">Equipment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
            ) : data.recentTickets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                  No open tickets — everything looks good!{' '}
                  <Link to="/tickets" className="text-brand-600 hover:underline">View all tickets</Link>
                </td>
              </tr>
            ) : (
              data.recentTickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-gray-400">#{t.id}</td>
                  <td className="px-4 py-2.5">
                    <Link to={`/tickets/${t.id}`} className="font-medium text-brand-600 hover:underline">
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge value={t.priority} type="priority" /></td>
                  <td className="px-4 py-2.5 text-gray-600">{t.equipment?.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && (
          <div className="px-4 py-2 border-t border-gray-100 text-right">
            <Link to="/tickets" className="text-sm text-brand-600 hover:underline">View all tickets →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
