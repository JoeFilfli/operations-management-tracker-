import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listEquipment, createEquipment, deleteEquipment } from '../../api/equipment'
import { listLocations } from '../../api/locations'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import Pagination from '../../components/Pagination'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'

const STATUSES = ['', 'available', 'in_use', 'maintenance', 'retired']

const EMPTY_FORM = { asset_tag: '', name: '', description: '', manufacturer: '', model: '', serial_number: '', status: 'available', location_id: '' }

export default function EquipmentList() {
  const { user } = useAuth()
  const canWrite = ['admin', 'staff'].includes(user?.role)
  const canDelete = user?.role === 'admin'

  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    listEquipment({ q: q || undefined, status: status || undefined, page, per_page: 20 })
      .then((d) => { setItems(d.items); setPages(d.pages); setTotal(d.total) })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [q, status, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { listLocations({ per_page: 100 }).then((d) => setLocations(d.items)).catch(() => {}) }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true); setFormError(null)
    try {
      const payload = { ...form, location_id: form.location_id ? Number(form.location_id) : null }
      await createEquipment(payload)
      setShowCreate(false); setForm(EMPTY_FORM); load()
    } catch (err) { setFormError(err) } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this equipment? This will also delete all its tickets.')) return
    try { await deleteEquipment(id); load() } catch (err) { alert(err?.response?.data?.message || 'Delete failed') }
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
        {canWrite && <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Add equipment</button>}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name, asset tag…"
          className="input max-w-xs"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
        />
        <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {error && <div className="p-4"><ErrorMessage error={error} /></div>}
        {loading ? (
          <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState icon="⚙️" title="No equipment found" message="Try adjusting your filters, or add new equipment." action={canWrite && <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Add equipment</button>} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
              <tr>
                <th scope="col" className="px-4 py-2 text-left">Asset Tag</th>
                <th scope="col" className="px-4 py-2 text-left">Name</th>
                <th scope="col" className="px-4 py-2 text-left">Status</th>
                <th scope="col" className="px-4 py-2 text-left">Location</th>
                {canDelete && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{eq.asset_tag}</td>
                  <td className="px-4 py-2.5">
                    <Link to={`/equipment/${eq.id}`} className="font-medium text-brand-600 hover:underline">{eq.name}</Link>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge value={eq.status} type="equipment" /></td>
                  <td className="px-4 py-2.5 text-gray-600">{eq.location?.name ?? '—'}</td>
                  {canDelete && (
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => handleDelete(eq.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4"><Pagination page={page} pages={pages} total={total} onPage={setPage} /></div>
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(EMPTY_FORM); setFormError(null) }} title="Add equipment"
        footer={<>
          <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
          <button className="btn-primary" form="create-eq" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
        </>}
      >
        <ErrorMessage error={formError} />
        <form id="create-eq" onSubmit={handleCreate} className="mt-2 space-y-3">
          {[['asset_tag','Asset Tag',true],['name','Name',true],['description','Description',false],['manufacturer','Manufacturer',false],['model','Model',false],['serial_number','Serial Number',false]].map(([k,l,req]) => (
            <div key={k}>
              <label className="label">{l}{req && ' *'}</label>
              <input className="input" required={req} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              {STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <select className="input" value={form.location_id} onChange={(e) => setForm((f) => ({ ...f, location_id: e.target.value }))}>
              <option value="">— None —</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
