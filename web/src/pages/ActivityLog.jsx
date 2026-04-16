import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listActivity } from '../api/activity'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import Pagination from '../components/Pagination'

const ENTITY_TYPES = ['', 'User', 'Location', 'Equipment', 'MaintenanceTicket', 'TicketAssignment']
const ACTIONS = ['', 'create', 'update', 'delete']

const ACTION_STYLES = {
  create: 'text-green-700 font-semibold',
  update: 'text-blue-700 font-semibold',
  delete: 'text-red-600 font-semibold',
}

const ENTITY_ROUTES = {
  Equipment:         (id) => `/equipment/${id}`,
  MaintenanceTicket: (id) => `/tickets/${id}`,
}

export default function ActivityLog() {
  const [items, setItems]           = useState([])
  const [page, setPage]             = useState(1)
  const [pages, setPages]           = useState(1)
  const [total, setTotal]           = useState(0)
  const [entityType, setEntityType] = useState('')
  const [action, setAction]         = useState('')
  const [since, setSince]           = useState('')
  const [until, setUntil]           = useState('')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const load = useCallback(() => {
    setLoading(true); setError(null)
    listActivity({
      entity_type: entityType || undefined,
      action:      action     || undefined,
      since:       since      || undefined,
      until:       until      || undefined,
      page,
      per_page: 25,
    })
      .then((d) => { setItems(d.items); setPages(d.pages); setTotal(d.total) })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [entityType, action, since, until, page])

  useEffect(() => { load() }, [load])

  const hasFilters = entityType || action || since || until
  const clearFilters = () => { setEntityType(''); setAction(''); setSince(''); setUntil(''); setPage(1) }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Log</h1>

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="label" htmlFor="al-type">Entity type</label>
          <select id="al-type" className="input w-52" value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1) }}>
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t || 'All types'}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="al-action">Action</label>
          <select id="al-action" className="input w-36" value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1) }}>
            {ACTIONS.map((a) => <option key={a} value={a}>{a || 'All actions'}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="al-since">From</label>
          <input id="al-since" type="date" className="input w-40" value={since}
            onChange={(e) => { setSince(e.target.value); setPage(1) }} />
        </div>
        <div>
          <label className="label" htmlFor="al-until">To</label>
          <input id="al-until" type="date" className="input w-40" value={until}
            onChange={(e) => { setUntil(e.target.value); setPage(1) }} />
        </div>
        {hasFilters && (
          <button className="btn-secondary self-end" onClick={clearFilters}>Clear filters</button>
        )}
      </div>

      <div className="card overflow-hidden">
        {error && <div className="p-4"><ErrorMessage error={error} /></div>}
        {loading ? (
          <p className="px-5 py-4 text-sm text-gray-400" aria-live="polite">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState icon="📋" title="No activity found" message="Try adjusting your filters." />
        ) : (
          <table className="w-full text-sm" aria-label="Activity log">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
              <tr>
                <th scope="col" className="px-4 py-2 text-left">Time</th>
                <th scope="col" className="px-4 py-2 text-left">Actor</th>
                <th scope="col" className="px-4 py-2 text-left">Action</th>
                <th scope="col" className="px-4 py-2 text-left">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((entry) => {
                const route = ENTITY_ROUTES[entry.entity_type]?.(entry.entity_id)
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                      <time dateTime={entry.created_at}>
                        {new Date(entry.created_at).toLocaleString()}
                      </time>
                    </td>
                    <td className="px-4 py-2.5">
                      {entry.actor ? (
                        <span>
                          <span className="font-medium text-gray-700">{entry.actor.full_name}</span>
                          <span className="text-gray-400 text-xs ml-1">({entry.actor.email})</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">System</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`capitalize ${ACTION_STYLES[entry.action] ?? 'text-gray-700'}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-gray-500 mr-1">{entry.entity_type}</span>
                      {route ? (
                        <Link to={route} className="text-brand-600 hover:underline font-mono text-xs">
                          #{entry.entity_id}
                        </Link>
                      ) : (
                        <span className="text-gray-500 font-mono text-xs">#{entry.entity_id}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <div className="px-4">
          <Pagination page={page} pages={pages} total={total} onPage={setPage} />
        </div>
      </div>
    </div>
  )
}
