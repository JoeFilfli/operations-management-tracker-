import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteTicket, getTicket, updateTicket, addAssignment, removeAssignment } from '../../api/tickets'
import { listUsers } from '../../api/users'
import { useAuth } from '../../context/AuthContext'
import ErrorMessage from '../../components/ErrorMessage'
import NotFound from '../../components/NotFound'
import StatusBadge from '../../components/StatusBadge'

const STATUSES   = ['open', 'in_progress', 'resolved', 'closed']
const PRIORITIES = ['low', 'medium', 'high', 'critical']

export default function TicketDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const canManage = ['admin', 'staff'].includes(user?.role)

  const [ticket, setTicket]   = useState(null)
  const [users, setUsers]     = useState([])
  const [error, setError]     = useState(null)
  const [saving, setSaving]   = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [newAssignee, setNewAssignee] = useState('')

  const reload = () => getTicket(id).then(setTicket).catch(setError)

  useEffect(() => { reload() }, [id])
  useEffect(() => {
    if (canManage) listUsers({ per_page: 200 }).then((d) => setUsers(d.items)).catch(() => {})
  }, [canManage])

  const handleField = async (field, value) => {
    setSaveError(null); setSaving(true)
    try { const updated = await updateTicket(id, { [field]: value }); setTicket(updated) }
    catch (err) { setSaveError(err) } finally { setSaving(false) }
  }

  const handleAddAssignment = async () => {
    if (!newAssignee) return
    try { await addAssignment(id, Number(newAssignee)); setNewAssignee(''); reload() }
    catch (err) { setSaveError(err) }
  }

  const handleRemoveAssignment = async (userId) => {
    try { await removeAssignment(id, userId); reload() }
    catch (err) { setSaveError(err) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this ticket?')) return
    try { await deleteTicket(id); navigate('/tickets') }
    catch (err) { alert(err?.response?.data?.message || 'Delete failed') }
  }

  if (error) return error?.response?.status === 404
    ? <NotFound label="Ticket" backTo="/tickets" backLabel="Back to tickets" />
    : <div className="p-8"><ErrorMessage error={error} /></div>
  if (!ticket) return <p className="p-8 text-gray-400">Loading…</p>

  const assignedIds = new Set(ticket.assignments.map((a) => a.user_id))
  const unassigned = users.filter((u) => !assignedIds.has(u.id))

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link to="/tickets" className="hover:text-brand-600">Tickets</Link>
        <span>/</span>
        <span className="text-gray-700">#{ticket.id}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
        {canManage && (
          <button className="btn-danger ml-4 flex-shrink-0" onClick={handleDelete}>Delete</button>
        )}
      </div>

      {saveError && <div className="mb-4"><ErrorMessage error={saveError} /></div>}

      <div className="card p-5 mb-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div>
          <span className="text-gray-500 block mb-1">Status</span>
          <select
            className="input w-full"
            value={ticket.status}
            onChange={(e) => handleField('status', e.target.value)}
            disabled={saving}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <div>
          <span className="text-gray-500 block mb-1">Priority</span>
          <select
            className="input w-full"
            value={ticket.priority}
            onChange={(e) => handleField('priority', e.target.value)}
            disabled={saving || !canManage}
          >
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <span className="text-gray-500">Equipment</span>
          <div className="mt-1 font-medium">
            <Link to={`/equipment/${ticket.equipment_id}`} className="text-brand-600 hover:underline">
              {ticket.equipment?.name ?? '—'}
            </Link>
            <span className="text-gray-400 font-mono text-xs ml-2">({ticket.equipment?.asset_tag})</span>
          </div>
        </div>
        <div>
          <span className="text-gray-500">Reporter</span>
          <div className="mt-1 font-medium">{ticket.reporter?.full_name ?? '—'}</div>
        </div>
        {ticket.resolved_at && (
          <div className="col-span-2">
            <span className="text-gray-500">Resolved at</span>
            <div className="mt-1">{new Date(ticket.resolved_at).toLocaleString()}</div>
          </div>
        )}
        {ticket.description && (
          <div className="col-span-2">
            <span className="text-gray-500">Description</span>
            <div className="mt-1 whitespace-pre-wrap">{ticket.description}</div>
          </div>
        )}
      </div>

      <h2 className="font-semibold text-gray-700 mb-3">Assignees</h2>
      <div className="card p-4 mb-2">
        {ticket.assignments.length === 0 ? (
          <p className="text-sm text-gray-400">No one assigned.</p>
        ) : (
          <ul className="space-y-1.5 mb-3">
            {ticket.assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span>{a.user?.full_name} <span className="text-gray-400 text-xs">({a.user?.email})</span></span>
                {canManage && (
                  <button onClick={() => handleRemoveAssignment(a.user_id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canManage && unassigned.length > 0 && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
            <select className="input flex-1" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
              <option value="">Assign someone…</option>
              {unassigned.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
            </select>
            <button className="btn-secondary" onClick={handleAddAssignment} disabled={!newAssignee}>Assign</button>
          </div>
        )}
      </div>
    </div>
  )
}
