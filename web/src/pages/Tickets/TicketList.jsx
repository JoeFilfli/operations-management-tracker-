import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createTicket, listTickets } from '../../api/tickets'
import { listEquipment } from '../../api/equipment'
import StatusBadge from '../../components/StatusBadge'
import Pagination from '../../components/Pagination'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'

const STATUSES  = ['', 'open', 'in_progress', 'resolved', 'closed']
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical']
const EMPTY_FORM = { title: '', description: '', equipment_id: '', priority: 'medium' }

export default function TicketList() {
  const [items, setItems]   = useState([])
  const [page, setPage]     = useState(1)
  const [pages, setPages]   = useState(1)
  const [total, setTotal]   = useState(0)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [mine, setMine]     = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [equipment, setEquipment] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true); setError(null)
    listTickets({ status: status||undefined, priority: priority||undefined, mine: mine||undefined, page, per_page: 20 })
      .then((d) => { setItems(d.items); setPages(d.pages); setTotal(d.total) })
      .catch(setError).finally(() => setLoading(false))
  }, [status, priority, mine, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { listEquipment({ per_page: 200 }).then((d) => setEquipment(d.items)).catch(() => {}) }, [])

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setFormError(null)
    try {
      await createTicket({ ...form, equipment_id: Number(form.equipment_id) })
      setShowCreate(false); setForm(EMPTY_FORM); load()
    } catch (err) { setFormError(err) } finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New ticket</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g,' ') : 'All statuses'}</option>)}
        </select>
        <select className="input w-40" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1) }}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p || 'All priorities'}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={mine} onChange={(e) => { setMine(e.target.checked); setPage(1) }} className="rounded" />
          My tickets
        </label>
      </div>

      <div className="card overflow-hidden">
        {error && <div className="p-4"><ErrorMessage error={error} /></div>}
        {loading ? <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>
          : items.length === 0 ? <EmptyState icon="🔧" title="No tickets found" message="Try adjusting your filters, or create a new ticket." action={<button className="btn-primary" onClick={() => setShowCreate(true)}>+ New ticket</button>} />
          : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
              <tr>
                <th scope="col" className="px-4 py-2 text-left">#</th>
                <th scope="col" className="px-4 py-2 text-left">Title</th>
                <th scope="col" className="px-4 py-2 text-left">Status</th>
                <th scope="col" className="px-4 py-2 text-left">Priority</th>
                <th scope="col" className="px-4 py-2 text-left">Equipment</th>
                <th scope="col" className="px-4 py-2 text-left">Reporter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-400">#{t.id}</td>
                  <td className="px-4 py-2.5 max-w-xs truncate">
                    <Link to={`/tickets/${t.id}`} className="font-medium text-brand-600 hover:underline">{t.title}</Link>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge value={t.status} type="ticket" /></td>
                  <td className="px-4 py-2.5"><StatusBadge value={t.priority} type="priority" /></td>
                  <td className="px-4 py-2.5 text-gray-600">{t.equipment?.name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500">{t.reporter?.full_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4"><Pagination page={page} pages={pages} total={total} onPage={setPage} /></div>
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(EMPTY_FORM); setFormError(null) }} title="New ticket"
        footer={<>
          <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
          <button className="btn-primary" form="create-ticket" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
        </>}
      >
        <ErrorMessage error={formError} />
        <form id="create-ticket" onSubmit={handleCreate} className="mt-2 space-y-3">
          <div>
            <label className="label">Title *</label>
            <input className="input" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Equipment *</label>
            <select className="input" required value={form.equipment_id} onChange={(e) => setForm((f) => ({ ...f, equipment_id: e.target.value }))}>
              <option value="">— Select —</option>
              {equipment.map((eq) => <option key={eq.id} value={eq.id}>{eq.name} ({eq.asset_tag})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
              {PRIORITIES.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
