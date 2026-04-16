export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-4xl mb-3" aria-hidden="true">{icon}</span>
      <p className="text-sm font-semibold text-gray-700 mb-1">{title}</p>
      {message && <p className="text-sm text-gray-400 mb-4">{message}</p>}
      {action}
    </div>
  )
}
