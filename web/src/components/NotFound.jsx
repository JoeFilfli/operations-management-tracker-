import { Link } from 'react-router-dom'

export default function NotFound({ label = 'resource', backTo = '/', backLabel = 'Go back' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <span className="text-5xl mb-4" aria-hidden="true">🔍</span>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">{label} not found</h2>
      <p className="text-sm text-gray-400 mb-6">
        It may have been deleted or the link is incorrect.
      </p>
      <Link to={backTo} className="btn-secondary">{backLabel}</Link>
    </div>
  )
}
