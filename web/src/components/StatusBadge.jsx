const EQUIPMENT_COLORS = {
  available:   'bg-green-100 text-green-800',
  in_use:      'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  retired:     'bg-gray-100 text-gray-600',
}

const TICKET_STATUS_COLORS = {
  open:        'bg-red-100 text-red-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved:    'bg-green-100 text-green-800',
  closed:      'bg-gray-100 text-gray-600',
}

const PRIORITY_COLORS = {
  low:      'bg-gray-100 text-gray-600',
  medium:   'bg-blue-100 text-blue-800',
  high:     'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-800',
  staff: 'bg-brand-100 text-brand-700',
  field: 'bg-teal-100 text-teal-800',
}

const TYPE_LABELS = {
  equipment: 'equipment status',
  ticket: 'ticket status',
  priority: 'priority',
  role: 'role',
}

export default function StatusBadge({ value, type = 'equipment' }) {
  const map = { equipment: EQUIPMENT_COLORS, ticket: TICKET_STATUS_COLORS, priority: PRIORITY_COLORS, role: ROLE_COLORS }
  const color = (map[type] ?? {})[value] ?? 'bg-gray-100 text-gray-600'
  const label = value?.replace(/_/g, ' ') ?? '—'
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${color}`}
      aria-label={`${TYPE_LABELS[type] ?? type}: ${label}`}
    >
      {label}
    </span>
  )
}
