import { useCallback, useEffect, useState } from 'react'
import { createLocation, deleteLocation, listLocations, updateLocation } from '../api/locations'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'

export default function Locations() {
  const { user } = useAuth()
  const canWrite = ['admin', 'staff'].includes(user?.role)
  const canDelete = user?.role === 'admin'

  const [items, setItems] = useState([])
  const [page, setPage]   = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [q, setQ]         = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null) // null | { mode: 'create'|'edit', item }
  const [form, setForm]   = useState({ name: '', description: '' })
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true); setError(null)
    listLocations({ q: q || undefined, page, per_page: 20 })
      .then((d) => { setItems(d.items); setPages(d.pages); setTotal(d.total) })
      .catch(setError).finally(() => setLoading(false))
  }, [q, page])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm({ name: '', description: '' }); setFormError(null); setModal({ mode: 'create' }) }
  const openEdit   = (item) => { setForm({ name: item.name, description: item.description || '' }); setFormError(null); setModal({ mode: 'edit', item }) }
  const closeModal = () => setModal(null)

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setFormError(null)
    try {
      if (modal.mode === 'create') await createLocation(form)
      else await updateLocation(modal.item.id, form)
      closeModal(); load()
    } catch (err) { setFormError(err) } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this location? Equipment assigned here will be unlinked.')) return
    try { await deleteLocation(id); load() }
    catch (err) { alert(err?.response?.data?.message || 'Delete failed') }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        {canWrite && <button className="btn-primary" onClick={openCreate}>+ Add location</button>}
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search…" className="input max-w-xs" value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }} />
      </div>

      <div className="card overflow-hidden">
        {error && <div className="p-4"><ErrorMessage error={error} /></div>}
        {loading ? <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>
          : items.length === 0 ? <EmptyState icon="📍" title="No locations found" message="Try a different search, or add a new location." action={canWrite && <button className="btn-primary" onClick={openCreate}>+ Add location</button>} />
          : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
              <tr>
                <th scope="col" className="px-4 py-2 text-left">Name</th>
                <th scope="col" className="px-4 py-2 text-left">Description</th>
                {canWrite && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{loc.name}</td>
                  <td className="px-4 py-2.5 text-gray-500">{loc.description || '—'}</td>
                  {canWrite && (
                    <td className="px-4 py-2.5 text-right flex gap-3 justify-end">
                      <button onClick={() => openEdit(loc)} className="text-xs text-brand-600 hover:underline">Edit</button>
                      {canDelete && <button onClick={() => handleDelete(loc.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4"><Pagination page={page} pages={pages} total={total} onPage={setPage} /></div>
      </div>

      <Modal open={!!modal} onClose={closeModal} title={modal?.mode === 'create' ? 'Add location' : 'Edit location'}
        footer={<>
          <button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-primary" form="loc-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </>}
      >
        <ErrorMessage error={formError} />
        <form id="loc-form" onSubmit={handleSubmit} className="mt-2 space-y-3">
          <div>
            <label className="label">Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
