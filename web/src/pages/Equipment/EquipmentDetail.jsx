import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getEquipment, updateEquipment, deleteEquipment } from '../../api/equipment'
import { listTickets } from '../../api/tickets'
import { listLocations } from '../../api/locations'
import { useAuth } from '../../context/AuthContext'
import ErrorMessage from '../../components/ErrorMessage'
import NotFound from '../../components/NotFound'
import StatusBadge from '../../components/StatusBadge'

const STATUSES = ['available', 'in_use', 'maintenance', 'retired']

export default function EquipmentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const canWrite = ['admin', 'staff'].includes(user?.role)

  const [eq, setEq] = useState(null)
  const [tickets, setTickets] = useState([])
  const [locations, setLocations] = useState([])
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    getEquipment(id).then((d) => { setEq(d); setForm({ name: d.name, description: d.description || '', manufacturer: d.manufacturer || '', model: d.model || '', serial_number: d.serial_number || '', status: d.status, location_id: d.location_id ?? '' }) }).catch(setError)
    listTickets({ equipment_id: id, per_page: 20 }).then((d) => setTickets(d.items)).catch(() => {})
    listLocations({ per_page: 100 }).then((d) => setLocations(d.items)).catch(() => {})
  }, [id])

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setSaveError(null)
    try {
      const updated = await updateEquipment(id, { ...form, location_id: form.location_id ? Number(form.location_id) : null })
      setEq(updated); setEditing(false)
    } catch (err) { setSaveError(err) } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this equipment and all its tickets?')) return
    try { await deleteEquipment(id); navigate('/equipment') }
    catch (err) { alert(err?.response?.data?.message || 'Delete failed') }
  }

  if (error) return error?.response?.status === 404
    ? <NotFound label="Equipment" backTo="/equipment" backLabel="Back to equipment" />
    : <div className="p-8"><ErrorMessage error={error} /></div>
  if (!eq) return <p className="p-8 text-gray-400">Loading…</p>

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link to="/equipment" className="hover:text-brand-600">Equipment</Link>
        <span>/</span>
        <span className="text-gray-700">{eq.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{eq.name}</h1>
          <p className="text-sm text-gray-500 font-mono mt-1">{eq.asset_tag}</p>
        </div>
        <div className="flex gap-2">
          {canWrite && !editing && <button className="btn-secondary" onClick={() => setEditing(true)}>Edit</button>}
          {user?.role === 'admin' && <button className="btn-danger" onClick={handleDelete}>Delete</button>}
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="card p-5 space-y-3 mb-6">
          <ErrorMessage error={saveError} />
          {[['name','Name',true],['description','Description',false],['manufacturer','Manufacturer',false],['model','Model',false],['serial_number','Serial Number',false]].map(([k,l,req]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input className="input" required={req} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <select className="input" value={form.location_id} onChange={(e) => setForm((f) => ({ ...f, location_id: e.target.value }))}>
              <option value="">— None —</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="card p-5 mb-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><span className="text-gray-500">Status</span><div className="mt-1"><StatusBadge value={eq.status} type="equipment" /></div></div>
          <div><span className="text-gray-500">Location</span><div className="mt-1 font-medium">{eq.location?.name ?? '—'}</div></div>
          <div><span className="text-gray-500">Manufacturer</span><div className="mt-1 font-medium">{eq.manufacturer || '—'}</div></div>
          <div><span className="text-gray-500">Model</span><div className="mt-1 font-medium">{eq.model || '—'}</div></div>
          <div><span className="text-gray-500">Serial Number</span><div className="mt-1 font-mono text-xs">{eq.serial_number || '—'}</div></div>
          {eq.description && <div className="col-span-2"><span className="text-gray-500">Description</span><div className="mt-1">{eq.description}</div></div>}
        </div>
      )}

      <h2 className="font-semibold text-gray-700 mb-3">Linked Tickets ({tickets.length})</h2>
      <div className="card overflow-hidden">
        {tickets.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-400">No tickets.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
              <tr>
                <th scope="col" className="px-4 py-2 text-left">ID</th>
                <th scope="col" className="px-4 py-2 text-left">Title</th>
                <th scope="col" className="px-4 py-2 text-left">Status</th>
                <th scope="col" className="px-4 py-2 text-left">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-400">#{t.id}</td>
                  <td className="px-4 py-2.5"><Link to={`/tickets/${t.id}`} className="text-brand-600 hover:underline">{t.title}</Link></td>
                  <td className="px-4 py-2.5"><StatusBadge value={t.status} type="ticket" /></td>
                  <td className="px-4 py-2.5"><StatusBadge value={t.priority} type="priority" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
