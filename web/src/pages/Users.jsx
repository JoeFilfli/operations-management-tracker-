import { useCallback, useEffect, useState } from 'react'
import { createUser, deleteUser, listUsers, updateUser } from '../api/users'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import { useAuth } from '../context/AuthContext'

const ROLES = ['admin', 'staff', 'field']
const EMPTY_FORM = { email: '', full_name: '', password: '', role: 'staff', is_active: true }

export default function Users() {
  const { user: me } = useAuth()
  const [items, setItems] = useState([])
  const [page, setPage]   = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [q, setQ]         = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm]   = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true); setError(null)
    listUsers({ q: q || undefined, page, per_page: 20 })
      .then((d) => { setItems(d.items); setPages(d.pages); setTotal(d.total) })
      .catch(setError).finally(() => setLoading(false))
  }, [q, page])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(null); setModal({ mode: 'create' }) }
  const openEdit   = (item) => {
    setForm({ email: item.email, full_name: item.full_name, password: '', role: item.role, is_active: item.is_active })
    setFormError(null); setModal({ mode: 'edit', item })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setFormError(null)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (modal.mode === 'create') await createUser(payload)
      else await updateUser(modal.item.id, payload)
      setModal(null); load()
    } catch (err) { setFormError(err) } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (id === me?.id) return alert('You cannot delete your own account.')
    if (!confirm('Delete this user?')) return
    try { await deleteUser(id); load() }
    catch (err) { alert(err?.response?.data?.message || 'Delete failed') }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button className="btn-primary" onClick={openCreate}>+ Add user</button>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search email or name…" className="input max-w-xs" value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }} />
      </div>

      <div className="card overflow-hidden">
        {error && <div className="p-4"><ErrorMessage error={error} /></div>}
        {loading ? <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>
          : items.length === 0 ? <EmptyState icon="👤" title="No users found" message="Try a different search, or add a new user." action={<button className="btn-primary" onClick={openCreate}>+ Add user</button>} />
          : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
              <tr>
                <th scope="col" className="px-4 py-2 text-left">Name</th>
                <th scope="col" className="px-4 py-2 text-left">Email</th>
                <th scope="col" className="px-4 py-2 text-left">Role</th>
                <th scope="col" className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium">{u.full_name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{u.email}</td>
                  <td className="px-4 py-2.5"><StatusBadge value={u.role} type="role" /></td>
                  <td className="px-4 py-2.5">
                    {u.is_active ? <span className="text-green-600 text-xs font-medium">Active</span>
                                 : <span className="text-gray-400 text-xs">Inactive</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right flex gap-3 justify-end">
                    <button onClick={() => openEdit(u)} className="text-xs text-brand-600 hover:underline">Edit</button>
                    {u.id !== me?.id && <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4"><Pagination page={page} pages={pages} total={total} onPage={setPage} /></div>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add user' : 'Edit user'}
        footer={<>
          <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn-primary" form="user-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </>}
      >
        <ErrorMessage error={formError} />
        <form id="user-form" onSubmit={handleSubmit} className="mt-2 space-y-3">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">{modal?.mode === 'create' ? 'Password *' : 'Password (leave blank to keep)'}</label>
            <input className="input" type="password" required={modal?.mode === 'create'} minLength={8}
              value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
            Active
          </label>
        </form>
      </Modal>
    </div>
  )
}
